# 自定义 Word 模板指南

## 概述

本项目使用 Carbone 模板引擎来生成 Word 文档。你可以上传自定义的 .docx 模板文件来控制文档的样式和布局。

## Carbone 模板语法

Carbone 使用简单的标记语法来插入数据：

### 基本语法

- `{d.fieldName}` - 插入字段值
- `{d.array.fieldName}` - 访问数组对象的字段
- `{#d.array}...{/d.array}` - 循环遍历数组
- `{d.array.0.fieldName}` - 访问数组索引

## 可用数据字段

导出时会提供以下数据：

```javascript
{
  title: "文档标题",
  date: "2025年1月7日",
  year: "2025",
  today: "2025-01-07",
  sections: [
    {
      heading: "章节标题",
      level: 1,  // 1=H1, 2=H2, 3=H3
      content: "章节内容",
      paragraphs: ["段落1", "段落2"],
      lists: [
        { type: "bullet", items: ["列表项1", "列表项2"] }
      ],
      quotes: ["引用内容"]
    }
  ],
  outline: [
    {
      number: "1.",
      title: "大纲标题",
      level: 1
    }
  ]
}
```

## 模板示例

### 基本文档模板

在 Word 文档中创建以下内容：

```
{d.title}

日期: {d.date}

{#d.sections}
{d.sections.heading}
{d.sections.level === 1 ? '' : ''}
{#d.sections.paragraphs}
{d.sections.paragraphs}

{/d.sections.paragraphs}
{/d.sections}
```

### 使用表格展示列表

```
{#d.sections.lists}
{d.sections.lists.type === 'bullet' ? '• ' : '{@index}. '}{d.sections.lists.items.0}
{/d.sections.lists}
```

### 条件显示

```
{d.year === 2025 ? '今年是2025年' : '其他年份'}
```

## 如何创建模板

1. 在 Microsoft Word 中创建新文档
2. 设计你的文档样式（字体、颜色、页眉页脚等）
3. 在需要插入数据的地方使用 Carbone 语法 `{d.fieldName}`
4. 保存为 .docx 格式
5. 在应用的模板选择器中上传

## 高级功能

### 循环遍历列表项

```
{#d.sections}
{#d.sections.lists}
{#d.sections.lists.items}
- {d.sections.lists.items}
{/d.sections.lists.items}
{/d.sections.lists}
{/d.sections}
```

### 嵌套循环

```
{#d.sections}
## {d.sections.heading}

{#d.sections.paragraphs}
{d.sections.paragraphs}

{/d.sections.paragraphs}

{#d.sections.lists}
• 列表:
  {#d.sections.lists.items}
  - {d.sections.lists.items}
  {/d.sections.lists.items}
{/d.sections.lists}
{/d.sections}
```

## 常见问题

### Q: 如何修改字体和样式？
A: 直接在 Word 模板中修改，Carbone 会保留所有格式。

### Q: 如何添加页眉页脚？
A: 在 Word 中正常添加页眉页脚，可以在其中使用 `{d.title}` 等变量。

### Q: 支持哪些数据类型？
A: 支持字符串、数字、布尔值、数组和对象。

### Q: 如何处理空值？
A: Carbone 会自动跳过 null 和 undefined 值。

## 参考资源

- Carbone 官方文档: https://carbone.io
- Carbone GitHub: https://github.com/agence-alma/carbone
