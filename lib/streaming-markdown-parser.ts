/**
 * Streaming Markdown Parser
 * 用于处理 LLM 流式输出的 Markdown 内容
 * 参考：Notion、ChatGPT 等主流应用的做法
 */

import { parseMarkdownTable, type SimpleTableBlockData } from '@/components/blocks';

export interface MarkdownBlock {
  type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'quote' | 'image' | 'table' | 'code' | 'divider';
  content: string;
  properties?: Record<string, any>;
  children?: MarkdownBlock[];
}

export class StreamingMarkdownParser {
  private buffer: string = '';
  private blocks: MarkdownBlock[] = [];
  private currentBlock: Partial<MarkdownBlock> | null = null;
  private tableRows: string[][] = [];
  private inTable = false;
  private inCodeBlock = false;
  private codeBlockContent = '';
  private codeBlockLang = '';

  constructor() {
    this.reset();
  }

  reset(): void {
    this.buffer = '';
    this.blocks = [];
    this.currentBlock = null;
    this.tableRows = [];
    this.inTable = false;
    this.inCodeBlock = false;
    this.codeBlockContent = '';
    this.codeBlockLang = '';
  }

  /**
   * 处理流式内容块
   * 这是核心方法，每次收到新的内容块时调用
   */
  parseChunk(chunk: string): MarkdownBlock[] {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');

    // 处理除了最后一行之外的所有行（最后一行可能不完整）
    const completeLines = lines.slice(0, -1);
    this.buffer = lines[lines.length - 1] || '';

    for (const line of completeLines) {
      this.processLine(line);
    }

    return this.getBlocks();
  }

  /**
   * 处理完成的流，返回所有块
   */
  parseComplete(content: string): MarkdownBlock[] {
    this.reset();
    const lines = content.split('\n');
    for (const line of lines) {
      this.processLine(line);
    }

    // 完成所有未完成的块（包括表格和当前块）
    if (this.inTable) {
      this.finalizeTable();
    }
    if (this.inCodeBlock) {
      // 处理未关闭的代码块
      this.blocks.push({
        type: 'code',
        content: this.codeBlockContent,
        properties: { language: this.codeBlockLang },
        children: []
      });
    }
    this.finalizeCurrentBlock();

    return this.getBlocks();
  }

  /**
   * 处理单行内容
   */
  private processLine(line: string): void {
    const trimmedLine = line.trim();

    // 跳过空行，但需要先完成当前块
    if (!trimmedLine) {
      this.finalizeCurrentBlock();
      return;
    }

    // 处理代码块
    if (trimmedLine.startsWith('```')) {
      if (!this.inCodeBlock) {
        // 开始代码块
        this.finalizeCurrentBlock();
        this.inCodeBlock = true;
        this.codeBlockLang = trimmedLine.slice(3).trim();
        this.codeBlockContent = '';
      } else {
        // 结束代码块
        this.inCodeBlock = false;
        this.blocks.push({
          type: 'code',
          content: this.codeBlockContent,
          properties: { language: this.codeBlockLang },
          children: []
        });
        this.codeBlockContent = '';
        this.codeBlockLang = '';
      }
      return;
    }

    // 如果在代码块中，累积内容
    if (this.inCodeBlock) {
      this.codeBlockContent += line + '\n';
      return;
    }

    // 处理表格（Markdown 表格语法）
    // 改进：更严格的表格检测，参考 AppFlowy 的实现
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      if (!this.inTable) {
        this.finalizeCurrentBlock();
        this.inTable = true;
      }

      const cells = trimmedLine.slice(1, -1).split('|').map(cell => cell.trim());
      // 跳过分隔行（例如 |---|---|）
      if (!cells.every(cell => /^-+$/.test(cell))) {
        this.tableRows.push(cells);
      }
      return;
    } else if (this.inTable) {
      // 表格结束：遇到非表格行
      // 生成表格块并继续处理当前行
      this.finalizeTable();
      // 重要：不要 return，继续处理当前行作为新块
    }

    // 处理标题
    if (trimmedLine.startsWith('### ')) {
      this.finalizeCurrentBlock();
      this.currentBlock = {
        type: 'h3',
        content: trimmedLine.substring(4)
      };
    } else if (trimmedLine.startsWith('## ')) {
      this.finalizeCurrentBlock();
      this.currentBlock = {
        type: 'h2',
        content: trimmedLine.substring(3)
      };
    } else if (trimmedLine.startsWith('# ')) {
      this.finalizeCurrentBlock();
      this.currentBlock = {
        type: 'h1',
        content: trimmedLine.substring(2)
      };
    }
    // 处理图片
    else if (trimmedLine.startsWith('![') && trimmedLine.includes('](')) {
      this.finalizeCurrentBlock();
      const match = trimmedLine.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        this.currentBlock = {
          type: 'image',
          content: match[1] || '',
          properties: { src: match[2], caption: match[1] },
          children: []
        };
        this.finalizeCurrentBlock();
      }
    }
    // 处理引用
    else if (trimmedLine.startsWith('> ')) {
      this.finalizeCurrentBlock();
      this.currentBlock = {
        type: 'quote',
        content: trimmedLine.substring(2)
      };
    }
    // 处理无序列表
    else if (trimmedLine.match(/^[-*+]\s+/)) {
      this.finalizeCurrentBlock();
      this.currentBlock = {
        type: 'bullet',
        content: trimmedLine.replace(/^[-*+]\s+/, '')
      };
    }
    // 处理有序列表
    else if (trimmedLine.match(/^\d+\.\s+/)) {
      this.finalizeCurrentBlock();
      this.currentBlock = {
        type: 'numbered',
        content: trimmedLine.replace(/^\d+\.\s+/, '')
      };
    }
    // 处理分隔线
    else if (trimmedLine.match(/^[-*_]{3,}$/)) {
      this.finalizeCurrentBlock();
      this.blocks.push({
        type: 'divider',
        content: '',
        children: []
      });
    }
    // 处理普通段落
    else {
      if (!this.currentBlock || this.currentBlock.type !== 'paragraph') {
        this.finalizeCurrentBlock();
        this.currentBlock = {
          type: 'paragraph',
          content: trimmedLine
        };
      } else {
        // 追加到当前段落
        this.currentBlock.content += ' ' + trimmedLine;
      }
    }
  }

  /**
   * 完成当前块
   */
  private finalizeCurrentBlock(): void {
    if (this.currentBlock && this.currentBlock.content) {
      const block: MarkdownBlock = {
        type: this.currentBlock.type as any,
        content: this.currentBlock.content,
        properties: this.currentBlock.properties,
        children: this.currentBlock.children || []
      };
      this.blocks.push(block);
    }
    this.currentBlock = null;
  }

  /**
   * 完成表格并添加到块列表
   */
  private finalizeTable(): void {
    if (this.tableRows.length > 0) {
      // Convert table rows to markdown format
      const markdownTable = this.tableRows.map(row =>
        `| ${row.join(' | ')} |`
      ).join('\n');

      // Parse using SimpleTableBlock parser
      const tableData = parseMarkdownTable(markdownTable, `table-${Date.now()}`);

      this.blocks.push({
        type: 'table',
        content: markdownTable,  // Store markdown for reference
        properties: { tableData },  // Store the parsed SimpleTableBlockData
        children: []
      });
    }
    this.tableRows = [];
    this.inTable = false;
  }

  /**
   * 生成带样式的表格 HTML
   * 使用内联样式确保在 NotionBlock 中正确显示
   */
  private generateTableHTML(rows: string[][]): string {
    const style = `border-collapse: collapse; width: 100%; border: 1px solid #e0e0e0;`;
    const cellStyle = `border: 1px solid #e0e0e0; padding: 8px; min-width: 80px; vertical-align: top;`;

    const rowsHtml = rows.map(row =>
      `<tr>${row.map(cell => `<td style="${cellStyle}">${cell}</td>`).join('')}</tr>`
    ).join('');

    return `<table style="${style}">${rowsHtml}</table>`;
  }

  /**
   * 获取所有解析的块
   */
  getBlocks(): MarkdownBlock[] {
    return [...this.blocks];
  }

  /**
   * 获取当前缓冲区内容（用于显示不完整的行）
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * 将 Markdown 块转换为 NotionBlock 格式
   */
  static toNotionBlocks(blocks: MarkdownBlock[], prefixId: string = ''): any[] {
    return blocks.map((block, index) => {
      const notionBlock: any = {
        id: `${prefixId}-${block.type}-${Date.now()}-${index}`,
        type: block.type,
        content: block.content,
        properties: {
          ...(block.properties || {}),
          // For tables, ensure tableData is in properties
          ...(block.type === 'table' && block.properties?.tableData ? {
            tableData: block.properties.tableData
          } : {})
        },
        children: []
      };

      // 递归处理子块
      if (block.children && block.children.length > 0) {
        notionBlock.children = StreamingMarkdownParser.toNotionBlocks(block.children, notionBlock.id);
      }

      return notionBlock;
    });
  }
}

/**
 * 实时 Markdown 渲染器
 * 用于在 React 组件中实时渲染流式内容
 */
export class RealtimeMarkdownRenderer {
  private parser: StreamingMarkdownParser;
  private renderedBlocks: MarkdownBlock[] = [];

  constructor() {
    this.parser = new StreamingMarkdownParser();
  }

  /**
   * 处理新的内容块，返回渲染的块列表
   */
  processChunk(chunk: string): MarkdownBlock[] {
    this.renderedBlocks = this.parser.parseChunk(chunk);
    return this.renderedBlocks;
  }

  /**
   * 获取当前渲染的块
   */
  getRenderedBlocks(): MarkdownBlock[] {
    return this.renderedBlocks;
  }

  /**
   * 重置渲染器
   */
  reset(): void {
    this.parser.reset();
    this.renderedBlocks = [];
  }
}

/**
 * 智能表格构建器
 * 用于在流式输出时逐步构建表格
 */
export class SmartTableBuilder {
  private rows: string[][] = [];
  private maxColumns = 0;

  /**
   * 解析表格行
   */
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

    // 更新最大列数
    this.maxColumns = Math.max(this.maxColumns, cells.length);

    this.rows.push(cells);
    return cells;
  }

  /**
   * 获取实时 HTML 表格
   * 即使表格不完整也能渲染
   */
  getHTML(): string {
    if (this.rows.length === 0) {
      // 返回空表格占位符
      return this.generateEmptyTable();
    }

    const style = `border-collapse: collapse; width: 100%; border: 1px solid #e0e0e0;`;
    const cellStyle = `border: 1px solid #e0e0e0; padding: 8px; min-width: 80px; vertical-align: top;`;

    const rowsHtml = this.rows.map(row =>
      `<tr>${row.map(cell => `<td style="${cellStyle}">${cell}</td>`).join('')}</tr>`
    ).join('');

    return `<table style="${style}">${rowsHtml}</table>`;
  }

  /**
   * 生成空表格（3x3）
   */
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

  /**
   * 重置构建器
   */
  reset(): void {
    this.rows = [];
    this.maxColumns = 0;
  }

  /**
   * 获取行数和列数
   */
  getDimensions(): { rows: number; columns: number } {
    return {
      rows: this.rows.length,
      columns: this.maxColumns
    };
  }
}
