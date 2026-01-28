/**
 * 流式 Markdown 处理器
 * 实现状态机与增量补全，解决流式输出时的 Markdown 渲染问题
 *
 * 核心功能：
 * 1. 缓冲区管理 - 维护 responseText 变量，每收到一个 token 就拼接
 * 2. 状态机解析 - 识别 Markdown 语法结构（代码块、表格、列表等）
 * 3. 自动补全 - 对未关闭的语法结构临时添加结束标记
 * 4. 节流渲染 - 避免频繁更新导致闪烁
 */

export interface MarkdownBlock {
  type: 'heading' | 'paragraph' | 'code' | 'quote' | 'list' | 'divider' | 'table';
  content: string;
  level?: number;
  listType?: 'bullet' | 'numbered';
  language?: string;
  raw?: string; // 原始 Markdown 用于重新解析
}

export interface ParseResult {
  blocks: MarkdownBlock[];
  isComplete: boolean; // 是否完成（所有标签都已关闭）
  hasIncomplete: boolean; // 是否有不完整的结构
}

export class StreamingMarkdownHandler {
  private buffer: string = '';
  private lastUpdateTime: number = 0;
  private throttleDelay: number = 100; // 节流延迟 100ms
  private parseTimer: NodeJS.Timeout | null = null;
  private onCompleteCallback?: (result: ParseResult) => void;

  /**
   * 追加流式数据
   */
  append(chunk: string): void {
    this.buffer += chunk;
    this.scheduleParse();
  }

  /**
   * 设置解析完成回调
   */
  setOnComplete(callback: (result: ParseResult) => void): void {
    this.onCompleteCallback = callback;
  }

  /**
   * 节流解析调度
   */
  private scheduleParse(): void {
    if (this.parseTimer) {
      clearTimeout(this.parseTimer);
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    if (timeSinceLastUpdate >= this.throttleDelay) {
      this.parse();
      this.lastUpdateTime = now;
    } else {
      // 如果距离上次更新不足节流时间，延迟执行
      this.parseTimer = setTimeout(() => {
        this.parse();
        this.lastUpdateTime = Date.now();
        this.parseTimer = null;
      }, this.throttleDelay - timeSinceLastUpdate);
    }
  }

  /**
   * 解析当前缓冲区内容
   */
  private parse(): ParseResult {
    const result = this.parseMarkdown(this.buffer);

    // 触发回调
    if (this.onCompleteCallback) {
      this.onCompleteCallback(result);
    }

    return result;
  }

  /**
   * 核心 Markdown 解析器（状态机实现）
   */
  private parseMarkdown(text: string): ParseResult {
    const blocks: MarkdownBlock[] = [];
    const lines = text.split('\n');
    let currentBlock: MarkdownBlock | null = null;
    let inCodeBlock = false;
    let codeBlockLanguage = '';
    let codeBlockContent: string[] = [];
    let inTable = false;
    let tableContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 检查代码块
      if (trimmedLine.startsWith('```')) {
        if (!inCodeBlock) {
          // 开始代码块
          inCodeBlock = true;
          codeBlockLanguage = trimmedLine.slice(3).trim() || 'plaintext';
          codeBlockContent = [];
        } else {
          // 结束代码块
          inCodeBlock = false;
          blocks.push({
            type: 'code',
            content: codeBlockContent.join('\n'),
            language: codeBlockLanguage,
            raw: `\`\`\`${codeBlockLanguage}\n${codeBlockContent.join('\n')}\n\`\`\``
          });
          codeBlockContent = [];
          continue;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // 检查表格
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableContent = [];
        }
        tableContent.push(line);
        continue;
      } else if (inTable) {
        // 表格结束：遇到非表格行（参考 AppFlowy 的实现）
        inTable = false;
        if (tableContent.length > 0) {
          blocks.push({
            type: 'table',
            content: tableContent.join('\n'),
            raw: tableContent.join('\n')
          });
          tableContent = [];
        }
        // 重要：继续处理当前行，不要 continue
      }

      // 检查分割线
      if (/^[-*_]{3,}$/.test(trimmedLine)) {
        blocks.push({
          type: 'divider',
          content: '---',
          raw: line
        });
        continue;
      }

      // 检查标题
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        blocks.push({
          type: 'heading',
          level: headingMatch[1].length,
          content: headingMatch[2],
          raw: line
        });
        continue;
      }

      // 检查引用
      if (trimmedLine.startsWith('>')) {
        if (currentBlock?.type === 'quote') {
          currentBlock.content += '\n' + line;
        } else {
          currentBlock = {
            type: 'quote',
            content: line,
            raw: line
          };
          blocks.push(currentBlock);
        }
        continue;
      }

      // 检查列表
      if (trimmedLine.match(/^[-*]\s+/)) {
        if (currentBlock?.type === 'list' && currentBlock.listType === 'bullet') {
          currentBlock.content += '\n' + line;
        } else {
          currentBlock = {
            type: 'list',
            listType: 'bullet',
            content: line,
            raw: line
          };
          blocks.push(currentBlock);
        }
        continue;
      }

      if (trimmedLine.match(/^\d+\.\s+/)) {
        if (currentBlock?.type === 'list' && currentBlock.listType === 'numbered') {
          currentBlock.content += '\n' + line;
        } else {
          currentBlock = {
            type: 'list',
            listType: 'numbered',
            content: line,
            raw: line
          };
          blocks.push(currentBlock);
        }
        continue;
      }

      // 默认段落
      if (trimmedLine === '') {
        currentBlock = null;
        continue;
      }

      if (currentBlock?.type === 'paragraph') {
        currentBlock.content += '\n' + line;
        currentBlock.raw += '\n' + line;
      } else {
        currentBlock = {
          type: 'paragraph',
          content: line,
          raw: line
        };
        blocks.push(currentBlock);
      }
    }

    // 处理未完成的代码块（自动补全）
    if (inCodeBlock) {
      blocks.push({
        type: 'code',
        content: codeBlockContent.join('\n'),
        language: codeBlockLanguage,
        raw: `\`\`\`${codeBlockLanguage}\n${codeBlockContent.join('\n')}\n\`\`\``
      });
    }

    // 处理未完成的表格（自动补全）
    if (inTable && tableContent.length > 0) {
      blocks.push({
        type: 'table',
        content: tableContent.join('\n'),
        raw: tableContent.join('\n')
      });
    }

    return {
      blocks,
      isComplete: !inCodeBlock && !inTable,
      hasIncomplete: inCodeBlock || inTable
    };
  }

  /**
   * 获取用于渲染的安全 HTML（自动补全未关闭标签）
   */
  getSafeHTML(): string {
    let html = this.buffer;

    // 检查并自动补全代码块
    const codeBlockMatches = html.match(/```(\w*)\n/g);
    const codeBlockEndMatches = html.match(/\n```/g);
    if (codeBlockMatches && (!codeBlockEndMatches || codeBlockMatches.length > codeBlockEndMatches.length)) {
      // 有未关闭的代码块，临时添加结束标记
      html += '\n```';
    }

    // 检查并自动补全行内代码
    const inlineCodeCount = (html.match(/`/g) || []).length;
    if (inlineCodeCount % 2 !== 0) {
      // 有未关闭的行内代码，临时添加结束标记
      html += '`';
    }

    // 检查并自动补全粗体
    const boldCount = (html.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) {
      // 有未关闭的粗体，临时添加结束标记
      html += '**';
    }

    // 检查并自动补全斜体
    const italicCount = (html.match(/(?<!\*)\*(?!\*)/g) || []).length;
    if (italicCount % 2 !== 0) {
      // 有未关闭的斜体，临时添加结束标记
      html += '*';
    }

    return html;
  }

  /**
   * 重置缓冲区
   */
  reset(): void {
    this.buffer = '';
    this.lastUpdateTime = 0;
    if (this.parseTimer) {
      clearTimeout(this.parseTimer);
      this.parseTimer = null;
    }
  }

  /**
   * 获取当前缓冲区内容
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * 设置节流延迟
   */
  setThrottleDelay(delay: number): void {
    this.throttleDelay = delay;
  }
}

/**
 * 工具函数：检测文本是否包含未关闭的 Markdown 语法
 */
export function detectIncompleteMarkdown(text: string): {
  hasUnclosedCodeBlock: boolean;
  hasUnclosedInlineCode: boolean;
  hasUnclosedBold: boolean;
  hasUnclosedItalic: boolean;
  hasUnclosedTable: boolean;
} {
  const result = {
    hasUnclosedCodeBlock: false,
    hasUnclosedInlineCode: false,
    hasUnclosedBold: false,
    hasUnclosedItalic: false,
    hasUnclosedTable: false
  };

  // 检查代码块
  const codeBlockStarts = (text.match(/```/g) || []).length;
  if (codeBlockStarts % 2 !== 0) {
    result.hasUnclosedCodeBlock = true;
  }

  // 检查行内代码（排除代码块内的）
  const lines = text.split('\n');
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (!inCodeBlock) {
      const inlineCodeCount = (line.match(/`/g) || []).length;
      if (inlineCodeCount % 2 !== 0) {
        result.hasUnclosedInlineCode = true;
        break;
      }
    }
  }

  // 检查粗体（排除代码块和行内代码内的）
  inCodeBlock = false;
  let inInlineCode = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '`' && nextChar !== '`') {
        inInlineCode = !inInlineCode;
      } else if (!inInlineCode && char === '*' && nextChar === '*') {
        result.hasUnclosedBold = !result.hasUnclosedBold;
        i++; // 跳过下一个 *
      }
    }
  }

  // 检查表格 - 改进的检测逻辑
  const tableLines = lines.filter(line => line.trim().startsWith('|'));
  if (tableLines.length > 0) {
    // 检查表格是否被空行结束
    const lastTableIndex = lines.map(l => l.trim().startsWith('|')).lastIndexOf(true);
    const linesAfterTable = lines.slice(lastTableIndex + 1);

    // 如果表格后面有非空内容，说明表格已经结束
    const hasNonEmptyContentAfterTable = linesAfterTable.some(line => {
      const trimmed = line.trim();
      return trimmed !== '' && !trimmed.startsWith('|');
    });

    result.hasUnclosedTable = !hasNonEmptyContentAfterTable;
  }

  return result;
}

/**
 * 工具函数：自动补全未关闭的 Markdown 语法
 */
export function autoCloseMarkdown(text: string): string {
  let result = text;

  const incomplete = detectIncompleteMarkdown(text);

  if (incomplete.hasUnclosedCodeBlock) {
    result += '\n```';
  }

  if (incomplete.hasUnclosedInlineCode) {
    result += '`';
  }

  if (incomplete.hasUnclosedBold) {
    result += '**';
  }

  if (incomplete.hasUnclosedTable) {
    // 表格通常不需要显式关闭，但可以添加空行
    if (!result.endsWith('\n')) {
      result += '\n';
    }
  }

  return result;
}
