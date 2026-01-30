/**
 * Markdown 表格解析器
 * 将 Markdown 表格字符串解析为 SimpleTableBlockData 格式
 */

import { SimpleTableBlockData, TableRowData, TableCellData } from '@/components/blocks/SimpleTableBlock';

/**
 * 检测文本是否包含 Markdown 表格
 */
export function containsMarkdownTable(text: string): boolean {
  const lines = text.split('\n');
  const tableLines = lines.filter(line => line.trim().includes('|'));

  // 至少需要 2 行（表头 + 分隔符）
  return tableLines.length >= 2;
}

/**
 * 解析表格行，处理转义的管道符
 */
function parseTableRow(line: string): string[] {
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
  if (currentCell.trim() !== '' || cells.length > 0) {
    cells.push(currentCell.trim());
  }

  return cells;
}

/**
 * 解析对齐方式
 */
function parseAlignment(separatorLine: string): ('left' | 'center' | 'right')[] {
  const cells = parseTableRow(separatorLine);
  const alignments: ('left' | 'center' | 'right')[] = [];

  for (const cell of cells) {
    const trimmed = cell.trim();
    const startsWithColon = trimmed.startsWith(':');
    const endsWithColon = trimmed.endsWith(':');

    if (startsWithColon && endsWithColon) {
      alignments.push('center');
    } else if (endsWithColon) {
      alignments.push('right');
    } else {
      alignments.push('left');
    }
  }

  return alignments;
}

/**
 * 从文本中提取所有 Markdown 表格
 * 返回表格及其在原文中的位置
 */
export interface MarkdownTableSegment {
  type: 'table' | 'text';
  content: string;
  startLine: number;
  endLine: number;
}

export function splitMarkdownTableAndText(text: string): MarkdownTableSegment[] {
  const lines = text.split('\n');
  const segments: MarkdownTableSegment[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 检测是否是表格开始（当前行和下一行都有管道符）
    if (line.trim().includes('|') && i + 1 < lines.length && lines[i + 1].trim().match(/^\|?[\s\-:|]+\|?$/)) {
      // 这是一个表格的开始
      const tableStart = i;
      const tableLines: string[] = [line, lines[i + 1]];
      i += 2;

      // 收集表格的数据行
      while (i < lines.length && lines[i].trim().includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      segments.push({
        type: 'table',
        content: tableLines.join('\n'),
        startLine: tableStart,
        endLine: i - 1
      });
    } else {
      // 这是普通文本
      const textStart = i;
      const textLines: string[] = [];

      // 收集连续的非表格行
      while (i < lines.length) {
        const currentLine = lines[i];
        const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

        // 检查是否是表格开始
        const isTableStart = currentLine.trim().includes('|') &&
                             nextLine &&
                             nextLine.trim().match(/^\|?[\s\-:|]+\|?$/);

        if (isTableStart) {
          break;
        }

        textLines.push(currentLine);
        i++;
      }

      if (textLines.length > 0) {
        segments.push({
          type: 'text',
          content: textLines.join('\n'),
          startLine: textStart,
          endLine: i - 1
        });
      }
    }
  }

  return segments;
}

/**
 * 解析单个 Markdown 表格为 SimpleTableBlockData
 */
export function parseMarkdownTable(markdown: string, blockIdPrefix: string): SimpleTableBlockData | null {
  const lines = markdown.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    return null;
  }

  // 第一行是表头
  const headerLine = lines[0];
  const separatorLine = lines[1];

  // 验证分隔符行
  if (!separatorLine.match(/^\|?[\s\-:|]+\|?$/)) {
    return null;
  }

  // 解析表头
  const headerCells = parseTableRow(headerLine);
  if (headerCells.length === 0) {
    return null;
  }

  // 解析对齐方式
  const alignments = parseAlignment(separatorLine);

  // 解析数据行
  const dataRows: TableRowData[] = [];

  // 表头作为第一行（因为 enableHeaderRow: true）
  const headerRow: TableRowData = {
    cells: headerCells.map(content => ({ content }))
  };
  dataRows.push(headerRow);

  // 解析其他数据行
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().includes('|')) continue;

    const cells = parseTableRow(line);
    if (cells.length > 0) {
      // 确保单元格数量与表头一致
      while (cells.length < headerCells.length) {
        cells.push('');
      }

      dataRows.push({
        cells: cells.slice(0, headerCells.length).map(content => ({ content }))
      });
    }
  }

  // 计算列宽（基于内容长度）
  const columnWidths: Record<number, number> = {};
  const minWidth = 160;
  const maxWidth = 400;

  for (let col = 0; col < headerCells.length; col++) {
    let maxContentLength = 0;

    for (const row of dataRows) {
      const cellContent = row.cells[col]?.content || '';
      // 粗略估算：中文字符算2个单位，英文字符算1个单位
      const length = cellContent.split('').reduce((sum, char) => {
        return sum + (char.match(/[\u4e00-\u9fa5]/) ? 2 : 1);
      }, 0);
      maxContentLength = Math.max(maxContentLength, length);
    }

    // 每个字符大约8px宽度，加上padding
    const estimatedWidth = Math.min(Math.max(maxContentLength * 8 + 20, minWidth), maxWidth);
    columnWidths[col] = estimatedWidth;
  }

  // 构建列对齐映射
  const columnAligns: Record<number, 'left' | 'center' | 'right'> = {};
  alignments.forEach((align, index) => {
    if (align !== 'left') {
      columnAligns[index] = align;
    }
  });

  return {
    id: `${blockIdPrefix}-${Date.now()}`,
    type: 'simple_table',
    rows: dataRows,
    enableHeaderRow: true,
    columnWidths,
    columnAligns: Object.keys(columnAligns).length > 0 ? columnAligns : undefined
  };
}
