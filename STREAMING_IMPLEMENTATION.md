# 流式 Markdown 处理实现

## 概述

本项目的流式 Markdown 处理实现了状态机与增量补全机制，解决了 LLM 流式输出时的 Markdown 渲染问题。

## 核心功能

### 1. 缓冲区管理 (Buffering)

前端维护一个 `responseText` 变量，每收到一个 Token 就拼接进去。

### 2. 节流渲染 (Throttling)

不是每收到一个 Token 就更新画面，而是每隔 100ms 更新一次，避免闪烁和性能问题。

### 3. 自动补全 (Auto-closing)

成熟的流式解析器具备「容错机制」：

- **未关闭的代码块**：LLM 刚传了 ```python，但还没传结尾 → 自动添加 \n```
- **未关闭的行内代码**：只有一个 ` → 自动添加 `
- **未关闭的粗体**：只有一个 ** → 自动添加 **

### 4. 状态机解析

识别 Markdown 语法结构（代码块、表格、列表等）：

```typescript
type MarkdownBlock =
  | 'heading'
  | 'paragraph'
  | 'code'
  | 'quote'
  | 'list'
  | 'divider'
  | 'table';
```

## 文件结构

```
lib/
  streaming-markdown-handler.ts    # 流式 Markdown 处理器（状态机 + 自动补全）
  streaming-markdown-parser.ts      # 完整 Markdown 解析器
components/
  StreamingMarkdownRenderer.tsx     # React 流式渲染组件
app/
  word-editor/page.tsx              # 使用流式处理的主页面
components/
  NotionBlock.tsx                   # 集成流式渲染的块组件
```

## 使用方式

### 在 word-editor/page.tsx 中

```typescript
import { StreamingMarkdownHandler } from '@/lib/streaming-markdown-handler';

// 创建流式处理器
const markdownHandler = new StreamingMarkdownHandler();
markdownHandler.setThrottleDelay(100); // 100ms 节流

// 设置解析回调
markdownHandler.setOnComplete((parseResult) => {
  const safeHTML = markdownHandler.getSafeHTML();
  // 更新 UI
  setBlocks(prevBlocks => prevBlocks.map(block =>
    block.properties.loading ? { ...block, content: safeHTML } : block
  ));
});

// 追加流式数据
markdownHandler.append(chunk);
```

### 在 NotionBlock.tsx 中

```typescript
import { StreamingMarkdownRenderer } from '@/components/StreamingMarkdownRenderer';

// Loading 状态下使用流式渲染器
if (block.properties.loading && block.type === 'paragraph') {
  return (
    <div>
      <StreamingMarkdownRenderer markdown={editContent} isComplete={false} />
    </div>
  );
}
```

## 工具函数

### detectIncompleteMarkdown(text)

检测文本是否包含未关闭的 Markdown 语法：

```typescript
const incomplete = detectIncompleteMarkdown(markdown);
// { hasUnclosedCodeBlock: true, hasUnclosedInlineCode: false, ... }
```

### autoCloseMarkdown(text)

自动补全未关闭的 Markdown 语法（仅用于渲染，不修改原始数据）：

```typescript
const safeMarkdown = autoCloseMarkdown(incompleteMarkdown);
```

## 测试

打开 `test-streaming-markdown.html` 可以测试流式 Markdown 处理功能。

## 性能优化

1. **节流渲染**：默认 100ms 更新一次
2. **增量解析**：只解析新增的部分
3. **局部更新**：只更新正在变动的最后一个区块

## 主流参考

本实现参考了以下主流 LLM 的流式处理方式：

- **ChatGPT**：使用虚拟 DOM + 自动补全
- **Notion**：块级更新 + 增量渲染
- **Claude**：状态机 + 容错机制

## 注意事项

1. 自动补全仅在渲染时使用，不会修改原始 Markdown 数据
2. 节流延迟可以根据性能调整（建议 50ms-150ms）
3. Loading 状态结束后，会使用完整解析器进行最终转换

## 未来改进

- [ ] 实现虚拟滚动（处理超长文档）
- [ ] 添加更多 Markdown 语法支持（任务列表、脚注等）
- [ ] 优化代码高亮性能（使用 Web Worker）
- [ ] 添加可配置的节流延迟选项
