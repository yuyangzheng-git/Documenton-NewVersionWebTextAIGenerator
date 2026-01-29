'use client';

import { useEffect, useRef } from 'react';
import { autoCloseMarkdown } from '@/lib/streaming-markdown-handler';
import { createSafeHtml } from '@/lib/html-sanitizer';

interface StreamingMarkdownRendererProps {
  markdown: string;
  isComplete?: boolean;
  className?: string;
}

/**
 * 流式 Markdown 渲染器
 * 支持自动补全未关闭的语法结构，避免渲染崩溃
 */
export const StreamingMarkdownRenderer = function StreamingMarkdownRenderer({ markdown, isComplete = false, className = '' }: StreamingMarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMarkdownRef = useRef('');

  // 自动补全 Markdown（仅用于渲染，不修改原始数据）
  const safeMarkdown = isComplete ? markdown : autoCloseMarkdown(markdown);

  // 将 Markdown 转换为 HTML（简化版，用于流式预览）
  const renderMarkdownToHTML = (text: string): string => {
    let html = text;

    // 转义 HTML（但保留我们添加的临时补全标记）
    // 注意：这里需要小心处理，避免双重转义

    // 代码块
    html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
      const language = lang || 'plaintext';
      const escapedCode = escapeHtml(code);
      return `<pre class="language-${language}"><code class="language-${language}">${escapedCode}</code></pre>`;
    });

    // 未关闭的代码块（临时补全）
    html = html.replace(/```(\w*)\n([\s\S]*?)$/g, (match, lang, code) => {
      const language = lang || 'plaintext';
      const escapedCode = escapeHtml(code);
      return `<pre class="language-${language} streaming-incomplete"><code class="language-${language}">${escapedCode}</code></pre>`;
    });

    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 标题
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // 粗体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 斜体
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 分割线
    html = html.replace(/^---$/gm, '<hr />');

    // 列表
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // 清理空段落
    html = html.replace(/<p>\s*<\/p>/g, '');

    // 表格（简化处理）- 在段落处理之后
    const tableLines = text.split('\n').filter(line => line.trim().startsWith('|'));
    if (tableLines.length >= 2) {
      // 检测表格结构
      const tableHTML = renderTable(tableLines);
      if (tableHTML) {
        // 从段落中移除表格行
        html = html.replace(/<p>[^<]*\|[^<]*<\/p>/g, '');
        // 添加表格
        html += tableHTML;
      }
    }

    return html;
  };

  // 表格渲染 - 参考 AppFlowy 的实现思路
  const renderTable = (lines: string[]): string => {
    if (lines.length === 0) return '';

    // 1. 识别表格结构
    let headerLine = '';
    let separatorLine = '';
    const dataLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('|')) continue;

      if (i === 0) {
        headerLine = line;
      } else if (i === 1 && line.match(/^\|[\s\-:|]+\|$/)) {
        // 分隔行格式：| --- | --- | 或 | :--- | :---: | ---: |
        separatorLine = line;
      } else if (separatorLine) {
        // 分隔行之后的都是数据行
        dataLines.push(line);
      }
    }

    // 2. 如果没有找到标准的表格结构，尝试简化解析
    if (!headerLine) return '';

    // 解析表头
    const headerCells = parseTableRow(headerLine);
    if (headerCells.length === 0) return '';

    // 3. 解析对齐方式（从分隔行）
    const alignments = separatorLine ? parseTableAlignment(separatorLine) : [];

    // 4. 构建表格 HTML
    let tableHTML = '<table class="streaming-table"><thead><tr>';

    for (let i = 0; i < headerCells.length; i++) {
      const align = alignments[i] || 'left';
      tableHTML += `<th style="text-align: ${align}">${renderCellContent(headerCells[i])}</th>`;
    }
    tableHTML += '</tr></thead><tbody>';

    // 5. 渲染数据行
    for (const row of dataLines) {
      const cells = parseTableRow(row);
      if (cells.length > 0) {
        tableHTML += '<tr>';
        for (let i = 0; i < cells.length; i++) {
          const align = alignments[i] || 'left';
          tableHTML += `<td style="text-align: ${align}">${renderCellContent(cells[i])}</td>`;
        }
        tableHTML += '</tr>';
      }
    }

    tableHTML += '</tbody></table>';
    return tableHTML;
  };

  // 解析表格行 - 参考 AppFlowy 的实现，支持转义字符
  const parseTableRow = (line: string): string[] => {
    const cells: string[] = [];
    let currentCell = '';
    let escaped = false;

    // 移除开头和结尾的 |
    const trimmed = line.trim();
    const content = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
    const finalContent = content.endsWith('|') ? content.slice(0, -1) : content;

    // 逐字符解析，处理转义的管道符 \|
    for (let i = 0; i < finalContent.length; i++) {
      const char = finalContent[i];

      if (char === '\\' && i + 1 < finalContent.length && finalContent[i + 1] === '|') {
        // 转义的管道符，添加到当前单元格
        currentCell += '|';
        escaped = true;
        i++; // 跳过下一个字符
      } else if (char === '|' && !escaped) {
        // 未转义的管道符，表示单元格分隔
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
        escaped = false;
      }
    }

    // 添加最后一个单元格
    if (currentCell.trim() !== '') {
      cells.push(currentCell.trim());
    }

    return cells;
  };

  // 解析表格对齐方式 - 参考 AppFlowy 的实现
  const parseTableAlignment = (separatorLine: string): string[] => {
    const alignments: string[] = [];
    const cells = parseTableRow(separatorLine);

    for (const cell of cells) {
      const trimmed = cell.trim();
      const startsWithColon = trimmed.startsWith(':');
      const endsWithColon = trimmed.endsWith(':');

      if (startsWithColon && endsWithColon) {
        alignments.push('center');
      } else if (endsWithColon) {
        alignments.push('right');
      } else if (startsWithColon) {
        alignments.push('left');
      } else {
        alignments.push('left');
      }
    }

    return alignments;
  };

  // 渲染单元格内容 - 支持富文本（粗体、斜体、链接等）
  const renderCellContent = (content: string): string => {
    let html = escapeHtml(content);

    // 链接 [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 行内代码 `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 粗体 **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 斜体 *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return html;
  };

  // HTML 转义
  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  // 应用语法高亮（Prism.js）
  useEffect(() => {
    if (containerRef.current) {
      // 检查是否加载了 Prism
      if (typeof window !== 'undefined' && (window as any).Prism) {
        const Prism = (window as any).Prism;
        Prism.highlightAllUnder(containerRef.current);
      }
    }
  }, [markdown, isComplete]);

  // 自动滚动到底部（如果内容增加了）
  useEffect(() => {
    if (containerRef.current && markdown.length > prevMarkdownRef.current.length) {
      // 只当内容增加时滚动到底部
      // const shouldScroll = containerRef.current.scrollTop + containerRef.current.clientHeight >= containerRef.current.scrollHeight - 100;
      // if (shouldScroll) {
      //   containerRef.current.scrollTop = containerRef.current.scrollHeight;
      // }
    }
    prevMarkdownRef.current = markdown;
  }, [markdown]);

  const html = renderMarkdownToHTML(safeMarkdown);

  return (
    <div
      ref={containerRef}
      className={`streaming-markdown-renderer ${className}`}
      dangerouslySetInnerHTML={createSafeHtml(html)}
      style={{
        lineHeight: '1.7',
        fontSize: '15px',
        color: 'rgba(55, 53, 47, 0.9)'
      }}
    />
  );
}

// 添加样式（实际项目中应该放在 CSS 文件中）
const styles = `
  .streaming-markdown-renderer pre {
    background: #2d2d2d;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
  }

  .streaming-markdown-renderer pre.streaming-incomplete {
    border-left: 3px solid #ff9800;
  }

  .streaming-markdown-renderer code {
    background: rgba(55, 53, 47, 0.08);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  .streaming-markdown-renderer pre code {
    background: transparent;
    padding: 0;
    border-radius: 0;
    color: #f8f8f2;
  }

  .streaming-markdown-renderer h1,
  .streaming-markdown-renderer h2,
  .streaming-markdown-renderer h3,
  .streaming-markdown-renderer h4 {
    margin-top: 24px;
    margin-bottom: 12px;
    font-weight: 600;
    line-height: 1.3;
  }

  .streaming-markdown-renderer h1 { font-size: 30px; }
  .streaming-markdown-renderer h2 { font-size: 24px; }
  .streaming-markdown-renderer h3 { font-size: 20px; }
  .streaming-markdown-renderer h4 { font-size: 18px; }

  .streaming-markdown-renderer ul,
  .streaming-markdown-renderer ol {
    margin: 12px 0;
    padding-left: 24px;
  }

  .streaming-markdown-renderer li {
    margin: 4px 0;
  }

  .streaming-markdown-renderer hr {
    border: none;
    border-top: 1px solid rgba(55, 53, 47, 0.2);
    margin: 24px 0;
  }

  .streaming-markdown-renderer .streaming-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    border: 1px solid rgba(55, 53, 47, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .streaming-markdown-renderer .streaming-table th,
  .streaming-markdown-renderer .streaming-table td {
    padding: 8px 12px;
    border: 1px solid rgba(55, 53, 47, 0.1);
    text-align: left;
  }

  .streaming-markdown-renderer .streaming-table th {
    background: rgba(55, 53, 47, 0.05);
    font-weight: 600;
  }

  .streaming-markdown-renderer p {
    margin: 8px 0;
  }
`;

// 注入样式到文档
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
