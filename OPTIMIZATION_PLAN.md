# 项目优化实施计划

## 优化目标
在不影响现有功能的前提下，逐步修复架构、性能、安全问题

## 第一阶段：安全和性能快速修复（本次实施）

### ✅ 1. XSS 防护（已完成）
- [x] 安装 DOMPurify
- [x] 创建 `lib/html-sanitizer.ts` 工具
- [x] 在 StreamingMarkdownRenderer.tsx 中使用清洗函数
- [x] 在 CodeBlock.tsx 中使用清洗函数
- [x] 测试表格 HTML 渲染安全性

### ✅ 2. useEffect 依赖修复（已完成）
**位置**: `app/word-editor/page.tsx:472-803`

**问题**: useEffect 只依赖 `[outline]`，但内部使用了 `blocks`

**修复方案**: 使用 useRef 追踪 blocks 的当前值
```typescript
// 添加 ref 追踪 blocks
const blocksRef = useRef<NotionBlock[]>(blocks);

useEffect(() => {
  blocksRef.current = blocks;
}, [blocks]);

// useEffect 内部使用 blocksRef.current 代替 blocks
useEffect(() => {
  const existingBlock = blocksRef.current.find(b => ...);
  // ...
}, [outline]);
```

**修改内容**:
- 添加 `blocksRef` 追踪当前 blocks 值
- 所有 useEffect 内部的 `blocks` 读取改为 `blocksRef.current`
- 避免了闭包陷阱和过时的状态值

**状态**: ✅ 完成

### ✅ 3. 性能优化 - 移除未使用代码（已完成）
**位置**: `components/NotionEditor.tsx:32-132`

**问题**: `getBlockNumber` 在每次渲染时重新计算，但实际上未被使用

**修复方案**: 移除未使用的 `getBlockNumber` 函数（100行死代码）

**修改内容**:
- 删除了 lines 32-132 的 `getBlockNumber` 函数
- 减少了不必要的代码体积
- 提升了代码可维护性

**状态**: ✅ 完成

### 🔄 4. 清理 console.log（进行中）
**位置**: 全项目

**方案**: 使用 logger 替代直接的 console 调用

**修改内容**:
- ✅ app/word-editor/page.tsx - 35处已替换
- ✅ components/NotionBlock.tsx - 18处已替换
- ✅ components/outline/OutlinePanel.tsx - 23处已替换
- ✅ components/NotionEditor.tsx - 5处已替换
- ✅ components/AIChat.tsx - 2处已替换
- 🔄 其他文件待替换（~114处）

**状态**: 部分完成

### ✅ 5. 添加错误边界（已完成）
**位置**: 新建 `components/ErrorBoundary.tsx`

**修复方案**: 创建 React Error Boundary 组件捕获运行时错误

```typescript
export class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logger.error('ErrorBoundary caught an error:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      stack: error.stack
    });
  }
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

**修改内容**:
- ✅ 创建 components/ErrorBoundary.tsx
- ✅ 在 app/word-editor/page.tsx 中使用 ErrorBoundary
- ✅ 提供默认错误 UI 和重试功能
- ✅ 集成 logger 记录错误

**状态**: ✅ 完成

---

## 第二阶段：类型安全改进（计划中）

### 6. 统一 NotionBlock 类型定义
**问题**: NotionBlock 在多个文件中重复定义

**方案**: 创建 `types/blocks.ts`

```typescript
// types/blocks.ts
export interface NotionBlock {
  id: string;
  type: BlockType;
  content: string;
  properties: BlockProperties;
  children: NotionBlock[];
}

export type BlockType =
  | 'paragraph' | 'h1' | 'h2' | 'h3'
  | 'bullet' | 'numbered' | 'todo'
  | 'code' | 'quote' | 'divider'
  | 'table' | 'image' | 'callout'
  | 'guide';

export interface BlockProperties {
  loading?: boolean;
  isGenerating?: boolean;
  isGenerated?: boolean;
  guidanceVisible?: boolean;
  tableData?: SimpleTableBlockData;
  [key: string]: any; // 临时兼容
}
```

**状态**: 待实施

### 7. 减少 any 使用
**位置**: 多处

**方案**: 逐步替换为明确类型

**状态**: 待实施

---

## 第三阶段：架构重构（长期）

### 8. 状态管理重构
**问题**: outline 和 blocks 双重状态源

**方案 A**: 合并到 Zustand store
```typescript
// store/useStore.ts
interface EditorStore {
  outline: OutlineItem[];
  blocks: NotionBlock[]; // 🆕 统一管理

  // 派生状态
  getBlocksFromOutline: () => NotionBlock[];
}
```

**方案 B**: blocks 作为派生状态
```typescript
const blocks = useMemo(() =>
  convertOutlineToBlocks(outline, userCreatedBlocks),
  [outline, userCreatedBlocks]
);
```

**状态**: 规划中

### 9. 统一章节生成逻辑
**问题**: OutlinePanel 和主编辑器生成逻辑不一致

**方案**: 创建统一的生成 Hook
```typescript
// hooks/useChapterGeneration.ts
export function useChapterGeneration() {
  const generateChapter = useCallback((outlineItemId: string) => {
    // 统一的生成逻辑
  }, []);

  return { generateChapter, isGenerating, progress };
}
```

**状态**: 规划中

---

## 第四阶段：性能优化（长期）

### 10. 虚拟滚动
**问题**: 大型文档（>100块）渲染卡顿

**方案**: 使用 react-window
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={800}
  itemCount={blocks.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>
      <NotionBlock block={blocks[index]} />
    </div>
  )}
</FixedSizeList>
```

**状态**: 规划中

---

## 实施原则

1. **渐进式优化**: 每次只改一小部分
2. **功能不退化**: 确保现有功能正常
3. **充分测试**: 每次修改后验证
4. **版本控制**: 每个阶段提交一次

## 当前进度

- ✅ 第一阶段 - 任务 1: XSS 防护 **完成**
- ✅ 第一阶段 - 任务 2: useEffect 依赖修复 **完成**
- ✅ 第一阶段 - 任务 3: 性能优化 - 移除未使用代码 **完成**
- 🔄 第一阶段 - 任务 4: 清理 console.log **部分完成（主要UI组件完成）**
- ✅ 第一阶段 - 任务 5: 添加错误边界 **完成**
- 📋 第二阶段: 待开始
- 📋 第三阶段: 规划中
- 📋 第四阶段: 规划中

## 第一阶段完成度: 90%
主要任务已完成，剩余 console.log 替换可后续进行

---

**更新时间**: 2026-01-28
**实施人**: Claude Code
