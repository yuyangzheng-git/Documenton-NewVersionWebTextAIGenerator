# 生成按钮三状态 + 一键生成功能

## 完成时间
2026-01-28

## 功能概述

本次更新为生成按钮添加了三种状态显示，并在导航栏增加了一键生成功能，能够按顺序自动生成所有章节。

---

## ✅ 已实现功能

### 1. 生成按钮三状态

**位置**: 写作指导块（guide block）右上角

**三种状态**:

#### 状态一：未生成（默认）
- **显示文字**: "生成"
- **颜色**: 蓝色 (#2383E2)
- **背景**: 浅蓝色 (rgba(35, 131, 226, 0.1))
- **边框**: 浅蓝色 (rgba(35, 131, 226, 0.2))
- **可点击**: ✅ 是

#### 状态二：生成中
- **显示文字**: "生成中..."
- **颜色**: 灰色 (#999)
- **背景**: 浅灰色 (rgba(153, 153, 153, 0.1))
- **边框**: 浅灰色 (rgba(153, 153, 153, 0.2))
- **可点击**: ❌ 否（disabled）
- **不透明度**: 0.6
- **鼠标样式**: not-allowed

#### 状态三：已生成（重写模式）
- **显示文字**: "重写"
- **颜色**: 绿色 (#10B981)
- **背景**: 浅绿色 (rgba(16, 185, 129, 0.1))
- **边框**: 浅绿色 (rgba(16, 185, 129, 0.2))
- **可点击**: ✅ 是
- **功能**: 点击会提示确认覆盖现有内容

### 2. 一键生成功能

**位置**: 导航栏右侧，导出按钮左边

**按钮特性**:
- **图标**: Wand2（魔法棒）
- **颜色**: 紫色渐变 (linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%))
- **文字**: "一键生成" / "生成中..."
- **功能**: 按顺序依次生成所有未生成的章节

**工作流程**:
1. 扫描所有大纲项，找出有写作指导但没有内容的章节
2. 弹出确认对话框，显示将要生成的章节列表
3. 用户确认后，按顺序依次调用 `handleGenerateSection`
4. 每个章节生成完成后等待1秒，再生成下一个
5. 批量生成期间，按钮显示"生成中..."并禁用

---

## 📊 状态判断逻辑

### 判断是否生成中
```typescript
const isGenerating = generatingIds?.has(outlineItemId) || false;
```

### 判断是否已生成
```typescript
const hasGenerated = allBlocks?.some(b =>
  b.id.startsWith(`generated-${outlineItemId}-`) &&
  b.properties?.isGenerated
) || false;
```

### 状态优先级
1. 如果 `isGenerating = true` → 显示"生成中..."
2. 否则如果 `hasGenerated = true` → 显示"重写"
3. 否则 → 显示"生成"

---

## 🔧 技术实现

### 1. 新增状态管理

**文件**: `app/word-editor/page.tsx`

```typescript
// 追踪正在生成的章节ID
const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
const [isBatchGenerating, setIsBatchGenerating] = useState(false);
```

### 2. 生成开始时添加ID

```typescript
const handleGenerateSection = async (headingBlockId: string) => {
  const outlineItemId = headingBlockId.replace('heading-', '');

  // 标记为正在生成
  setGeneratingIds(prev => new Set(prev).add(outlineItemId));

  // ...生成逻辑...
};
```

### 3. 生成结束/失败时移除ID

```typescript
// 成功时
setGeneratingIds(prev => {
  const next = new Set(prev);
  next.delete(outlineItemId);
  return next;
});

// 失败时（error handler 中同样处理）
setGeneratingIds(prev => {
  const next = new Set(prev);
  next.delete(outlineItemId);
  return next;
});
```

### 4. 一键生成函数

```typescript
const handleBatchGenerate = async () => {
  // 获取所有有写作指导但没有内容的章节
  const chaptersToGenerate = outline.filter(item =>
    (item.level === 2 || item.level === 3) &&
    item.requirements &&
    !item.content
  );

  if (chaptersToGenerate.length === 0) {
    alert('没有需要生成的章节');
    return;
  }

  const confirm = window.confirm(
    `将按顺序生成 ${chaptersToGenerate.length} 个章节，是否继续？\n\n` +
    chaptersToGenerate.map((item, idx) => `${idx + 1}. ${item.title}`).join('\n')
  );

  if (!confirm) return;

  setIsBatchGenerating(true);

  // 按顺序依次生成
  for (const item of chaptersToGenerate) {
    const headingBlockId = `heading-${item.id}`;
    await handleGenerateSection(headingBlockId);
    // 等待1秒再生成下一个
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  setIsBatchGenerating(false);
};
```

### 5. 传递状态到组件

**NotionEditor.tsx**:
```typescript
interface NotionEditorProps {
  // ...其他属性
  generatingIds?: Set<string>;
}

<NotionBlockComponent
  // ...其他属性
  generatingIds={generatingIds}
  allBlocks={blocks}
/>
```

**NotionBlock.tsx**:
```typescript
interface NotionBlockProps {
  // ...其他属性
  generatingIds?: Set<string>;
  allBlocks?: NotionBlock[];
}
```

### 6. 按钮状态渲染逻辑

**NotionBlock.tsx - guide block**:
```typescript
{onGenerate && (() => {
  // 从 guide-{itemId} 中提取 itemId
  const outlineItemId = block.id.replace('guide-', '');

  // 判断状态
  const isGenerating = generatingIds?.has(outlineItemId) || false;
  const hasGenerated = allBlocks?.some(b =>
    b.id.startsWith(`generated-${outlineItemId}-`) &&
    b.properties?.isGenerated
  ) || false;

  // 根据状态设置按钮样式
  let buttonText = '生成';
  let buttonColor = '#2383E2';
  // ...其他颜色配置

  if (isGenerating) {
    buttonText = '生成中...';
    buttonColor = '#999';
    // ...
  } else if (hasGenerated) {
    buttonText = '重写';
    buttonColor = '#10B981';
    // ...
  }

  return (
    <button
      onClick={(e) => {
        if (!isGenerating) {
          e.preventDefault();
          e.stopPropagation();
          onGenerate(headingBlockId);
        }
      }}
      disabled={isGenerating}
      style={{
        // 动态样式
        backgroundColor: bgColor,
        color: buttonColor,
        cursor: isGenerating ? 'not-allowed' : 'pointer',
        opacity: isGenerating ? 0.6 : 1,
        // ...
      }}
    >
      <Sparkles style={{ width: '12px', height: '12px' }} />
      <span>{buttonText}</span>
    </button>
  );
})()}
```

---

## 📁 文件修改清单

| 文件 | 修改内容 | 行数变化 |
|------|---------|----------|
| `app/word-editor/page.tsx` | 添加状态管理 + 一键生成函数 + 导航栏按钮 | +70 |
| `components/NotionEditor.tsx` | 传递 generatingIds 和 allBlocks | +3 |
| `components/NotionBlock.tsx` | 三状态按钮逻辑 | +65, -26 |

**总计**: 3个文件修改，净增加 ~112行代码

---

## 🎨 UI/UX 改进

### 用户体验优化
1. **状态可见性**: 用户可以清楚地看到哪些章节正在生成、哪些已完成
2. **防止重复点击**: 生成中的按钮自动禁用，防止用户误操作
3. **重写提示**: 已生成的章节显示"重写"，明确告知会覆盖现有内容
4. **批量生成**: 一键生成功能节省大量手动点击时间
5. **确认对话框**: 批量生成前显示章节列表，让用户清楚知道将要生成什么

### 视觉设计
- **蓝色（未生成）**: 表示"待处理"，引导用户点击
- **灰色（生成中）**: 表示"进行中"，降低视觉优先级
- **绿色（已生成）**: 表示"已完成"，提示可重新生成
- **紫色（一键生成）**: 独特颜色突出显示强大功能

---

## ✅ 测试验证

### 功能测试
- ✅ 未生成章节显示"生成"按钮（蓝色）
- ✅ 点击生成后按钮变为"生成中..."（灰色，不可点击）
- ✅ 生成完成后按钮变为"重写"（绿色）
- ✅ 多个章节可以同时处于不同状态
- ✅ 一键生成按钮功能正常
- ✅ 批量生成时顺序正确
- ✅ 批量生成期间一键生成按钮禁用

### 边缘情况
- ✅ 生成失败后状态正确恢复
- ✅ 没有可生成章节时提示用户
- ✅ 用户取消批量生成时正常退出

---

## 💡 使用场景

### 场景一：单个章节生成
1. 用户打开编辑器，看到写作指导
2. 点击右上角蓝色"生成"按钮
3. 按钮变为灰色"生成中..."
4. AI 流式生成内容
5. 生成完成，按钮变为绿色"重写"
6. 用户可以随时点击"重写"覆盖内容

### 场景二：批量生成全部章节
1. 用户创建完整大纲，每个章节都有写作指导
2. 点击导航栏紫色"一键生成"按钮
3. 弹出确认框，显示将生成的章节列表
4. 用户确认后，系统按顺序生成
5. 导航栏按钮显示"生成中..."并禁用
6. 所有章节的生成按钮依次经历：生成 → 生成中 → 重写
7. 全部完成后，一键生成按钮恢复正常

---

## 🔮 未来改进方向

### 可选优化
1. **进度条**: 批量生成时显示总体进度（如 3/10）
2. **取消功能**: 批量生成过程中允许用户中途取消
3. **并发生成**: 允许配置同时生成多个章节（需要 API 支持）
4. **生成历史**: 记录每个章节的生成历史，支持版本回退
5. **智能排序**: 根据章节依赖关系优化生成顺序

---

## 📝 技术亮点

### 1. 状态追踪
使用 `Set<string>` 而非数组，提升查找性能（O(1) vs O(n)）

### 2. 不可变更新
```typescript
setGeneratingIds(prev => new Set(prev).add(outlineItemId));
```
创建新 Set 而非直接修改，确保 React 正确检测更新

### 3. IIFE 渲染模式
```typescript
{onGenerate && (() => {
  // 逻辑代码
  return <button>...</button>;
})()}
```
使用立即执行函数封装复杂逻辑，保持 JSX 清晰

### 4. 错误处理
在生成成功、失败、异常三种情况下都正确更新状态

---

**实施人**: Claude Code
**完成时间**: 2026-01-28
**状态**: ✅ 完成并测试通过
