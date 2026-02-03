'use client';

import { useState, useEffect, useCallback } from 'react';
import { TableCell } from './TableCell';
import { TableBlockData } from './types';
import { createDefaultTable } from './utils/defaults';
import { sanitizeTableData, canDeleteRow, canDeleteColumn } from './utils/validation';
import {
  addRowToTable,
  deleteRow,
  addColumnToTable,
  deleteColumn,
  updateCell,
  insertRowAfter,
  insertColumnAfter
} from './operations';
import { Plus, Minus } from 'lucide-react';

interface TableBlockProps {
  block: any;
  editable?: boolean;
  onUpdate?: (id: string, updates: Partial<any>) => void;
  onDelete?: (id: string) => void;
}

// 自定义滚动条样式
const scrollContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  overflowX: 'auto',
  overflowY: 'visible',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'thin' as const,
  scrollbarColor: '#cbd5e0 #f7fafc',
  boxSizing: 'border-box'
};

export function TableBlock({ block, editable = true, onUpdate }: TableBlockProps) {
  const [tableData, setTableData] = useState<TableBlockData>(() => {
    return sanitizeTableData(block.properties?.tableData);
  });

  const [editingCell, setEditingCell] = useState<{ rowId: string; colIndex: number } | null>(null);

  // Debounced sync to parent component
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate?.(block.id, {
        properties: {
          ...block.properties,
          tableData
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [tableData, block.id, onUpdate]);

  const handleCellUpdate = useCallback((rowId: string, colIndex: number, content: string) => {
    setTableData(prev => updateCell(prev, rowId, colIndex, { content }));
  }, []);

  const handleAddRow = useCallback(() => {
    setTableData(prev => addRowToTable(prev));
  }, []);

  const handleDeleteRow = useCallback((rowId: string) => {
    if (!canDeleteRow(tableData)) {
      alert('不能删除最后一行');
      return;
    }
    try {
      setTableData(prev => deleteRow(prev, rowId));
    } catch (e) {
      alert('删除失败: ' + (e as Error).message);
    }
  }, [tableData]);

  const handleAddColumn = useCallback(() => {
    setTableData(prev => addColumnToTable(prev));
  }, []);

  const handleDeleteColumn = useCallback((colId: string) => {
    if (!canDeleteColumn(tableData)) {
      alert('不能删除最后一列');
      return;
    }
    try {
      setTableData(prev => deleteColumn(prev, colId));
    } catch (e) {
      alert('删除失败: ' + (e as Error).message);
    }
  }, [tableData]);

  const handleNavigate = useCallback((fromRow: number, fromCol: number, direction: 'up' | 'down' | 'left' | 'right') => {
    let newRow = fromRow;
    let newCol = fromCol;

    switch (direction) {
      case 'up':
        newRow = Math.max(0, fromRow - 1);
        break;
      case 'down':
        newRow = Math.min(tableData.rows.length - 1, fromRow + 1);
        break;
      case 'left':
        newCol = Math.max(0, fromCol - 1);
        break;
      case 'right':
        newCol = Math.min(tableData.columns.length - 1, fromCol + 1);
        break;
    }

    setEditingCell({ rowId: tableData.rows[newRow].id, colIndex: newCol });
  }, [tableData]);

  // Non-editable view
  if (!editable) {
    return (
      <>
        <style jsx>{`
          .table-scroll-container::-webkit-scrollbar {
            height: 8px;
          }
          .table-scroll-container::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 4px;
          }
          .table-scroll-container::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }
          .table-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `}</style>
        <div
          className="table-scroll-container"
          style={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            marginTop: '8px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin' as const,
            scrollbarColor: '#cbd5e0 #f7fafc',
            boxSizing: 'border-box'
          }}
        >
          <table style={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: 'fit-content',
            border: '1px solid #e0e0e0',
            tableLayout: 'auto'
          }}>
            <tbody>
              {tableData.rows.map((row, rowIdx) => (
                <tr key={row.id}>
                  {row.cells.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        border: '1px solid #e0e0e0',
                        padding: '8px',
                        backgroundColor: rowIdx === 0 && tableData.enableHeaderRow ? '#F7F6F3' : 'white',
                        fontWeight: rowIdx === 0 && tableData.enableHeaderRow ? 600 : 400,
                        textAlign: cell.align || 'left'
                      }}
                    >
                      {cell.content}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // Editable view
  return (
    <>
      <style jsx>{`
        .table-scroll-container::-webkit-scrollbar {
          height: 8px;
        }
        .table-scroll-container::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 4px;
        }
        .table-scroll-container::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        .table-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
        .control-button {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: none;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          flex-shrink: 0;
          padding: 0;
        }
        .control-button:hover {
          transform: scale(1.2);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
        }
        .control-button:active {
          transform: scale(0.85);
        }
        .control-button.add {
          /* 加号用蓝色 */
        }
        .control-button.delete {
          /* 减号用红色 */
        }
      `}</style>
      <div style={{
        position: 'relative',
        marginTop: '8px',
        width: '100%',
        maxWidth: '100%',
        paddingBottom: '14px',
        boxSizing: 'border-box'
      }}>
        <div
          className="table-scroll-container"
          style={scrollContainerStyle}
        >
          <div style={{ position: 'relative', display: 'inline-block', minWidth: '100%' }}>
            <table style={{
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: 'fit-content',
              border: '1px solid #e0e0e0',
              tableLayout: 'auto'
            }}>
              <tbody>
                {tableData.rows.map((row, rowIdx) => (
                  <tr key={row.id}>
                    {row.cells.map((cell, colIdx) => (
                      <TableCell
                        key={`${row.id}-${colIdx}`}
                        cell={cell}
                        isHeader={rowIdx === 0 && tableData.enableHeaderRow}
                        isEditing={editingCell?.rowId === row.id && editingCell?.colIndex === colIdx}
                        onStartEdit={() => setEditingCell({ rowId: row.id, colIndex: colIdx })}
                        onEndEdit={() => setEditingCell(null)}
                        onUpdate={(content) => handleCellUpdate(row.id, colIdx, content)}
                        onNavigate={(direction) => handleNavigate(rowIdx, colIdx, direction)}
                        editable={editable}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 右侧列控制按钮 */}
            <div style={{
              position: 'absolute',
              right: '-7px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              zIndex: 10
            }}>
              <button
                className="control-button add"
                onClick={handleAddColumn}
                title="添加列"
              >
                <Plus size={9} color="#2383E2" strokeWidth={2.5} />
              </button>
              {canDeleteColumn(tableData) && (
                <button
                  className="control-button delete"
                  onClick={() => {
                    const lastCol = tableData.columns[tableData.columns.length - 1];
                    handleDeleteColumn(lastCol.id);
                  }}
                  title="删除列"
                >
                  <Minus size={9} color="#d32f2f" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* 底部行控制按钮 */}
            <div style={{
              position: 'absolute',
              bottom: '-7px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '5px',
              zIndex: 10
            }}>
              <button
                className="control-button add"
                onClick={handleAddRow}
                title="添加行"
              >
                <Plus size={9} color="#2383E2" strokeWidth={2.5} />
              </button>
              {canDeleteRow(tableData) && (
                <button
                  className="control-button delete"
                  onClick={() => {
                    const lastRow = tableData.rows[tableData.rows.length - 1];
                    handleDeleteRow(lastRow.id);
                  }}
                  title="删除行"
                >
                  <Minus size={9} color="#d32f2f" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
