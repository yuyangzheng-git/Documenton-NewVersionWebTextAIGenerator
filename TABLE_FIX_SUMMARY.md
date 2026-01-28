# 表格消失问题修复总结

## 问题描述

在流式生成包含 Markdown 表格的内容后，表格能够正常显示。但在生成完成后，当 useEffect 重建块列表时，表格会从页面中消失。

## 根本原因分析

1. **流式生成的块 ID 格式**：
   - 流式生成时：`streaming-{outlineItemId}-{type}-{index}`
   - 生成完成后：`generated-{outlineItemId}-{type}-{timestamp}-{index}`

2. **useEffect 重建逻辑问题**：
   - useEffect 基于 outline 重建块列表时
   - 只保留 outline 相关的块（heading, guide, content 等）
   - `generated-` 开头的块被错误识别为"用户创建的块"
   - 由于 ID 已存在于 `generatedBlockIds`，被跳过
   - 导致表格等生成的内容从最终块列表中消失

3. **日志证据**：
   ```
   Skipping duplicate user-created block: generated-3-1-table-1769602874446-3
   ```

## 修复方案

### 修复 1：排除 generated- 块被识别为用户创建块

**文件**：`app/word-editor/page.tsx` 第 605-608 行

**修改前**：
```typescript
const userCreatedBlocks = blocks.filter(b => !outlineItemIds.has(b.id));
```

**修改后**：
```typescript
// Find user-created blocks
// Exclude blocks that are generated from streaming (start with "generated-")
const userCreatedBlocks = blocks.filter(b =>
  !outlineItemIds.has(b.id) && !b.id.startsWith('generated-')
);
```

### 修复 2：专门保留流式生成的块

**文件**：`app/word-editor/page.tsx` 第 644-699 行

**新增逻辑**：
```typescript
// Preserve generated streaming blocks (including tables)
// These blocks have IDs starting with "generated-" and contain actual content
// Only keep blocks that belong to outline items that still exist
const validOutlineIds = new Set(uniqueOutline.map(item => item.id));
const generatedStreamingBlocks = blocks.filter(b => {
  if (!b.id.startsWith('generated-') || !b.properties?.isGenerated) {
    return false;
  }

  // Extract outlineItemId from block ID: "generated-{outlineItemId}-..."
  const idParts = b.id.split('-');
  if (idParts.length < 3) return false;

  const outlineItemId = idParts[1]; // Second part is the outlineItemId

  // Only keep blocks that belong to existing outline items
  return validOutlineIds.has(outlineItemId);
});

// ... 插入到正确位置的逻辑
```

**关键改进**：
- 识别所有 `generated-` 开头且 `isGenerated: true` 的块
- 验证块所属的 outlineItemId 是否还存在
- 避免保留已删除章节的旧内容
- 保持块的原始位置

### 修复 3：生成完成时清理旧内容

**文件**：`app/word-editor/page.tsx` 第 360-389 行

**修改前**：
```typescript
// Remove all generating blocks after guide block
let removeCount = 0;
for (let i = guideBlockIndex + 1; i < newBlocks.length; i++) {
  if (newBlocks[i].properties?.isGenerating || newBlocks[i].properties?.loading) {
    removeCount++;
  } else if (newBlocks[i].type === 'h1' || newBlocks[i].type === 'h2' || newBlocks[i].type === 'h3') {
    break;
  } else {
    break;
  }
}
```

**修改后**：
```typescript
// Remove all blocks after guide block that belong to this outline item
// This includes: isGenerating, loading, and previously generated blocks
let removeCount = 0;
for (let i = guideBlockIndex + 1; i < newBlocks.length; i++) {
  const block = newBlocks[i];
  // Stop at next heading
  if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
    break;
  }
  // Remove if it's generating, loading, or a previously generated block for this item
  const isGeneratedForThisItem = block.id.startsWith(`generated-${outlineItemId}-`);
  if (block.properties?.isGenerating ||
      block.properties?.loading ||
      isGeneratedForThisItem) {
    removeCount++;
  } else {
    // Stop if we hit a block that's not related to this generation
    break;
  }
}
```

**关键改进**：
- 重新生成时，不仅删除 `isGenerating` 的块
- 也删除之前已经生成完成的块（`generated-{outlineItemId}-` 开头）
- 避免重复生成导致的内容重复

### 修复 4：流式更新时清理旧内容

**文件**：`app/word-editor/page.tsx` 第 201-219 行

**类似修改**：增加对 `generated-` 和 `streaming-` 开头块的清理。

### 修复 5：内联插入生成块到正确位置 🆕

**问题**：生成完成后，所有生成的内容（表格、段落）出现在章节末尾，而不是紧随 guide 块之后。

**根本原因**：
- 原先逻辑是先添加所有 outline 相关的块（heading, guide, content）
- 然后在末尾尝试插入 generated 块，通过查找前一个块的位置
- 位置查找经常失败，导致块被添加到数组末尾

**修复内容**：

**修改 5.1**：`app/word-editor/page.tsx` 第 515-551 行 - 内联插入生成块

```typescript
if ((item.level === 2 || item.level === 3) && item.requirements && !item.content && !hasNextItemAsChild) {
  // ... 添加 guide 块 ...

  // Insert generated blocks for this item right after the guide block
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
- 在 outline 遍历过程中，添加 guide 块后立即插入该章节的生成块
- 确保生成内容紧跟在 guide 块之后
- 使用 `generatedBlockIds` 跟踪已插入的块，避免重复

**修改 5.2**：`app/word-editor/page.tsx` 第 553-559 行 - 避免内容重复

```typescript
// Only create content blocks if there are no generated blocks for this item
const hasGeneratedBlocks = blocks.some(b =>
  b.id.startsWith(`generated-${item.id}-`) && b.properties?.isGenerated
);

if (item.content && !hasGeneratedBlocks) {
  // ... 创建 content 块 ...
}
```

**关键改进**：
- 检查是否已有生成的块
- 如果有，跳过创建 content 块
- 防止同时存在 `content-*` 和 `generated-*` 块导致的重复

**修改 5.3**：`app/word-editor/page.tsx` 第 675-733 行 - 剩余块的兜底插入

```typescript
const remainingGeneratedBlocks = blocks.filter(b => {
  if (!b.id.startsWith('generated-') || !b.properties?.isGenerated) {
    return false;
  }
  if (generatedBlockIds.has(b.id)) {
    return false; // Skip already added
  }
  const outlineItemId = b.id.split('-')[1];
  return validOutlineIds.has(outlineItemId);
});

console.log('🔍 Remaining generated blocks to insert:', {
  total: blocks.filter(b => b.id.startsWith('generated-')).length,
  alreadyInserted: Array.from(generatedBlockIds).filter(id => id.startsWith('generated-')).length,
  remaining: remainingGeneratedBlocks.length,
  remainingIds: remainingGeneratedBlocks.map(b => b.id)
});
```

**关键改进**：
- 只处理未被内联插入的剩余块
- 提供详细的调试日志
- 作为兜底机制处理边缘情况

## 测试步骤

### 测试 1：基本表格生成和保留

1. 启动应用，创建一个包含表格内容的大纲项
2. 点击生成按钮，生成包含 Markdown 表格的内容
3. **预期结果**：
   - 流式生成时表格逐步显示
   - 生成完成后表格仍然显示
   - 控制台不再有 "Skipping duplicate user-created block" 警告
   - 控制台应显示：`🔍 Preserving generated blocks: {total: X, valid: X, validIds: [...]}`

### 测试 2：重新生成内容

1. 对已生成内容的章节重新点击生成按钮
2. **预期结果**：
   - 旧内容（包括表格）被完全替换
   - 不会出现内容重复
   - 新的表格正常显示

### 测试 3：编辑大纲后的保留

1. 生成包含表格的内容
2. 在大纲中添加或删除其他章节
3. **预期结果**：
   - 已生成的表格内容保持不变
   - 删除的章节对应的生成内容被清理
   - 新章节不受影响

### 测试 4：多个章节生成

1. 对多个章节分别生成内容，确保都包含表格
2. **预期结果**：
   - 每个章节的表格都正确显示
   - 各章节的内容互不干扰
   - 位置关系保持正确

### 测试 5：用户手动创建的内容

1. 生成内容后，用户手动添加段落或编辑内容
2. 对大纲进行修改
3. **预期结果**：
   - 用户手动添加的内容得到保留
   - 生成的内容（包括表格）也得到保留
   - 两者位置关系正确

## 调试日志

关键调试日志会在控制台显示：

1. **表格解析**：
   ```
   📊 Parsed markdown blocks: [{type: 'table', hasTableData: true}, ...]
   📊 Converted notion blocks: [{type: 'table', hasTableData: true}, ...]
   ```

2. **块保留**：
   ```
   🔍 Preserving generated blocks: {
     total: 5,
     valid: 5,
     validIds: ['generated-3-1-paragraph-...', 'generated-3-1-table-...']
   }
   ```

3. **块替换**：
   ```
   🗑️ Removing 3 blocks
   ➕ Adding 5 blocks
   ➕ New blocks types: ['paragraph', 'table', 'paragraph']
   ➕ New blocks with tableData: 1
   ```

## 潜在风险和注意事项

### 1. ID 格式依赖

**风险**：代码依赖于 `generated-{outlineItemId}-` 的 ID 格式。

**缓解**：
- 在 `StreamingMarkdownParser.toNotionBlocks()` 中保持 ID 格式一致
- 如果需要修改 ID 格式，需要同步更新所有提取 outlineItemId 的逻辑

### 2. 性能考虑

**风险**：每次 outline 更新都会重建整个块列表。

**当前状态**：
- 使用 `JSON.stringify` 比较来避免不必要的更新
- 对于大型文档可能有性能影响

**优化建议**：
- 考虑使用更细粒度的更新策略
- 使用 React.memo 或 useMemo 优化渲染

### 3. 并发生成

**风险**：快速连续点击多个章节的生成按钮可能导致状态混乱。

**缓解**：
- 已有的 `isGenerating` 状态可以用来禁用按钮
- 可以考虑添加生成队列机制

## 总结

通过以上五处修复和响应式优化：

1. ✅ 解决了表格消失的核心问题
2. ✅ 正确识别和保留生成的内容（包括表格）
3. ✅ 防止重新生成时的内容重复
4. ✅ 支持删除章节时自动清理对应内容
5. ✅ 保持用户手动创建内容的独立性
6. ✅ 修复生成内容位置错误（紧跟 guide 块）
7. ✅ 添加 Notion 风格的表格横向滚动 🆕
8. ✅ 响应式布局支持，小屏幕正常显示 🆕

### 表格滚动功能 🆕

**问题**：表格内容过多时超出页面宽度，没有滚动条

**修复方案**：

**修改 6.1**：`components/blocks/SimpleTableBlock.tsx` 第 297-312 行

添加横向滚动容器：
```typescript
<div
  style={{
    width: '100%',
    marginTop: '8px',
    marginBottom: '8px',
    overflowX: 'auto', // 横向滚动
    overflowY: 'visible',
    scrollbarWidth: 'thin', // Firefox
    scrollbarColor: 'rgba(55, 53, 47, 0.3) transparent'
  }}
  className="notion-table-wrapper"
>
```

**修改 6.2**：`app/globals.css` 第 90-138 行

添加 Notion 风格的滚动条样式：
```css
/* Notion-style table scrollbar */
.notion-table-wrapper::-webkit-scrollbar {
  height: 12px;
}

.notion-table-wrapper::-webkit-scrollbar-thumb {
  background: rgba(55, 53, 47, 0.16);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: content-box;
}

/* Responsive handling */
@media (max-width: 900px) {
  .notion-table-wrapper::-webkit-scrollbar {
    height: 8px;
  }
}
```

**修改 6.3**：`app/word-editor/page.tsx` 第 1175、1189 行

确保页面容器支持溢出内容：
```typescript
// 文档容器
overflow: 'visible', // 确保内容溢出可见（表格滚动条）

// 编辑器内容
overflow: 'visible', // 允许表格滚动条显示
```

**效果**：
- 表格内容过多时自动显示横向滚动条
- 滚动条样式与 Notion 一致（圆角、半透明）
- 小屏幕设备上滚动条更加明显
- 页面缩小时文本内容不会超出背景栏

所有修改都遵循了现有的代码结构和设计模式，不会引入破坏性变更。
