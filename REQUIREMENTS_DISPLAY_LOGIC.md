# 章节内容规划显示逻辑

## 概述

本文档说明了章节内容规划（requirements）在编辑器中的显示和更新逻辑。

## 核心逻辑

### 1. 显示规则

| 章节层级 | 生成内容前 | 生成内容后 |
|---------|-----------|-----------|
| 一级标题 (level 1) | ❌ 不显示 requirements | ✅ 显示 content |
| 二级标题 (level 2) | ✅ 显示 requirements | ✅ 显示 content（requirements 被隐藏） |

### 2. 工作流程

```
生成大纲
    ↓
二级标题下显示 requirements（用户可编辑）
    ↓
点击生成章节
    ↓
AI 根据 requirements 生成 content
    ↓
requirements 被隐藏，显示 content
    ↓
content 替换 requirements
```

## 实现细节

### 前端渲染逻辑 (`app/word-editor/page.tsx`)

```typescript
// 只有 level 2 的章节在生成内容前显示 requirements
if (item.level === 2 && item.requirements && !item.content) {
  notionBlocks.push({
    id: `requirements-${item.id}`,
    type: 'paragraph',
    content: item.requirements,
    properties: {},
    children: [],
  });
}

// 生成内容后显示 content（隐藏 requirements）
if (item.content) {
  notionBlocks.push({
    id: `content-${item.id}`,
    type: 'paragraph',
    content: item.content,
    properties: {},
    children: [],
  });
}
```

### 章节生成逻辑 (`components/outline/OutlinePanel.tsx`)

```typescript
// 1. 调用 Dify API 时传入 requirements
await generateSectionWithWorker(
  chapterApiKey,
  item.title,
  documentTopic,
  fullOutline,
  onChunk,
  onComplete,
  item.requirements,  // 传入章节内容规划
  onError
);

// 2. 生成完成后，content 会自动显示
// requirements 会被自动隐藏（因为有 content）
```

### 编辑同步逻辑

```typescript
// 编辑 requirements 时同步到 outline（仅在生成内容前）
if (id.startsWith('requirements-')) {
  const outlineItemId = id.replace('requirements-', '');
  updateItem(outlineItemId, { requirements: updates.content });
}

// 编辑 content 时清空 requirements（content 替换 requirements）
if (id.startsWith('content-')) {
  const outlineItemId = id.replace('content-', '');
  updateItem(outlineItemId, { content: updates.content, requirements: '' });
}
```

## 用户操作流程

### 场景 1：生成大纲后编辑章节规划

1. 用户在首页生成大纲
2. 进入编辑器，看到二级标题下显示 requirements
3. 用户可以直接编辑 requirements
4. 编辑后的 requirements 会同步到 store
5. 点击生成时，AI 根据编辑后的 requirements 生成内容

### 场景 2：生成章节内容

1. 用户点击章节的"生成"按钮
2. AI 根据 requirements 生成 content
3. requirements 自动隐藏
4. content 显示在编辑器中
5. content 替换 requirements

### 场景 3：重新编辑已生成内容

1. 用户编辑已生成的 content
2. 更新后 requirements 被清空（因为 content 已经存在）
3. 如果需要重新生成，可以删除 content，恢复显示 requirements

## Dify 端配置

### 大纲生成工作流

输出格式必须包含 `requirements` 字段：

```json
{
  "id": "1",
  "title": "第一章：项目背景与目标",
  "level": 1,
  "content": "",
  "requirements": "本章首先要分析..."
}
```

### 章节写作工作流

输入变量必须包含 `requirements`（Text 类型，非必填）：

```
## 章节内容规划
{{requirements}}

请根据以上规划撰写该章节内容。
```

## 数据状态示例

### 初始状态（大纲生成后）

```typescript
{
  id: "1-1",
  title: "1.1 建设背景",
  level: 2,
  status: "pending",
  requirements: "本小节主要描述行业网络安全威胁的发展趋势...",
  content: ""
}
```

**显示：** ✅ 显示 requirements

### 生成中状态

```typescript
{
  id: "1-1",
  title: "1.1 建设背景",
  level: 2,
  status: "generating",
  requirements: "本小节主要描述行业网络安全威胁的发展趋势...",
  content: "在当今数字化转型的背景下，网络安全威胁..."
}
```

**显示：** ✅ 显示 content（requirements 仍存在但不显示）

### 生成完成状态

```typescript
{
  id: "1-1",
  title: "1.1 建设背景",
  level: 2,
  status: "completed",
  requirements: "",  // 或保留原值（不显示）
  content: "在当今数字化转型的背景下，网络安全威胁日益严峻..."
}
```

**显示：** ✅ 显示 content

## 注意事项

1. **一级标题不显示 requirements**
   - 一级标题通常作为章节分组，不需要内容规划
   - 只有二级标题才需要具体的内容规划

2. **requirements 和 content 互斥显示**
   - 有 content 时，隐藏 requirements
   - 没有 content 时，显示 requirements

3. **编辑 requirements 的时机**
   - 只在生成内容前可以编辑 requirements
   - 生成内容后，编辑 content 会清空 requirements

4. **重新生成的处理**
   - 如果需要重新生成，先删除 content
   - 删除 content 后，requirements 会重新显示
   - 可以再次编辑 requirements，然后重新生成
