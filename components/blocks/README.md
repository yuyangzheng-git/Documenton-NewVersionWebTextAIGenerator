# 块组件使用文档

本文档说明如何使用重写后的图片、表格和代码块组件（参考 AppFlowy 实现）。

## 1. 图片块 (ImageBlock)

### 功能特性

- ✅ 图片上传（本地文件、URL）
- ✅ 拖拽调整大小
- ✅ 三向对齐（左、中、右）
- ✅ 双击全屏查看
- ✅ 图片标题/描述
- ✅ 工具栏（对齐、全屏、删除）

### 使用示例

```tsx
import { ImageBlock, ImageType, type ImageBlockData } from '@/components/blocks';

const imageBlock: ImageBlockData = {
  id: 'img-1',
  type: 'image',
  url: 'https://example.com/image.jpg',
  imageType: ImageType.External,
  align: 'center',
  width: 600,
  caption: '这是图片标题'
};

<ImageBlock
  block={imageBlock}
  editable={true}
  onUpdate={(id, updates) => {
    console.log('图片更新:', id, updates);
  }}
  onDelete={(id) => {
    console.log('删除图片:', id);
  }}
/>
```

### 数据结构

```typescript
interface ImageBlockData {
  id: string;
  type: 'image';
  url: string;
  imageType: ImageType;  // 'local' | 'internal' | 'external'
  align: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  caption?: string;
}
```

### 交互说明

1. **上传图片**：点击空白占位符，选择本地文件或输入URL
2. **调整大小**：鼠标悬停时，拖拽左右边缘的蓝色句柄
3. **改变对齐**：点击工具栏的对齐按钮
4. **全屏查看**：双击图片或点击工具栏的全屏按钮
5. **添加标题**：点击图片下方的标题区域输入

---

## 2. 简单表格块 (SimpleTableBlock)

### 功能特性

- ✅ 三层结构（Table → Row → Cell）
- ✅ 表头行/列切换
- ✅ 添加/删除行列
- ✅ 拖拽调整列宽
- ✅ 单元格编辑
- ✅ 列对齐（左、中、右）
- ✅ 行选择和列选择

### 使用示例

```tsx
import { SimpleTableBlock, parseMarkdownTable, type SimpleTableBlockData } from '@/components/blocks';

// 方式1: 手动创建
const tableBlock: SimpleTableBlockData = {
  id: 'table-1',
  type: 'table',
  rows: [
    {
      cells: [
        { content: '姓名' },
        { content: '年龄' },
        { content: '城市' }
      ]
    },
    {
      cells: [
        { content: '张三' },
        { content: '25' },
        { content: '北京' }
      ]
    }
  ],
  enableHeaderRow: true,
  columnWidths: {
    0: 120,
    1: 80,
    2: 150
  }
};

// 方式2: 从 Markdown 解析
const markdown = `
| 姓名 | 年龄 | 城市 |
|-----|-----|-----|
| 张三 | 25 | 北京 |
| 李四 | 30 | 上海 |
`;
const tableBlockFromMarkdown = parseMarkdownTable(markdown, 'table-2');

<SimpleTableBlock
  block={tableBlock}
  editable={true}
  onUpdate={(id, updates) => {
    console.log('表格更新:', id, updates);
  }}
/>
```

### 数据结构

```typescript
interface SimpleTableBlockData {
  id: string;
  type: 'table';
  rows: TableRowData[];

  // 可选属性
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

### 交互说明

1. **编辑单元格**：点击单元格进入编辑模式
2. **调整列宽**：鼠标悬停单元格右边缘，拖拽蓝色句柄
3. **添加行列**：点击表格下方的"添加行"或"添加列"按钮
4. **切换表头**：点击工具栏的"表头行"或"表头列"按钮
5. **退出编辑**：按 Escape 键或点击单元格外部

### 工具函数

```typescript
// Markdown 表格转换
const table = parseMarkdownTable(markdownString, 'custom-id');

// HTML 表格转换
const table = parseHTMLTable(htmlString, 'custom-id');
```

---

## 3. 代码块 (CodeBlock)

### 功能特性

- ✅ 语法高亮（20+ 语言）
- ✅ 语言选择器（支持搜索）
- ✅ 一键复制
- ✅ 行号显示
- ✅ 自动检测语言
- ✅ Tab 键缩进
- ✅ 键盘导航（↑↓ + Enter）

### 使用示例

```tsx
import { CodeBlock, SUPPORTED_LANGUAGES, type CodeBlockData } from '@/components/blocks';

const codeBlock: CodeBlockData = {
  id: 'code-1',
  type: 'code',
  content: `function hello(name) {
  console.log(\`Hello, \${name}!\`);
}

hello('World');`,
  language: 'javascript',
  showLineNumbers: true
};

<CodeBlock
  block={codeBlock}
  editable={true}
  onUpdate={(id, updates) => {
    console.log('代码更新:', id, updates);
  }}
/>
```

### 数据结构

```typescript
interface CodeBlockData {
  id: string;
  type: 'code';
  content: string;
  language?: string;  // 默认 'auto'
  showLineNumbers?: boolean;  // 默认 true
}
```

### 支持的语言

```typescript
export const SUPPORTED_LANGUAGES = [
  'auto',        // 自动检测
  'javascript',
  'typescript',
  'python',
  'java',
  'csharp',
  'cpp',
  'c',
  'go',
  'rust',
  'php',
  'ruby',
  'bash',
  'shell',
  'json',
  'markdown',
  'html',
  'css',
  'sql',
  'yaml',
  'xml',
  'jsx',
  'tsx',
  'dart',
  'kotlin',
  'swift',
  'scala',
  'r',
  'matlab',
  'plaintext'
];
```

### 交互说明

1. **编辑代码**：直接在文本区域输入
2. **Tab 缩进**：按 Tab 键插入两个空格
3. **复制代码**：点击工具栏的"复制"按钮
4. **切换语言**：点击语言按钮打开选择器
5. **搜索语言**：在选择器输入框中输入关键词
6. **键盘选择**：使用 ↑↓ 箭头键导航，Enter 确认
7. **切换行号**：点击"行号"按钮

### 自动语言检测

代码块支持简单的语言自动检测，基于以下规则：

- JavaScript/TypeScript: `import`, `export`, `const`, `let`, `var`, `function`, `class`
- Python: `def`, `class`, `import`, `from`, `if __name__`
- JSON: 以 `{` 或 `[` 开头且可以被 JSON.parse
- HTML: 以 `<!DOCTYPE` 或 `<html` 或 `<tag` 开头
- CSS: 包含 `selector {` 或 `@media`, `@keyframes`

---

## 集成到 NotionBlock

### 修改 NotionBlock.tsx

```tsx
import { ImageBlock, SimpleTableBlock, CodeBlock } from '@/components/blocks';
import type { ImageBlockData, SimpleTableBlockData, CodeBlockData } from '@/components/blocks';

// 在 NotionBlock 的 switch 中添加：
case 'image':
  return (
    <ImageBlock
      block={block as ImageBlockData}
      editable={editable}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  );

case 'table':
  return (
    <SimpleTableBlock
      block={block as SimpleTableBlockData}
      editable={editable}
      onUpdate={onUpdate}
    />
  );

case 'code':
  return (
    <CodeBlock
      block={block as CodeBlockData}
      editable={editable}
      onUpdate={onUpdate}
    />
  );
```

---

## 与 Markdown 解析器集成

### 在 StreamingMarkdownParser 中

```typescript
import { parseMarkdownTable } from '@/components/blocks';

// 在 finalizeTable() 方法中：
private finalizeTable(): void {
  if (this.tableRows.length > 0) {
    const markdownTable = this.tableRows.map(row =>
      `| ${row.join(' | ')} |`
    ).join('\n');

    const tableBlock = parseMarkdownTable(markdownTable);

    this.blocks.push({
      type: 'table',
      content: tableBlock,  // 存储完整的 SimpleTableBlockData
      children: []
    });
  }
  this.tableRows = [];
  this.inTable = false;
}
```

---

## 性能优化建议

### 1. 图片懒加载

```tsx
<img
  src={imageUrl}
  loading="lazy"
  alt={caption}
/>
```

### 2. 表格虚拟滚动

对于大型表格（>100行），建议使用虚拟滚动：

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
```

### 3. 代码高亮防抖

大文件代码高亮时使用防抖：

```typescript
const debouncedHighlight = useMemo(
  () => debounce((code: string) => {
    // 高亮逻辑
  }, 300),
  []
);
```

---

## AppFlowy 参考对照表

| 功能 | AppFlowy 实现 | 当前实现 |
|------|--------------|----------|
| **图片块** | `custom_image_block_component.dart` | `ImageBlock.tsx` |
| 图片类型 | local/internal/external | ImageType enum |
| 调整大小 | ResizableImage widget | 拖拽句柄 + useEffect |
| 对齐方式 | Alignment enum | 'left'/'center'/'right' |
| **表格块** | `simple_table_block_component.dart` | `SimpleTableBlock.tsx` |
| 三层结构 | Table→Row→Cell Node | React 组件嵌套 |
| 列宽调整 | GestureDetector + Transaction | 拖拽 + Context |
| 属性映射 | mapTableAttributes | columnWidths/Aligns/Colors |
| **代码块** | appflowy_editor_plugins | `CodeBlock.tsx` |
| 语法高亮 | 外部库 | Prism.js |
| 语言选择 | Popover/Screen | Dropdown |
| 复制功能 | ClipboardService | navigator.clipboard |

---

## 已知限制和未来改进

### 图片块

- [ ] 上传进度显示
- [ ] 图片压缩
- [ ] 多图片布局（multi_image）
- [ ] 拖放上传

### 表格块

- [ ] 单元格富文本（目前只支持纯文本）
- [ ] 单元格合并
- [ ] 表格导出为 CSV/Excel
- [ ] 行列拖拽重排序

### 代码块

- [ ] 主题切换（目前固定 prism-tomorrow）
- [ ] 代码折叠
- [ ] 差异对比视图
- [ ] 更多语言支持

---

## 故障排除

### 问题：图片无法显示

- 检查 URL 是否可访问
- 检查 CORS 策略
- 确认 imageType 正确

### 问题：表格列宽无法调整

- 确认 editable={true}
- 检查鼠标事件是否被其他元素拦截
- 查看浏览器控制台错误

### 问题：代码高亮不工作

- 确认 Prism.js 和语言包已导入
- 检查语言标识符是否正确
- 查看控制台是否有语法高亮错误

---

## 参考资源

- [AppFlowy 源码](https://github.com/AppFlowy-IO/AppFlowy)
- [Prism.js 文档](https://prismjs.com/)
- [React DnD 文档](https://react-dnd.github.io/react-dnd/)
