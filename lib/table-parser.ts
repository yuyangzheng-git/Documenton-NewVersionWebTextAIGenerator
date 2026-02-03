import { TableBlockData } from '@/components/blocks/TableBlock/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 从Markdown表格字符串解析为TableBlockData
 */
export function parseMarkdownTable(tableString: string): TableBlockData | null {
  const lines = tableString
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && line.endsWith('|'));

  if (lines.length < 3) {
    // 至少需要：表头 + 分隔线 + 1行数据
    return null;
  }

  // 解析表头
  const headerLine = lines[0];
  const headerCells = headerLine
    .split('|')
    .slice(1, -1)
    .map(cell => cell.trim());

  // 验证列数
  const colCount = headerCells.length;
  if (colCount === 0) {
    return null;
  }

  // 生成列
  const columns = headerCells.map(title => ({
    id: uuidv4(),
    title,
    width: 150,
  }));

  // 生成行：先添加表头行，再添加数据行（跳过分隔线）
  const headerRow = {
    id: uuidv4(),
    cells: headerCells.map(content => ({
      content,
      align: 'left' as const,
    })),
  };

  const dataRowObjects = lines.slice(2)
    .map(line => {
      const cellContents = line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim());

      // 验证列数一致
      if (cellContents.length !== colCount) {
        return null;
      }

      return {
        id: uuidv4(),
        cells: cellContents.map(content => ({
          content,
          align: 'left' as const,
        })),
      };
    })
    .filter(row => row !== null) as Array<typeof headerRow>;

  const rows = [headerRow, ...dataRowObjects];

  return {
    columns,
    rows,
    enableHeaderRow: true,
  };
}

/**
 * 从文本中检测和提取Markdown表格
 * 返回 { contentBlocks, tables }
 */
export function extractTablesFromContent(
  content: string
): {
  blocks: Array<{ type: 'text' | 'table'; content: string; tableData?: TableBlockData }>;
} {
  const blocks: Array<{ type: 'text' | 'table'; content: string; tableData?: TableBlockData }> = [];

  // 按双换行符分割段落
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  for (const para of paragraphs) {
    // 检查是否是表格
    if (para.includes('|') && para.split('\n').some(line => line.includes('|'))) {
      const tableData = parseMarkdownTable(para);
      if (tableData) {
        blocks.push({
          type: 'table',
          content: para,
          tableData,
        });
        continue;
      }
    }

    // 否则作为普通文本
    blocks.push({
      type: 'text',
      content: para.trim(),
    });
  }

  return { blocks };
}
