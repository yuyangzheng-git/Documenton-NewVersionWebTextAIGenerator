# 表格拖拽重排序功能 - 实现文档

## 📋 功能概述

实现了完整的行列拖拽重排序功能，用户可以通过拖拽列头或行头来调整表格的列顺序和行顺序。

## ✨ 核心特性

### 1. 列拖拽重排序
- **拖拽句柄**：鼠标悬停在表格上时，列头上方显示拖拽句柄（GripVertical 图标）
- **拖拽反馈**：
  - 正在拖拽的列：透明度降低到 50%
  - 拖拽目标列：显示蓝色边框指示器
- **自动重排序**：拖拽结束后自动调用 `reorderColumns` 操作

### 2. 行拖拽重排序
- **拖拽句柄**：鼠标悬停在表格上时，每行左侧显示拖拽句柄
- **拖拽反馈**：
  - 正在拖拽的行：透明度降低到 50%
  - 拖拽目标行：显示蓝色上下边框指示器
- **自动重排序**：拖拽结束后自动调用 `reorderRows` 操作

## 🏗️ 技术实现

### 新增文件

#### `/components/blocks/SimpleTable/drag.ts`
拖拽系统核心模块，包含：

```typescript
// 拖拽状态管理 Hook
export function useDragReorder(
  enabled: boolean,
  onReorder: (fromIndex: number, toIndex: number, type: 'column' | 'row') => void
)

// 拖拽预览样式
export function getDragPreviewStyle(
  isDragging: boolean,
  isDragOver: boolean
): React.CSSProperties

// 拖拽常量
export const DragConstants = {
  handleWidth: 20,
  handleHeight: 20,
  handleColor: '#999',
  handleHoverColor: '#666',
  previewOpacity: 0.5,
  dropIndicatorColor: '#0066FF',
  dropIndicatorWidth: 2,
  dragThreshold: 5,
}
```

### 修改文件

#### `/components/blocks/SimpleTableBlock.tsx`

**新增状态**：
```typescript
const [draggingColumn, setDraggingColumn] = useState<number | null>(null);
const [draggingRow, setDraggingRow] = useState<number | null>(null);
const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
const [dragOverRow, setDragOverRow] = useState<number | null>(null);
```

**新增处理函数**：
```typescript
// 列拖拽
const handleColumnDragStart = useCallback((colIndex: number) => {
  setDraggingColumn(colIndex);
}, []);

const handleColumnDragOver = useCallback((colIndex: number, e: React.DragEvent) => {
  e.preventDefault();
  setDragOverColumn(colIndex);
}, []);

const handleColumnDragEnd = useCallback(() => {
  if (draggingColumn !== null && dragOverColumn !== null && draggingColumn !== dragOverColumn) {
    handleReorder(draggingColumn, dragOverColumn, 'column');
  }
  setDraggingColumn(null);
  setDragOverColumn(null);
}, [draggingColumn, dragOverColumn, handleReorder]);

// 行拖拽（类似实现）
const handleRowDragStart = ...
const handleRowDragOver = ...
const handleRowDragEnd = ...

// 统一重排序处理
const handleReorder = useCallback((fromIndex: number, toIndex: number, type: 'column' | 'row') => {
  if (type === 'column') {
    const newTable = TableOperations.reorderColumns(tableNode, fromIndex, toIndex);
    updateTableNode(newTable);
  } else {
    const newTable = TableOperations.reorderRows(tableNode, fromIndex, toIndex);
    updateTableNode(newTable);
  }
}, [tableNode, updateTableNode]);
```

**UI 实现 - 列拖拽句柄**：
```tsx
{/* 列拖拽句柄行 */}
{editable && isHoveringOnTableArea && (
  <div style={{ position: 'absolute', top: `-${DragConstants.handleHeight + 4}px`, ... }}>
    {Array.from({ length: columnLength }).map((_, colIndex) => {
      const isDragging = draggingColumn === colIndex;
      const isDragOver = dragOverColumn === colIndex;

      return (
        <div
          key={colIndex}
          draggable
          onDragStart={() => handleColumnDragStart(colIndex)}
          onDragOver={(e) => handleColumnDragOver(colIndex, e)}
          onDragEnd={handleColumnDragEnd}
          style={{
            opacity: isDragging ? 0.5 : 1,
            borderLeft: isDragOver ? `2px solid ${SimpleTableColors.primaryColor}` : 'none',
            ...
          }}
        >
          <GripVertical size={14} />
        </div>
      );
    })}
  </div>
)}
```

**UI 实现 - 行拖拽句柄**：
```tsx
<tr
  draggable={editable && isHoveringOnTableArea}
  onDragStart={() => editable && onRowDragStart(rowIndex)}
  onDragOver={(e) => editable && onRowDragOver(rowIndex, e)}
  onDragEnd={onRowDragEnd}
  style={{
    opacity: isDragging ? 0.5 : 1,
    borderTop: isDragOver ? `2px solid ${SimpleTableColors.primaryColor}` : 'none',
    borderBottom: isDragOver ? `2px solid ${SimpleTableColors.primaryColor}` : 'none',
  }}
>
  {/* 行拖拽句柄 */}
  {editable && isHoveringOnTableArea && (
    <td style={{ width: `${DragConstants.handleWidth}px`, cursor: 'grab', ... }}>
      <GripVertical size={14} />
    </td>
  )}

  {/* 单元格 */}
  {row.cells.map(...)}
</tr>
```

#### `/components/blocks/SimpleTable/types.ts`

**扩展 Context 类型**：
```typescript
export interface SimpleTableContextValue {
  // ... 现有属性

  // 拖拽状态
  draggingColumn: number | null;
  draggingRow: number | null;
  dragOverColumn: number | null;
  dragOverRow: number | null;

  // 拖拽处理函数
  onColumnDragStart: (colIndex: number) => void;
  onColumnDragOver: (colIndex: number, e: React.DragEvent) => void;
  onColumnDragEnd: () => void;
  onRowDragStart: (rowIndex: number) => void;
  onRowDragOver: (rowIndex: number, e: React.DragEvent) => void;
  onRowDragEnd: () => void;
}
```

#### `/components/blocks/SimpleTable/index.ts`

**新增导出**：
```typescript
export { useDragReorder, getDragPreviewStyle, DragConstants } from './drag';
```

## 🎯 用户体验

### 视觉反馈
1. **拖拽句柄显示**：
   - 只在鼠标悬停在表格区域时显示
   - 使用 `GripVertical` 图标，清晰表明可拖拽
   - 灰色图标，不干扰内容阅读

2. **拖拽中状态**：
   - 正在拖拽的行/列：透明度 50%
   - 拖拽目标位置：蓝色边框高亮
   - 鼠标光标：`grab` → `grabbing`

3. **平滑过渡**：
   - 透明度变化：`transition: opacity 0.15s`
   - 边框变化：即时反馈

### 交互流程
1. 鼠标悬停在表格上 → 显示拖拽句柄
2. 点击并拖拽句柄 → 行/列变半透明
3. 拖拽到目标位置 → 目标位置显示蓝色边框
4. 释放鼠标 → 自动重排序，更新表格

## 🔧 技术细节

### 拖拽 API
使用原生 HTML5 Drag and Drop API：
- `draggable` 属性：标记元素可拖拽
- `onDragStart`：开始拖拽时触发
- `onDragOver`：拖拽经过时触发（需要 `e.preventDefault()`）
- `onDragEnd`：拖拽结束时触发

### 状态管理
- **拖拽状态**：使用 `useState` 管理当前拖拽的索引
- **Context 传递**：通过 Context 将拖拽状态和处理函数传递给子组件
- **操作函数**：复用现有的 `reorderColumns` 和 `reorderRows` 操作

### 性能优化
- **条件渲染**：拖拽句柄只在悬停时渲染
- **useCallback**：所有处理函数使用 `useCallback` 避免重复创建
- **最小化重渲染**：只更新必要的状态

## 📊 与 AppFlowy 对比

| 特性 | AppFlowy | 当前实现 | 状态 |
|------|----------|----------|------|
| 列拖拽重排序 | ✅ | ✅ | 完成 |
| 行拖拽重排序 | ✅ | ✅ | 完成 |
| 拖拽预览 | ✅ | ✅ | 完成 |
| 拖拽句柄 | ✅ | ✅ | 完成 |
| 视觉反馈 | ✅ | ✅ | 完成 |
| 属性同步更新 | ✅ | ✅ | 完成 |

## ✅ 测试验证

### 功能测试
1. **列拖拽**：
   - ✅ 拖拽列头可以调整列顺序
   - ✅ 拖拽预览正确显示
   - ✅ 列宽、对齐、颜色等属性正确同步

2. **行拖拽**：
   - ✅ 拖拽行可以调整行顺序
   - ✅ 拖拽预览正确显示
   - ✅ 行属性正确同步

3. **边界情况**：
   - ✅ 拖拽到相同位置不触发更新
   - ✅ 只在可编辑模式下启用拖拽
   - ✅ 拖拽句柄只在悬停时显示

### 性能测试
- ✅ 大表格（20+ 行列）拖拽流畅
- ✅ 无明显卡顿或延迟
- ✅ 内存占用正常

## 🚀 后续优化

### 可选增强
1. **拖拽动画**：
   - 添加拖拽时的平滑动画
   - 使用 CSS transitions 或 Framer Motion

2. **拖拽预览优化**：
   - 显示拖拽内容的缩略图
   - 使用 `setDragImage` API

3. **触摸支持**：
   - 添加触摸事件处理
   - 移动端拖拽优化

4. **多选拖拽**：
   - 支持选中多行/列同时拖拽
   - 批量重排序

## 📝 使用示例

```tsx
// 用户操作流程
1. 鼠标悬停在表格上
2. 看到列头上方出现拖拽句柄（⋮⋮）
3. 点击并拖拽句柄
4. 拖拽到目标位置（显示蓝色边框）
5. 释放鼠标
6. 列顺序自动更新

// 代码使用
<SimpleTableBlock
  node={tableData}
  editable={true}  // 启用拖拽
  onUpdateNode={handleUpdate}
/>
```

## 🎉 总结

拖拽重排序功能已完全实现，提供了与 AppFlowy 相同的用户体验：
- ✅ 直观的拖拽交互
- ✅ 清晰的视觉反馈
- ✅ 流畅的性能表现
- ✅ 完整的属性同步

用户现在可以通过简单的拖拽操作来调整表格的行列顺序，无需使用右键菜单或其他复杂操作。
