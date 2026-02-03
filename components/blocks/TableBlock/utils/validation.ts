'use client';

import { TableBlockData } from '../types';
import { createDefaultTable } from './defaults';

/**
 * 验证表格数据是否有效
 */
export function validateTableData(data: any): TableBlockData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid table data: not an object');
  }

  if (!Array.isArray(data.columns) || data.columns.length === 0) {
    throw new Error('Table must have at least one column');
  }

  if (!Array.isArray(data.rows) || data.rows.length === 0) {
    throw new Error('Table must have at least one row');
  }

  const colCount = data.columns.length;
  data.rows.forEach((row: any, idx: number) => {
    if (!Array.isArray(row.cells) || row.cells.length !== colCount) {
      throw new Error(`Row ${idx} has inconsistent cell count: expected ${colCount}, got ${row.cells?.length || 0}`);
    }
  });

  // Validate each column has an id
  data.columns.forEach((col: any, idx: number) => {
    if (!col.id || typeof col.id !== 'string') {
      throw new Error(`Column ${idx} missing valid id`);
    }
  });

  // Validate each row has an id and cells
  data.rows.forEach((row: any, idx: number) => {
    if (!row.id || typeof row.id !== 'string') {
      throw new Error(`Row ${idx} missing valid id`);
    }
    if (!Array.isArray(row.cells)) {
      throw new Error(`Row ${idx} cells is not an array`);
    }
  });

  return data as TableBlockData;
}

/**
 * 清理并验证表格数据，如果无效则返回默认表格
 */
export function sanitizeTableData(data: any): TableBlockData {
  try {
    return validateTableData(data);
  } catch (error) {
    console.error('Invalid table data, creating default table:', error);
    return createDefaultTable(3, 3);
  }
}

/**
 * 检查是否可以删除行
 */
export function canDeleteRow(table: TableBlockData): boolean {
  return table.rows.length > 1;
}

/**
 * 检查是否可以删除列
 */
export function canDeleteColumn(table: TableBlockData): boolean {
  return table.columns.length > 1;
}
