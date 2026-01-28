# 流式 Markdown 处理指南

## 主流 LLM 应用如何处理流式 Markdown

### 1. ChatGPT (OpenAI)

**处理方式：**
- 使用增量解析器（Incremental Parser）
- 实时渲染 Markdown 语法高亮
- 表格和代码块支持流式构建

**关键策略：**
```typescript
// ChatGPT 使用缓冲和状态机
class StreamProcessor {
  private buffer = '';
  private state: 'normal' | 'code' | 'table' = 'normal';

  process(chunk: string) {
    this.buffer += chunk;
    // 实时解析和渲染
    this.render();
  }
}
```

### 2. Notion

**处理方式：**
- 块级实时渲染（Block-level Real-time Rendering）
- 每个块独立处理，互不影响
- 支持流式输入和即时预览

**关键策略：**
```typescript
// Notion 使用块级解析
const blocks = parseToBlocks(markdown);
blocks.forEach(block => {
  renderBlock(block);  // 每个块独立渲染
});
```

### 3. Claude (Anthropic)

**处理方式：**
- 完整的 Markdown 支持
- 流式输出时保持语法完整性
- 支持复杂的嵌套结构

**关键策略：**
```typescript
// Claude 使用双缓冲技术
class DualBuffer {
  private displayBuffer = '';
  private parseBuffer = '';

  onChunk(chunk: string) {
    this.parseBuffer += chunk;
    // 异步解析，同步显示
    this.displayBuffer = parse(this.parseBuffer);
  }
}
```

### 4. GitHub Copilot

**处理方式：**
- 代码优先渲染（Code-first Rendering）
- 支持语法高亮的流式渲染
- 实时代码补全

**关键策略：**
```typescript
// GitHub Copilot 使用 Token 级别渲染
function renderToken(token: Token) {
  const syntaxHighlight = highlight(token);
  appendToDocument(syntaxHighlight);
}
```

## 本项目采用的方案

### 流式 Markdown 解析器 (`StreamingMarkdownParser`)

**特性：**
1. **增量解析** - 每次接收到新的内容块时立即处理
2. **状态机** - 使用状态跟踪当前解析上下文（表格、代码块等）
3. **实时构建** - 不完整的 Markdown 也能正确渲染
4. **表格智能处理** - 自动构建带样式的 HTML 表格

**核心实现：**

```typescript
export class StreamingMarkdownParser {
  private buffer: string = '';
  private blocks: MarkdownBlock[] = [];
  private inTable = false;
  private tableRows: string[][] = [];

  // 处理流式内容块
  parseChunk(chunk: string): MarkdownBlock[] {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');

    // 处理完整行
    const completeLines = lines.slice(0, -1);
    this.buffer = lines[lines.length - 1] || '';

    for (const line of completeLines) {
      this.processLine(line);
    }

    return this.getBlocks();
  }

  // 生成带样式的表格 HTML
  private generateTableHTML(rows: string[][]): string {
    const style = `border-collapse: collapse; width: 100%; border: 1px solid #e0e0e0;`;
    const cellStyle = `border: 1px solid #e0e0e0; padding: 8px; min-width: 80px; vertical-align: top;`;

    const rowsHtml = rows.map(row =>
      `<tr>${row.map(cell => `<td style="${cellStyle}">${cell}</td>`).join('')}</tr>`
    ).join('');

    return `<table style="${style}">${rowsHtml}</table>`;
  }
}
```

### 实时 Markdown 渲染器 (`RealtimeMarkdownRenderer`)

**特性：**
1. **即时反馈** - 收到内容立即渲染
2. **性能优化** - 只渲染变更的部分
3. **错误恢复** - 不完整的 Markdown 不会导致崩溃

**核心实现：**

```typescript
export class RealtimeMarkdownRenderer {
  private parser: StreamingMarkdownParser;
  private renderedBlocks: MarkdownBlock[] = [];

  processChunk(chunk: string): MarkdownBlock[] {
    this.renderedBlocks = this.parser.parseChunk(chunk);
    return this.renderedBlocks;
  }

  getRenderedBlocks(): MarkdownBlock[] {
    return this.renderedBlocks;
  }
}
```

### 智能表格构建器 (`SmartTableBuilder`)

**特性：**
1. **实时预览** - 表格未完成时也能显示
2. **自动格式化** - 自动添加边框和内边距
3. **空表格支持** - 默认生成 3x3 空表格

**核心实现：**

```typescript
export class SmartTableBuilder {
  private rows: string[][] = [];
  private maxColumns = 0;

  parseRow(line: string): string[] | null {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
      return null;
    }

    const cells = trimmed.slice(1, -1).split('|').map(cell => cell.trim());

    // 跳过分隔行
    if (cells.every(cell => /^-+$/.test(cell))) {
      return null;
    }

    this.maxColumns = Math.max(this.maxColumns, cells.length);
    this.rows.push(cells);
    return cells;
  }

  getHTML(): string {
    if (this.rows.length === 0) {
      return this.generateEmptyTable();
    }

    const style = `border-collapse: collapse; width: 100%; border: 1px solid #e0e0e0;`;
    const cellStyle = `border: 1px solid #e0e0e0; padding: 8px; min-width: 80px; vertical-align: top;`;

    const rowsHtml = this.rows.map(row =>
      `<tr>${row.map(cell => `<td style="${cellStyle}">${cell}</td>`).join('')}</tr>`
    ).join('');

    return `<table style="${style}">${rowsHtml}</table>`;
  }

  generateEmptyTable(): string {
    const style = `border-collapse: collapse; width: 100%; border: 1px solid #e0e0e0;`;
    const cellStyle = `border: 1px solid #e0e0e0; padding: 8px; min-width: 80px; height: 40px; vertical-align: top;`;

    let html = `<table style="${style}">`;
    for (let i = 0; i < 3; i++) {
      html += '<tr>';
      for (let j = 0; j < 3; j++) {
        html += `<td style="${cellStyle}"></td>`;
      }
      html += '</tr>';
    }
    html += '</table>';

    return html;
  }
}
```

## 使用示例

### 在 React 组件中使用流式解析器

```typescript
import { StreamingMarkdownParser } from '@/lib/streaming-markdown-parser';
import { useState } from 'react';

function MarkdownEditor() {
  const [blocks, setBlocks] = useState<MarkdownBlock[]>([]);
  const parser = new StreamingMarkdownParser();

  const handleStreamChunk = (chunk: string) => {
    const newBlocks = parser.parseChunk(chunk);
    setBlocks(newBlocks);
  };

  return (
    <div>
      {blocks.map(block => (
        <NotionBlock key={block.id} block={block} />
      ))}
    </div>
  );
}
```

### 处理 AI 流式输出

```typescript
async function generateContent() {
  const parser = new StreamingMarkdownParser();

  await fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  }).then(response => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const blocks = parser.parseChunk(chunk);
      updateUI(blocks);
    }
  });
}
```

## 最佳实践

### 1. 性能优化

- **批量更新**：避免频繁更新 DOM，使用 `requestAnimationFrame`
- **虚拟滚动**：对于大量内容，使用虚拟滚动
- **缓存机制**：缓存已解析的块，避免重复解析

### 2. 错误处理

- **容错设计**：不完整的 Markdown 不应该导致应用崩溃
- **回退机制**：解析失败时显示原始文本
- **日志记录**：记录解析错误以便调试

### 3. 用户体验

- **加载指示器**：显示解析进度
- **平滑过渡**：使用 CSS 动画实现平滑的内容更新
- **即时反馈**：按键或滚动时立即响应

### 4. 表格处理

- **默认空表格**：使用 `/ 命令选择"表格"时，自动生成 3x3 空表格
- **格式化 HTML**：自动添加边框和内边距
- **实时预览**：编辑 HTML 时实时显示表格预览

## 总结

本项目采用了主流 LLM 应用的流式 Markdown 处理策略：

1. **增量解析** - 像 ChatGPT 一样使用缓冲和状态机
2. **块级渲染** - 像 Notion 一样将内容分割为独立的块
3. **实时构建** - 像 Claude 一样支持不完整的 Markdown
4. **表格智能处理** - 自动生成带样式的 HTML 表格

这些技术确保了在流式生成内容时，用户能够实时看到格式正确的 Markdown 内容，包括表格、标题、列表、图片等复杂结构。
