'use client';

import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { Plus, MoreVertical, GripVertical, Trash2, Copy } from 'lucide-react';

/**
 * 简单表格块 - 完全参考 AppFlowy 实现
 *
 * 参考文件：
 * - simple_table_block_component.dart
 * - simple_table_cell_block_component.dart
 * - simple_table_row_block_component.dart
 * - simple_table_constants.dart
 * - simple_table_operations/
 */

// ==================== AppFlowy 常量定义 ====================

const SimpleTableConstants = {
  // 尺寸
  defaultColumnWidth: 160.0,
  minimumColumnWidth: 36.0,
  maximumColumnWidth: 600.0, // 🆕 最大列宽限制
  defaultRowHeight: 36.0,

  // 单元格边距（Desktop）
  cellPaddingHorizontal: 9.0,
  cellPaddingVertical: 2.0,

  // 添加行按钮
  addRowButtonHeight: 16.0,
  addRowButtonPadding: 4.0,

  // 添加列按钮
  addColumnButtonWidth: 16.0,
  addColumnButtonPadding: 2.0,

  // 调整大小句柄
  resizeHandleWidth: 3.0,

  // 边框
  borderWidth: 1.0,
  lightBorderWidth: 0.5,

  // 表格内边距
  tablePaddingLeft: 8.0,

  // 🆕 编辑器最大宽度（与编辑页一致）
  editorMaxWidth: 800.0,
  editorPadding: 96.0 // 左右各 48px
};

// AppFlowy 颜色系统（Light Mode）
const SimpleTableColors = {
  border: '#E4E5E5',
  lightBorder: 'rgba(31, 35, 41, 0.08)',
  divider: 'rgba(31, 35, 41, 0.08)',

  headerBackground: '#F2F2F2',
  hoverBackground: 'rgba(59, 130, 246, 0.05)',

  primaryColor: '#00BCF0',
  primaryHover: '#00A0D1',

  actionButtonBackground: '#FFFFFF',
  actionButtonBorder: '#E0E0E0',
  actionButtonHover: '#F5F5F5',

  moreActionBackground: '#F2F3F5',
  moreActionBorder: '#CFD3D9',
  moreActionHover: '#00C8FF',

  editingBorder: '#00BCF0',
  selectedBackground: 'rgba(0, 188, 240, 0.1)'
};

// ==================== 类型定义 ====================

export interface TableCellData {
  content: string;
}

export interface TableRowData {
  cells: TableCellData[];
}

export interface SimpleTableBlockData {
  id: string;
  type: 'simple_table';
  rows: TableRowData[];

  // 表格属性
  enableHeaderRow?: boolean;
  enableHeaderColumn?: boolean;

  // 列宽映射 { columnIndex: width }
  columnWidths?: Record<number, number>;

  // 列对齐 { columnIndex: 'left'|'center'|'right' }
  columnAligns?: Record<number, 'left' | 'center' | 'right'>;

  // 行对齐 { rowIndex: 'top'|'center'|'bottom' }
  rowAligns?: Record<number, 'top' | 'center' | 'bottom'>;

  // 列颜色 { columnIndex: color }
  columnColors?: Record<number, string>;

  // 行颜色 { rowIndex: color }
  rowColors?: Record<number, string>;
}

// ==================== 上下文定义 ====================

interface SimpleTableContextValue {
  // 表格数据
  tableNode: SimpleTableBlockData;

  // 悬停状态
  isHoveringOnTableArea: boolean;
  setIsHoveringOnTableArea: (hover: boolean) => void;

  isHoveringOnTableBlock: boolean;
  setIsHoveringOnTableBlock: (hover: boolean) => void;

  hoveringTableCell: { row: number; col: number } | null;
  setHoveringTableCell: (cell: { row: number; col: number } | null) => void;

  // 选择状态
  selectingColumn: number | null;
  setSelectingColumn: (col: number | null) => void;

  selectingRow: number | null;
  setSelectingRow: (row: number | null) => void;

  isSelectingTable: boolean;
  setIsSelectingTable: (selecting: boolean) => void;

  // 编辑状态
  editingCell: { row: number; col: number } | null;
  setEditingCell: (cell: { row: number; col: number } | null) => void;

  // 调整大小
  resizingColumn: number | null;
  setResizingColumn: (col: number | null) => void;

  hoveringOnResizeHandle: number | null;
  setHoveringOnResizeHandle: (col: number | null) => void;

  // 可编辑性
  editable: boolean;
}

const SimpleTableContext = createContext<SimpleTableContextValue | null>(null);

// ==================== 主组件：SimpleTableBlock ====================

interface SimpleTableBlockProps {
  node: SimpleTableBlockData;
  editable?: boolean;
  onUpdateNode?: (updates: Partial<SimpleTableBlockData>) => void;
}

export function SimpleTableBlock({
  node,
  editable = true,
  onUpdateNode
}: SimpleTableBlockProps) {
  // 状态管理
  const [tableNode, setTableNode] = useState(node);
  const [isHoveringOnTableArea, setIsHoveringOnTableArea] = useState(false);
  const [isHoveringOnTableBlock, setIsHoveringOnTableBlock] = useState(false);
  const [hoveringTableCell, setHoveringTableCell] = useState<{ row: number; col: number } | null>(null);
  const [selectingColumn, setSelectingColumn] = useState<number | null>(null);
  const [selectingRow, setSelectingRow] = useState<number | null>(null);
  const [isSelectingTable, setIsSelectingTable] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const [hoveringOnResizeHandle, setHoveringOnResizeHandle] = useState<number | null>(null);

  // 同步到父组件
  useEffect(() => {
    onUpdateNode?.(tableNode);
  }, [tableNode]);

  // 获取行数和列数
  const rowLength = tableNode.rows.length;
  const columnLength = tableNode.rows[0]?.cells.length || 0;

  // 上下文值
  const contextValue: SimpleTableContextValue = {
    tableNode,
    isHoveringOnTableArea,
    setIsHoveringOnTableArea,
    isHoveringOnTableBlock,
    setIsHoveringOnTableBlock,
    hoveringTableCell,
    setHoveringTableCell,
    selectingColumn,
    setSelectingColumn,
    selectingRow,
    setSelectingRow,
    isSelectingTable,
    setIsSelectingTable,
    editingCell,
    setEditingCell,
    resizingColumn,
    setResizingColumn,
    hoveringOnResizeHandle,
    setHoveringOnResizeHandle,
    editable
  };

  // ==================== 表格操作方法 ====================

  // 添加行
  const addRow = () => {
    const newRow: TableRowData = {
      cells: Array(columnLength).fill(null).map(() => ({ content: '' }))
    };
    setTableNode({
      ...tableNode,
      rows: [...tableNode.rows, newRow]
    });
  };

  // 添加列
  const addColumn = () => {
    const newRows = tableNode.rows.map(row => ({
      cells: [...row.cells, { content: '' }]
    }));
    setTableNode({
      ...tableNode,
      rows: newRows
    });
  };

  // 同时添加行和列
  const addColumnAndRow = () => {
    const newRows = tableNode.rows.map(row => ({
      cells: [...row.cells, { content: '' }]
    }));
    const newRow: TableRowData = {
      cells: Array(columnLength + 1).fill(null).map(() => ({ content: '' }))
    };
    setTableNode({
      ...tableNode,
      rows: [...newRows, newRow]
    });
  };

  // 删除行
  const deleteRow = (rowIndex: number) => {
    if (rowLength <= 1) return;
    const newRows = tableNode.rows.filter((_, i) => i !== rowIndex);
    setTableNode({ ...tableNode, rows: newRows });
  };

  // 删除列
  const deleteColumn = (colIndex: number) => {
    if (columnLength <= 1) return;
    const newRows = tableNode.rows.map(row => ({
      cells: row.cells.filter((_, i) => i !== colIndex)
    }));
    setTableNode({ ...tableNode, rows: newRows });
  };

  // 更新单元格内容
  const updateCellContent = (rowIndex: number, colIndex: number, content: string) => {
    const newRows = [...tableNode.rows];
    newRows[rowIndex].cells[colIndex].content = content;
    setTableNode({ ...tableNode, rows: newRows });
  };

  // 更新列宽（优化版本，带智能限制）
  const updateColumnWidth = (colIndex: number, width: number) => {
    // 计算当前所有列的总宽度
    const currentTotalWidth = Array.from({ length: columnLength }, (_, i) => {
      if (i === colIndex) return 0; // 排除当前列
      return tableNode.columnWidths?.[i] || SimpleTableConstants.defaultColumnWidth;
    }).reduce((sum, w) => sum + w, 0);

    // 计算可用的最大宽度
    const maxAvailableWidth = SimpleTableConstants.editorMaxWidth -
                               SimpleTableConstants.editorPadding -
                               SimpleTableConstants.tablePaddingLeft -
                               SimpleTableConstants.addColumnButtonWidth -
                               SimpleTableConstants.addColumnButtonPadding * 4;

    // 计算该列的最大允许宽度
    const maxWidthForThisColumn = Math.min(
      SimpleTableConstants.maximumColumnWidth,
      maxAvailableWidth - currentTotalWidth - 20 // 留 20px 余量
    );

    // 限制宽度范围
    const clampedWidth = Math.max(
      SimpleTableConstants.minimumColumnWidth,
      Math.min(width, maxWidthForThisColumn)
    );

    setTableNode({
      ...tableNode,
      columnWidths: {
        ...tableNode.columnWidths,
        [colIndex]: clampedWidth
      }
    });
  };

  // 切换表头行
  const toggleHeaderRow = () => {
    setTableNode({
      ...tableNode,
      enableHeaderRow: !tableNode.enableHeaderRow
    });
  };

  // 切换表头列
  const toggleHeaderColumn = () => {
    setTableNode({
      ...tableNode,
      enableHeaderColumn: !tableNode.enableHeaderColumn
    });
  };

  return (
    <SimpleTableContext.Provider value={contextValue}>
      {/* 外层容器：实现 Notion 风格的表格滚动 */}
      <div
        style={{
          width: '100%', // 与正文块等宽
          marginTop: '8px',
          marginBottom: '8px',
          overflowX: 'auto', // 横向滚动
          overflowY: 'visible',
          // Notion-style scrollbar
          scrollbarWidth: 'thin', // Firefox
          scrollbarColor: 'rgba(55, 53, 47, 0.3) transparent' // Firefox
        }}
        className="notion-table-wrapper"
      >
        <div
          onMouseEnter={() => setIsHoveringOnTableBlock(true)}
          onMouseLeave={() => setIsHoveringOnTableBlock(false)}
          style={{
            position: 'relative',
            width: 'fit-content',
            minWidth: '100%', // 至少占满容器宽度
            paddingLeft: `${SimpleTableConstants.tablePaddingLeft}px`,
            paddingRight: `${SimpleTableConstants.addColumnButtonWidth + SimpleTableConstants.addColumnButtonPadding * 4}px`,
            paddingBottom: `${SimpleTableConstants.addRowButtonHeight + SimpleTableConstants.addRowButtonPadding * 5}px`
          }}
        >
        {/* 表格主体 */}
        <div
          onMouseEnter={() => setIsHoveringOnTableArea(true)}
          onMouseLeave={() => setIsHoveringOnTableArea(false)}
          style={{ position: 'relative' }}
        >
          <table
            style={{
              borderCollapse: 'collapse',
              border: `${SimpleTableConstants.borderWidth}px solid ${SimpleTableColors.border}`,
              backgroundColor: '#FFFFFF',
              width: 'auto', // 根据内容自动调整宽度
              tableLayout: 'auto' // 自动表格布局，根据内容调整列宽
            }}
          >
            <tbody>
              {tableNode.rows.map((row, rowIndex) => (
                <SimpleTableRow
                  key={rowIndex}
                  rowIndex={rowIndex}
                  row={row}
                  onUpdateCell={updateCellContent}
                  onDeleteRow={deleteRow}
                  onUpdateColumnWidth={updateColumnWidth}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* 添加行按钮（底部） */}
        {editable && isHoveringOnTableBlock && (
          <div
            onClick={addRow}
            style={{
              position: 'absolute',
              bottom: `${SimpleTableConstants.addRowButtonPadding * 3}px`,
              left: `${SimpleTableConstants.tablePaddingLeft}px`,
              right: `${SimpleTableConstants.addColumnButtonWidth + SimpleTableConstants.addColumnButtonPadding * 4}px`,
              height: `${SimpleTableConstants.addRowButtonHeight}px`,
              backgroundColor: SimpleTableColors.moreActionBackground,
              border: `1px solid ${SimpleTableColors.moreActionBorder}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = SimpleTableColors.moreActionHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = SimpleTableColors.moreActionBackground;
            }}
          >
            <Plus size={16} style={{ color: '#666' }} />
          </div>
        )}

        {/* 添加列按钮（右侧） */}
        {editable && isHoveringOnTableBlock && (
          <div
            onClick={addColumn}
            style={{
              position: 'absolute',
              top: 0,
              right: `${SimpleTableConstants.addColumnButtonPadding * 2}px`,
              bottom: `${SimpleTableConstants.addRowButtonHeight + SimpleTableConstants.addRowButtonPadding * 5}px`,
              width: `${SimpleTableConstants.addColumnButtonWidth}px`,
              backgroundColor: SimpleTableColors.moreActionBackground,
              border: `1px solid ${SimpleTableColors.moreActionBorder}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = SimpleTableColors.moreActionHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = SimpleTableColors.moreActionBackground;
            }}
          >
            <Plus size={16} style={{ color: '#666' }} />
          </div>
        )}

        {/* 添加行列按钮（右下角圆形） */}
        {editable && isHoveringOnTableBlock && (
          <div
            onClick={addColumnAndRow}
            style={{
              position: 'absolute',
              bottom: `${SimpleTableConstants.addRowButtonPadding * 2.5}px`,
              right: `${SimpleTableConstants.addColumnButtonPadding * 2.5}px`,
              width: `${SimpleTableConstants.addRowButtonHeight}px`,
              height: `${SimpleTableConstants.addRowButtonHeight}px`,
              backgroundColor: SimpleTableColors.moreActionBackground,
              border: `1px solid ${SimpleTableColors.moreActionBorder}`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = SimpleTableColors.moreActionHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = SimpleTableColors.moreActionBackground;
            }}
          >
            <Plus size={12} style={{ color: '#666' }} />
          </div>
        )}

        {/* 表格工具栏（顶部） */}
        {editable && (
          <div
            style={{
              position: 'absolute',
              top: '-32px',
              left: `${SimpleTableConstants.tablePaddingLeft}px`,
              display: 'flex',
              gap: '8px',
              opacity: isHoveringOnTableBlock ? 1 : 0,
              transition: 'opacity 0.15s'
            }}
          >
            <button
              onClick={toggleHeaderRow}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                backgroundColor: tableNode.enableHeaderRow ? SimpleTableColors.primaryColor : SimpleTableColors.actionButtonBackground,
                color: tableNode.enableHeaderRow ? '#fff' : '#666',
                border: `1px solid ${SimpleTableColors.actionButtonBorder}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              表头行
            </button>
            <button
              onClick={toggleHeaderColumn}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                backgroundColor: tableNode.enableHeaderColumn ? SimpleTableColors.primaryColor : SimpleTableColors.actionButtonBackground,
                color: tableNode.enableHeaderColumn ? '#fff' : '#666',
                border: `1px solid ${SimpleTableColors.actionButtonBorder}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              表头列
            </button>
          </div>
        )}
      </div>
      </div>
    </SimpleTableContext.Provider>
  );
}

// ==================== 行组件：SimpleTableRow ====================

interface SimpleTableRowProps {
  rowIndex: number;
  row: TableRowData;
  onUpdateCell: (rowIndex: number, colIndex: number, content: string) => void;
  onDeleteRow: (rowIndex: number) => void;
  onUpdateColumnWidth: (colIndex: number, width: number) => void;
}

function SimpleTableRow({
  rowIndex,
  row,
  onUpdateCell,
  onDeleteRow,
  onUpdateColumnWidth
}: SimpleTableRowProps) {
  const context = useContext(SimpleTableContext);
  if (!context) return null;

  const { tableNode, selectingRow } = context;
  const isHeaderRow = tableNode.enableHeaderRow && rowIndex === 0;
  const isSelected = selectingRow === rowIndex;

  return (
    <tr
      style={{
        backgroundColor: isSelected ? SimpleTableColors.selectedBackground : 'transparent'
      }}
    >
      {row.cells.map((cell, colIndex) => (
        <SimpleTableCell
          key={colIndex}
          rowIndex={rowIndex}
          colIndex={colIndex}
          cell={cell}
          isHeaderRow={isHeaderRow}
          isHeaderColumn={tableNode.enableHeaderColumn && colIndex === 0}
          onUpdate={(content) => onUpdateCell(rowIndex, colIndex, content)}
          onUpdateColumnWidth={onUpdateColumnWidth}
        />
      ))}
    </tr>
  );
}

// ==================== 单元格组件：SimpleTableCell ====================

interface SimpleTableCellProps {
  rowIndex: number;
  colIndex: number;
  cell: TableCellData;
  isHeaderRow: boolean;
  isHeaderColumn: boolean;
  onUpdate: (content: string) => void;
  onUpdateColumnWidth: (colIndex: number, width: number) => void;
}

function SimpleTableCell({
  rowIndex,
  colIndex,
  cell,
  isHeaderRow,
  isHeaderColumn,
  onUpdate,
  onUpdateColumnWidth
}: SimpleTableCellProps) {
  const context = useContext(SimpleTableContext);
  if (!context) return null;

  const {
    tableNode,
    hoveringTableCell,
    setHoveringTableCell,
    editingCell,
    setEditingCell,
    hoveringOnResizeHandle,
    setHoveringOnResizeHandle,
    resizingColumn,
    setResizingColumn,
    editable
  } = context;

  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const [tempWidth, setTempWidth] = useState<number | null>(null); // 🆕 临时宽度用于拖拽预览
  const rafIdRef = useRef<number | null>(null); // 🆕 RAF ID

  const isHeader = isHeaderRow || isHeaderColumn;
  const isHovered = hoveringTableCell?.row === rowIndex && hoveringTableCell?.col === colIndex;
  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
  const isResizeHandleHovered = hoveringOnResizeHandle === colIndex;
  const isResizing = resizingColumn === colIndex;

  // 获取列宽（拖拽时使用临时宽度）
  const storedWidth = tableNode.columnWidths?.[colIndex] || SimpleTableConstants.defaultColumnWidth;
  const columnWidth = isResizing && tempWidth !== null ? tempWidth : storedWidth;

  // 获取列对齐
  const columnAlign = tableNode.columnAligns?.[colIndex] || 'left';

  // 拖拽调整列宽（优化版本）
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStartX(e.clientX);
    setDragStartWidth(storedWidth);
    setResizingColumn(colIndex);
    setTempWidth(storedWidth); // 初始化临时宽度
  };

  useEffect(() => {
    if (!isResizing) {
      // 拖拽结束，清理临时状态
      setTempWidth(null);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // 取消之前的 RAF
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // 使用 RAF 优化性能
      rafIdRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - dragStartX;
        const newWidth = dragStartWidth + deltaX;

        // 只更新临时宽度，不触发状态更新
        setTempWidth(newWidth);
      });
    };

    const handleMouseUp = () => {
      // 拖拽结束，应用最终宽度
      if (tempWidth !== null) {
        onUpdateColumnWidth(colIndex, tempWidth);
      }
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isResizing, dragStartX, dragStartWidth, tempWidth, colIndex, onUpdateColumnWidth]);

  // 计算边框样式
  const getBorderStyle = () => {
    if (isEditing) {
      // 编辑状态：全边框高亮
      return {
        borderLeft: `2px solid ${SimpleTableColors.editingBorder}`,
        borderRight: `2px solid ${SimpleTableColors.editingBorder}`,
        borderTop: `2px solid ${SimpleTableColors.editingBorder}`,
        borderBottom: `2px solid ${SimpleTableColors.editingBorder}`
      };
    }

    // 默认边框
    return {
      border: `${SimpleTableConstants.lightBorderWidth}px solid ${SimpleTableColors.lightBorder}`
    };
  };

  return (
    <td
      onMouseEnter={() => setHoveringTableCell({ row: rowIndex, col: colIndex })}
      onMouseLeave={() => setHoveringTableCell(null)}
      onClick={() => editable && !isEditing && setEditingCell({ row: rowIndex, col: colIndex })}
      style={{
        ...getBorderStyle(),
        padding: `${SimpleTableConstants.cellPaddingVertical}px ${SimpleTableConstants.cellPaddingHorizontal}px`,
        width: `${columnWidth}px`,
        minWidth: `${columnWidth}px`,
        maxWidth: `${columnWidth}px`,
        height: `${SimpleTableConstants.defaultRowHeight}px`,
        verticalAlign: 'middle',
        backgroundColor: isHeader ? SimpleTableColors.headerBackground : 'transparent',
        fontWeight: isHeader ? 600 : 400,
        fontSize: '14px',
        lineHeight: '1.5',
        position: 'relative',
        cursor: editable ? 'text' : 'default',
        textAlign: columnAlign,
        transition: 'border 0.15s, background-color 0.15s'
      }}
    >
      {/* 单元格内容 */}
      {isEditing ? (
        <textarea
          autoFocus
          value={cell.content}
          onChange={(e) => onUpdate(e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          style={{
            width: '100%',
            minHeight: '24px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: 'inherit',
            backgroundColor: 'transparent',
            textAlign: columnAlign,
            padding: 0
          }}
        />
      ) : (
        <div
          style={{
            minHeight: '20px',
            fontSize: '14px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {cell.content || ''}
        </div>
      )}

      {/* 调整列宽句柄 */}
      {editable && (isHovered || isResizeHandleHovered || isResizing) && (
        <div
          onMouseDown={handleResizeStart}
          onMouseEnter={() => setHoveringOnResizeHandle(colIndex)}
          onMouseLeave={() => setHoveringOnResizeHandle(null)}
          style={{
            position: 'absolute',
            right: `-${SimpleTableConstants.resizeHandleWidth / 2}px`,
            top: 0,
            bottom: 0,
            width: `${SimpleTableConstants.resizeHandleWidth}px`,
            cursor: 'col-resize',
            backgroundColor: (isResizeHandleHovered || isResizing) ? SimpleTableColors.primaryColor : 'transparent',
            zIndex: 10,
            transition: 'background-color 0.1s'
          }}
        />
      )}
    </td>
  );
}

// ==================== 工具函数 ====================

/**
 * 从 Markdown 表格创建 SimpleTableBlockData
 */
export function parseMarkdownTable(markdown: string, id: string = `table-${Date.now()}`): SimpleTableBlockData {
  const lines = markdown.trim().split('\n');
  const rows: TableRowData[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

    const cellContents = trimmed.slice(1, -1).split('|').map(cell => cell.trim());

    // 跳过分隔行
    if (cellContents.every(cell => /^-+:?$/.test(cell))) continue;

    rows.push({
      cells: cellContents.map(content => ({ content }))
    });
  }

  return {
    id,
    type: 'simple_table',
    rows: rows.length > 0 ? rows : [
      { cells: [{ content: '' }, { content: '' }, { content: '' }] },
      { cells: [{ content: '' }, { content: '' }, { content: '' }] },
      { cells: [{ content: '' }, { content: '' }, { content: '' }] }
    ],
    enableHeaderRow: rows.length > 0
  };
}

/**
 * 从 HTML 表格创建 SimpleTableBlockData
 */
export function parseHTMLTable(html: string, id: string = `table-${Date.now()}`): SimpleTableBlockData {
  if (typeof window === 'undefined') {
    return {
      id,
      type: 'simple_table',
      rows: [
        { cells: [{ content: '' }, { content: '' }, { content: '' }] },
        { cells: [{ content: '' }, { content: '' }, { content: '' }] }
      ]
    };
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const table = tempDiv.querySelector('table');
  if (!table) {
    return {
      id,
      type: 'simple_table',
      rows: [
        { cells: [{ content: '' }, { content: '' }, { content: '' }] },
        { cells: [{ content: '' }, { content: '' }, { content: '' }] }
      ]
    };
  }

  const rows: TableRowData[] = [];
  const trs = table.querySelectorAll('tr');

  trs.forEach(tr => {
    const cells: TableCellData[] = [];
    const tds = tr.querySelectorAll('td, th');

    tds.forEach(td => {
      cells.push({ content: td.textContent?.trim() || '' });
    });

    if (cells.length > 0) {
      rows.push({ cells });
    }
  });

  return {
    id,
    type: 'simple_table',
    rows: rows.length > 0 ? rows : [
      { cells: [{ content: '' }, { content: '' }, { content: '' }] },
      { cells: [{ content: '' }, { content: '' }, { content: '' }] }
    ],
    enableHeaderRow: rows.length > 0
  };
}

/**
 * 创建空表格
 */
export function createEmptyTable(
  rowCount: number = 3,
  columnCount: number = 3,
  id: string = `table-${Date.now()}`
): SimpleTableBlockData {
  const rows: TableRowData[] = [];

  for (let i = 0; i < rowCount; i++) {
    const cells: TableCellData[] = [];
    for (let j = 0; j < columnCount; j++) {
      cells.push({ content: '' });
    }
    rows.push({ cells });
  }

  return {
    id,
    type: 'simple_table',
    rows,
    enableHeaderRow: true
  };
}
