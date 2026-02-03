'use client';

import { v4 as uuidv4 } from 'uuid';
import { TableBlockData, TableRow, TableColumn, TableCell } from './types';

/**
 * 添加新行到表格底部
 */
export function addRowToTable(table: TableBlockData): TableBlockData {
  const newRow: TableRow = {
    id: uuidv4(),
    cells: table.columns.map(() => ({ content: '', align: 'left' as const }))
  };

  return {
    ...table,
    rows: [...table.rows, newRow]
  };
}

/**
 * 删除指定行
 */
export function deleteRow(table: TableBlockData, rowId: string): TableBlockData {
  if (table.rows.length <= 1) {
    throw new Error('Cannot delete last row');
  }

  return {
    ...table,
    rows: table.rows.filter(row => row.id !== rowId)
  };
}

/**
 * 在指定位置插入新行
 */
export function insertRowAfter(table: TableBlockData, afterRowId: string): TableBlockData {
  const rowIndex = table.rows.findIndex(row => row.id === afterRowId);
  if (rowIndex === -1) {
    return addRowToTable(table);
  }

  const newRow: TableRow = {
    id: uuidv4(),
    cells: table.columns.map(() => ({ content: '', align: 'left' as const }))
  };

  const newRows = [...table.rows];
  newRows.splice(rowIndex + 1, 0, newRow);

  return {
    ...table,
    rows: newRows
  };
}

/**
 * 添加新列到表格右侧
 */
export function addColumnToTable(table: TableBlockData): TableBlockData {
  const newColumn: TableColumn = {
    id: uuidv4(),
    width: table.defaultColumnWidth || 150
  };

  return {
    ...table,
    columns: [...table.columns, newColumn],
    rows: table.rows.map(row => ({
      ...row,
      cells: [...row.cells, { content: '', align: 'left' as const }]
    }))
  };
}

/**
 * 删除指定列
 */
export function deleteColumn(table: TableBlockData, colId: string): TableBlockData {
  if (table.columns.length <= 1) {
    throw new Error('Cannot delete last column');
  }

  const colIndex = table.columns.findIndex(col => col.id === colId);
  if (colIndex === -1) {
    return table;
  }

  return {
    ...table,
    columns: table.columns.filter(col => col.id !== colId),
    rows: table.rows.map(row => ({
      ...row,
      cells: row.cells.filter((_, idx) => idx !== colIndex)
    }))
  };
}

/**
 * 在指定位置插入新列
 */
export function insertColumnAfter(table: TableBlockData, afterColId: string): TableBlockData {
  const colIndex = table.columns.findIndex(col => col.id === afterColId);
  if (colIndex === -1) {
    return addColumnToTable(table);
  }

  const newColumn: TableColumn = {
    id: uuidv4(),
    width: table.defaultColumnWidth || 150
  };

  const newColumns = [...table.columns];
  newColumns.splice(colIndex + 1, 0, newColumn);

  return {
    ...table,
    columns: newColumns,
    rows: table.rows.map(row => {
      const newCells = [...row.cells];
      newCells.splice(colIndex + 1, 0, { content: '', align: 'left' as const });
      return {
        ...row,
        cells: newCells
      };
    })
  };
}

/**
 * 更新单元格内容
 */
export function updateCell(
  table: TableBlockData,
  rowId: string,
  colIndex: number,
  updates: Partial<TableCell>
): TableBlockData {
  return {
    ...table,
    rows: table.rows.map(row =>
      row.id === rowId
        ? {
            ...row,
            cells: row.cells.map((cell, idx) =>
              idx === colIndex ? { ...cell, ...updates } : cell
            )
          }
        : row
    )
  };
}

/**
 * 更新列宽度
 */
export function updateColumnWidth(
  table: TableBlockData,
  colId: string,
  width: number
): TableBlockData {
  return {
    ...table,
    columns: table.columns.map(col =>
      col.id === colId ? { ...col, width } : col
    )
  };
}
