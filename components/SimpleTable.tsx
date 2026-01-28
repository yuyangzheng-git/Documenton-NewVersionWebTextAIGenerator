'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

/**
 * SimpleTable 组件
 * 参考 AppFlowy 的 simple_table 实现
 * 支持：
 * - 表头行和表头列
 * - 动态添加/删除行列
 * - 单元格内联编辑
 * - 列宽调整
 */

export interface TableCell {
  content: string;
}

export interface TableRow {
  cells: TableCell[];
}

export interface SimpleTableProps {
  rows: TableRow[];
  enableHeaderRow?: boolean;
  enableHeaderColumn?: boolean;
  onUpdate?: (rows: TableRow[]) => void;
  editable?: boolean;
}

export function SimpleTable({
  rows: initialRows,
  enableHeaderRow = false,
  enableHeaderColumn = false,
  onUpdate,
  editable = true
}: SimpleTableProps) {
  const [rows, setRows] = useState<TableRow[]>(initialRows);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

  // 更新父组件
  const handleUpdate = (newRows: TableRow[]) => {
    setRows(newRows);
    onUpdate?.(newRows);
  };

  // 添加行
  const addRow = () => {
    const newRow: TableRow = {
      cells: Array(rows[0]?.cells.length || 3).fill(null).map(() => ({ content: '' }))
    };
    handleUpdate([...rows, newRow]);
  };

  // 删除行
  const deleteRow = (rowIndex: number) => {
    if (rows.length <= 1) return; // 至少保留一行
    const newRows = rows.filter((_, index) => index !== rowIndex);
    handleUpdate(newRows);
  };

  // 添加列
  const addColumn = () => {
    const newRows = rows.map(row => ({
      cells: [...row.cells, { content: '' }]
    }));
    handleUpdate(newRows);
  };

  // 删除列
  const deleteColumn = (colIndex: number) => {
    if (rows[0]?.cells.length <= 1) return; // 至少保留一列
    const newRows = rows.map(row => ({
      cells: row.cells.filter((_, index) => index !== colIndex)
    }));
    handleUpdate(newRows);
  };

  // 更新单元格内容
  const updateCell = (rowIndex: number, colIndex: number, content: string) => {
    const newRows = [...rows];
    newRows[rowIndex].cells[colIndex].content = content;
    handleUpdate(newRows);
  };

  // 判断是否是表头单元格
  const isHeaderCell = (rowIndex: number, colIndex: number) => {
    return (enableHeaderRow && rowIndex === 0) || (enableHeaderColumn && colIndex === 0);
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          border: '1px solid #e0e0e0',
          backgroundColor: '#fff'
        }}
      >
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.cells.map((cell, colIndex) => {
                const isHeader = isHeaderCell(rowIndex, colIndex);
                const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;

                return (
                  <td
                    key={colIndex}
                    onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => editable && setEditingCell({ row: rowIndex, col: colIndex })}
                    style={{
                      border: '1px solid #e0e0e0',
                      padding: '8px',
                      minWidth: '80px',
                      verticalAlign: 'top',
                      backgroundColor: isHeader ? '#f7f7f7' : 'transparent',
                      fontWeight: isHeader ? 600 : 400,
                      position: 'relative',
                      cursor: editable ? 'text' : 'default'
                    }}
                  >
                    {isEditing ? (
                      <textarea
                        autoFocus
                        value={cell.content}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        style={{
                          width: '100%',
                          minHeight: '40px',
                          border: 'none',
                          outline: 'none',
                          resize: 'vertical',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          backgroundColor: 'transparent'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          minHeight: '20px',
                          fontSize: '14px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {cell.content || (editable ? '点击编辑' : '')}
                      </div>
                    )}

                    {/* 悬停时显示删除按钮 */}
                    {editable && isHovered && (
                      <div style={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 4 }}>
                        {rowIndex > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRow(rowIndex);
                            }}
                            style={{
                              padding: '2px 4px',
                              fontSize: '10px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '3px',
                              backgroundColor: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                            title="删除此行"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                        {colIndex > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteColumn(colIndex);
                            }}
                            style={{
                              padding: '2px 4px',
                              fontSize: '10px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '3px',
                              backgroundColor: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                            title="删除此列"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 添加行/列按钮 */}
      {editable && (
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button
            onClick={addRow}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Plus size={12} />
            添加行
          </button>
          <button
            onClick={addColumn}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Plus size={12} />
            添加列
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 工具函数：将 Markdown 表格转换为 TableRow 格式
 */
export function parseMarkdownTable(markdown: string): TableRow[] {
  const lines = markdown.trim().split('\n');
  const rows: TableRow[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

    const cells = trimmed.slice(1, -1).split('|').map(cell => cell.trim());

    // 跳过分隔行（例如 |---|---|）
    if (cells.every(cell => /^-+$/.test(cell))) continue;

    rows.push({
      cells: cells.map(content => ({ content }))
    });
  }

  return rows;
}

/**
 * 工具函数：将 HTML 表格转换为 TableRow 格式
 */
export function parseHTMLTable(html: string): TableRow[] {
  // 创建临时 DOM 元素来解析 HTML
  if (typeof window === 'undefined') return [];

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const table = tempDiv.querySelector('table');
  if (!table) return [];

  const rows: TableRow[] = [];
  const trs = table.querySelectorAll('tr');

  trs.forEach(tr => {
    const cells: TableCell[] = [];
    const tds = tr.querySelectorAll('td, th');

    tds.forEach(td => {
      cells.push({ content: td.textContent || '' });
    });

    if (cells.length > 0) {
      rows.push({ cells });
    }
  });

  return rows;
}

/**
 * 工具函数：将 TableRow 格式转换为 HTML
 */
export function tableRowsToHTML(rows: TableRow[], enableHeaderRow = false): string {
  const style = `border-collapse: collapse; width: 100%; border: 1px solid #e0e0e0;`;
  const cellStyle = `border: 1px solid #e0e0e0; padding: 8px; min-width: 80px; vertical-align: top;`;
  const headerCellStyle = `${cellStyle} font-weight: 600; background-color: #f7f7f7;`;

  const rowsHtml = rows.map((row, rowIndex) => {
    const isHeaderRow = enableHeaderRow && rowIndex === 0;
    const tag = isHeaderRow ? 'th' : 'td';
    const currentStyle = isHeaderRow ? headerCellStyle : cellStyle;

    return `<tr>${row.cells.map(cell =>
      `<${tag} style="${currentStyle}">${cell.content}</${tag}>`
    ).join('')}</tr>`;
  }).join('');

  return `<table style="${style}">${rowsHtml}</table>`;
}
