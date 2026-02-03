# 表格组件快速参考

## 🚀 快速开始

### 基础使用

```tsx
import { SimpleTableBlock } from '@/components/blocks/SimpleTableBlock';

<SimpleTableBlock
  node={tableData}
  editable={true}
  onUpdateNode={handleUpdate}
/>
```

---

## ⌨️ 快捷键速查

### 导航
| 快捷键 | 功能 |
|--------|------|
| `Tab` | 下一个单元格 |
| `Shift+Tab` | 上一个单元格 |
| `Enter` | 下一行 |
| `Shift+Enter` | 上一行 |
| `↑↓←→` | 方向导航 |
| `Escape` | 退出编辑 |

### 编辑
| 快捷键 | 功能 |
|--------|------|
| `Cmd+C / Ctrl+C` | 复制 |
| `Cmd+X / Ctrl+X` | 剪切 |
| `Cmd+V / Ctrl+V` | 粘贴 |
| `Cmd+Z / Ctrl+Z` | 撤销 |
| `Cmd+Shift+Z / Ctrl+Y` | 重做 |
| `Cmd+D / Ctrl+D` | 复制行/列 |
| `Cmd+Backspace / Ctrl+Backspace` | 删除行/列 |

### 搜索
| 快捷键 | 功能 |
|--------|------|
| `Cmd+F / Ctrl+F` | 打开搜索 |
| `Cmd+G / Ctrl+G` | 查找下一个 |
| `Cmd+Shift+G` | 查找上一个 |
| `F3` | 查找下一个 |
| `Shift+F3` | 查找上一个 |

### 选择
| 快捷键 | 功能 |
|--------|------|
| `Cmd+A / Ctrl+A` | 全选 |
| `Shift+点击` | 扩展选择 |
| `拖拽` | 范围选择 |

---

## 🎯 常用操作

### 表格操作

```typescript
import { TableOperations } from '@/components/blocks/SimpleTable';

// 添加行
const newTable = TableOperations.addRow(table, position);

// 添加列
const newTable = TableOperations.addColumn(table, position);

// 删除行
const newTable = TableOperations.deleteRow(table, rowIndex);

// 删除列
const newTable = TableOperations.deleteColumn(table, colIndex);

// 重排序行
const newTable = TableOperations.reorderRows(table, fromIndex, toIndex);

// 重排序列
const newTable = TableOperations.reorderColumns(table, fromIndex, toIndex);

// 更新单元格
const newTable = TableOperations.updateCellContent(
  table,
  { row: 0, col: 0 },
  'new content'
);
```

### 单元格选择

```typescript
import { useCellSelection } from '@/components/blocks/SimpleTable';

const {
  selection,
  startSelection,
  updateSelection,
  endSelection,
  clearSelection,
  selectAll,
  selectRow,
  selectColumn,
  isCellSelected,
} = useCellSelection(true, rowCount, columnCount);

// 开始选择
startSelection({ row: 0, col: 0 });

// 更新选择
updateSelection({ row: 1, col: 1 });

// 结束选择
endSelection();

// 检查是否选中
if (isCellSelected(0, 0)) {
  // 单元格被选中
}
```

### 复制粘贴

```typescript
import {
  copyCellsToClipboard,
  pasteCellsFromClipboard,
  cutCells,
} from '@/components/blocks/SimpleTable';

// 复制
const success = await copyCellsToClipboard(table, selection);

// 粘贴
const newTable = await pasteCellsFromClipboard(table, startCell);

// 剪切
const newTable = cutCells(table, selection);
```

### 撤销重做

```typescript
import { useUndoRedo } from '@/components/blocks/SimpleTable';

const {
  currentState,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
  reset,
} = useUndoRedo(initialTable);

// 保存状态
pushState(newTable);

// 撤销
const previousState = undo();

// 重做
const nextState = redo();
```

### 搜索替换

```typescript
import {
  searchInTable,
  replaceInTable,
  useTableSearch,
} from '@/components/blocks/SimpleTable';

// 搜索
const results = searchInTable(table, 'keyword', false);

// 替换
const { table: newTable, count } = replaceInTable(
  table,
  'old',
  'new',
  false,
  true
);

// 使用 Hook
const {
  searchState,
  search,
  nextResult,
  previousResult,
  clearSearch,
  getCurrentResult,
} = useTableSearch(table);

search('keyword');
nextResult();
```

---

## 🎨 样式定制

### 常量配置

```typescript
import { SimpleTableConstants, SimpleTableColors } from '@/components/blocks/SimpleTable';

// 尺寸常量
SimpleTableConstants.defaultColumnWidth;  // 160
SimpleTableConstants.minimumColumnWidth;  // 36
SimpleTableConstants.defaultRowHeight;    // 36

// 颜色常量
SimpleTableColors.border;                 // #E0E0E0
SimpleTableColors.primaryColor;           // #0066FF
SimpleTableColors.headerBackground;       // #F5F5F5
```

### 自定义样式

```typescript
// 修改默认列宽
const customTable = {
  ...table,
  columnWidths: {
    0: 200,  // 第一列 200px
    1: 150,  // 第二列 150px
  },
};

// 设置列对齐
const customTable = {
  ...table,
  columnAligns: {
    0: 'left',
    1: 'center',
    2: 'right',
  },
};

// 设置背景色
const customTable = {
  ...table,
  columnColors: {
    0: '#F0F0F0',
  },
  rowColors: {
    0: '#E8F4FD',
  },
};
```

---

## 🔧 高级用法

### 自定义右键菜单

```typescript
import { buildColumnMenu, buildRowMenu } from '@/components/blocks/SimpleTable';

const columnMenu = buildColumnMenu(
  colIndex,
  {
    insertLeft: () => {},
    insertRight: () => {},
    duplicate: () => {},
    clear: () => {},
    delete: () => {},
    setAlign: (align) => {},
    setColor: (color) => {},
  },
  currentAlign,
  canDelete
);
```

### 导入导出

```typescript
import {
  parseMarkdownTable,
  exportToMarkdown,
  exportToHTML,
} from '@/components/blocks/SimpleTable';

// 从 Markdown 导入
const table = parseMarkdownTable(markdownString, 'table-id');

// 导出为 Markdown
const markdown = exportToMarkdown(table);

// 导出为 HTML
const html = exportToHTML(table);
```

### 批量操作

```typescript
// 批量更新多个单元格
let newTable = table;
for (const cell of cellsToUpdate) {
  newTable = TableOperations.updateCellContent(
    newTable,
    cell.position,
    cell.content
  );
}
updateTableNode(newTable);
```

---

## 📊 数据格式

### 表格数据结构

```typescript
interface SimpleTableBlockData {
  id: string;
  type: 'simple_table';
  rows: TableRowData[];
  enableHeaderRow?: boolean;
  enableHeaderColumn?: boolean;
  columnWidths?: Record<number, number>;
  columnAligns?: Record<number, 'left' | 'center' | 'right'>;
  rowAligns?: Record<number, 'top' | 'center' | 'bottom'>;
  columnColors?: Record<number, string>;
  rowColors?: Record<number, string>;
}

interface TableRowData {
  cells: TableCellData[];
}

interface TableCellData {
  content: string;
}
```

### 创建空表格

```typescript
import { createEmptyTable } from '@/components/blocks/SimpleTable';

const table = createEmptyTable(3, 3, 'table-id');
// 创建 3x3 的空表格
```

---

## 🐛 常见问题

### Q: 如何禁用编辑？
```tsx
<SimpleTableBlock
  node={tableData}
  editable={false}  // 设置为 false
  onUpdateNode={handleUpdate}
/>
```

### Q: 如何监听表格变化？
```tsx
const handleUpdate = (updates: Partial<SimpleTableBlockData>) => {
  console.log('Table updated:', updates);
  // 保存到数据库等
};
```

### Q: 如何设置初始表头？
```typescript
const table = {
  ...tableData,
  enableHeaderRow: true,
  enableHeaderColumn: true,
};
```

### Q: 如何限制表格大小？
```typescript
// 在操作前检查
if (table.rows.length >= maxRows) {
  alert('已达到最大行数');
  return;
}
```

---

## 📚 更多文档

- **完整文档**：`TABLE_REWRITE_COMPLETE.md`
- **拖拽功能**：`TABLE_DRAG_DROP_IMPLEMENTATION.md`
- **高级功能**：`TABLE_ADVANCED_FEATURES.md`
- **实现总结**：`TABLE_IMPLEMENTATION_SUMMARY.md`

---

## 💡 最佳实践

1. **性能优化**：
   - 使用 `useCallback` 包装所有处理函数
   - 避免在渲染中创建新对象
   - 使用条件渲染减少 DOM 节点

2. **状态管理**：
   - 使用撤销/重做系统管理历史
   - 批量操作时一次性更新状态
   - 避免频繁的小更新

3. **用户体验**：
   - 提供即时的视觉反馈
   - 使用快捷键提高效率
   - 错误提示要友好明确

4. **数据安全**：
   - 定期保存表格数据
   - 使用撤销系统防止误操作
   - 重要操作前确认

---

**版本**：v2.0.0
**最后更新**：2024-02
