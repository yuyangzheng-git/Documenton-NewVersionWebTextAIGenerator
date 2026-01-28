# 写作指导块消失问题修复

## 问题描述

**问题1**: 流式生成完成后，写作指导（guide块）消失了 ❌
**问题2**: 生成的内容全部跑到了整篇文章的最下面，而不是紧跟在写作指导后面 ❌

## 根本原因

在 `app/word-editor/page.tsx` 第 515 行的条件判断中：

```typescript
// ❌ 错误的条件
if ((item.level === 2 || item.level === 3) && item.requirements && !item.content && !hasNextItemAsChild) {
  // 添加 guide 块
  // 添加 generated 块
}
```

**问题流程**：

1. 用户点击生成按钮
2. 流式生成过程中创建 `streaming-{itemId}-*` 块
3. 生成完成后：
   - `streaming-` 块转换为 `generated-` 块
   - **更新 outline**：`updateItem(outlineItemId, { content: generatedContent, ... })`
   - `item.content` 现在有值了 ❗
4. useEffect 触发重建块列表：
   - 检查条件：`!item.content` 现在是 **false**
   - 整个 if 块不执行
   - **guide 块不添加** ❌
   - **generated 块不内联添加** ❌
5. 剩余块逻辑将 generated 块添加到文章最后 ❌

## 修复方案

**文件**: `app/word-editor/page.tsx` 第 515-554 行

**修改**: 移除 `!item.content` 条件

```typescript
// ✅ 正确的条件
if ((item.level === 2 || item.level === 3) && item.requirements && !hasNextItemAsChild) {
  // 添加 guide 块（即使 content 有值）
  const guideBlockId = `guide-${item.id}`;
  // ... 添加 guide 块的逻辑 ...

  // 添加 generated 块到 guide 块后面
  const itemGeneratedBlocks = blocks.filter(b =>
    b.id.startsWith(`generated-${item.id}-`) &&
    b.properties?.isGenerated &&
    !generatedBlockIds.has(b.id)
  );

  if (itemGeneratedBlocks.length > 0) {
    console.log(`📦 Adding ${itemGeneratedBlocks.length} generated blocks after guide-${item.id}`);
    itemGeneratedBlocks.forEach(genBlock => {
      notionBlocks.push(genBlock);
      generatedBlockIds.add(genBlock.id);
    });
  }
}
```

**关键改进**：
- 移除了 `!item.content` 条件
- 即使生成完成后 `item.content` 有值，guide 块和 generated 块仍然正确添加
- 添加注释说明为什么不检查 `!item.content`

## 配合逻辑

**避免重复的 content 块** (第 556-562 行)：

```typescript
// 这个逻辑确保不会同时显示 generated 块和 content 块
const hasGeneratedBlocks = blocks.some(b =>
  b.id.startsWith(`generated-${item.id}-`) && b.properties?.isGenerated
);

if (item.content && !hasGeneratedBlocks) {
  // 只有在没有 generated 块时才添加 content 块
}
```

## 修复后的显示顺序

### 生成前
```
📄 二级标题（heading-{itemId}）
💡 写作指导（guide-{itemId}）
```

### 生成中
```
📄 二级标题（heading-{itemId}）
💡 写作指导（guide-{itemId}）
⏳ 流式生成中...（streaming-{itemId}-*，带 loading 标记）
```

### 生成完成后
```
📄 二级标题（heading-{itemId}）
💡 写作指导（guide-{itemId}）✅ 保留
📝 生成的段落1（generated-{itemId}-paragraph-...）✅ 紧跟指导
📊 生成的表格（generated-{itemId}-table-...）
📝 生成的段落2（generated-{itemId}-paragraph-...）
```

## 测试验证

### 测试步骤

1. 创建包含写作指导的章节
2. 点击"生成/重写"按钮
3. 等待流式生成完成

### 预期结果

✅ 写作指导块保持显示
✅ 生成的内容紧跟在写作指导块后面
✅ 内容不会跑到文章最后
✅ 控制台显示：`📦 Adding X generated blocks after guide-{itemId}`

### 调试日志

```javascript
// useEffect 重建块列表时
console.log(`📦 Adding 5 generated blocks after guide-3-1`);

// 验证 guide 块存在
const guideBlocks = notionBlocks.filter(b => b.type === 'guide');
console.log('Guide blocks:', guideBlocks.length); // 应该 > 0

// 验证 generated 块位置
const allBlocks = notionBlocks.map(b => ({ id: b.id, type: b.type }));
console.log('Block order:', allBlocks);
// 应该看到：[... heading ..., guide, generated, generated, ...]
```

## 相关问题

这个修复解决了之前位置修复的遗留问题：

- **之前的位置修复**: 添加了内联插入逻辑，在 outline 遍历时立即插入 generated 块
- **这次的修复**: 确保即使 `item.content` 有值，内联插入逻辑仍然执行

## 文件修改清单

| 文件 | 修改内容 | 行号 |
|------|---------|------|
| `app/word-editor/page.tsx` | 移除 `!item.content` 条件 | 515-517 |
| `app/word-editor/page.tsx` | 添加注释说明 | 515-516 |

## 注意事项

⚠️ **条件依赖**

代码现在依赖于：
- `item.requirements` 存在 → 显示 guide 块和 generated 块
- `!hasNextItemAsChild` → 不是父级章节（有子章节的不显示）

⚠️ **重新生成行为**

重新生成时：
1. 旧的 generated 块被删除（在 handleGenerationComplete 中）
2. 新的 generated 块插入到 guide 块后
3. guide 块始终保留

---

**修复时间**: 2026-01-28
**修复人**: Claude Code
**状态**: ✅ 已修复
