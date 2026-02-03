'use client';

import { v4 as uuidv4 } from 'uuid';
import { TableBlockData, TableColumn, TableRow } from '../types';

/**
 * 创建默认表格数据
 * @param rows 行数 (默认 3)
 * @param cols 列数 (默认 3)
 * @returns 表格数据结构
 */
export function createDefaultTable(rows: number = 3, cols: number = 3): TableBlockData {
  const columns: TableColumn[] = Array.from({ length: cols }, () => ({
    id: uuidv4(),
    width: 150
  }));

  const tableRows: TableRow[] = Array.from({ length: rows }, () => ({
    id: uuidv4(),
    cells: Array.from({ length: cols }, () => ({
      content: '',
      align: 'left' as const
    }))
  }));

  return {
    id: uuidv4(),
    type: 'table',
    columns,
    rows: tableRows,
    enableHeaderRow: true,
    defaultColumnWidth: 150
  };
}
