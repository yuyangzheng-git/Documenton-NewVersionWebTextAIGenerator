# 自定义 Word 模板指南

## 概述

本项目使用 Carbone 云端 API 来生成 Word 文档。你可以上传自定义的 .docx 模板文件来控制文档的样式和布局。

## 前置要求

使用自定义模板功能需要配置 Carbone API Token：

1. 访问 [Carbone 官网](https://carbone.io) 注册账号
2. 获取 API Token（有测试 Token 和生产 Token 两种）
3. 在项目环境变量中设置 `CARBONE_API_TOKEN`

```bash
# 在 .env.local 文件中设置
CARBONE_API_TOKEN=your_api_token_here
```

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
      quotes: ["引用内容"],
      rawContent: "章节的所有原始内容"  // 包含完整的格式化内容
    }
  ],
  outline: [
    {
      number: "1.",
      title: "大纲标题",
      level: 1
    }
  ],
  htmlContent: "<h1>...</h1><p>...</p>..."  // 完整的 HTML 内容
}
```

### 数据字段说明

- `title` - 文档标题
- `date` - 当前日期（中文格式）
- `year` - 当前年份
- `today` - 当前日期（ISO 格式）
- `sections` - 章节数组
  - `heading` - 章节标题
  - `level` - 章节级别（1=H1, 2=H2, 3=H3）
  - `content` - 章节内容（纯文本）
  - `paragraphs` - 段落数组
  - `lists` - 列表数组
  - `quotes` - 引用数组
  - `rawContent` - 完整的原始内容（包含所有格式）
- `outline` - 大纲数组
  - `number` - 编号（如 "1", "1.1"）
  - `title` - 标题
  - `level` - 级别
- `htmlContent` - 完整的 HTML 内容（保留所有格式）

## 模板示例

### 基本文档模板（使用 sections）

在 Word 文档中创建以下内容：

```
{d.title}

日期: {d.date}

{#d.sections}
{d.sections.heading}

{#d.sections.paragraphs}
{d.sections.paragraphs}

{/d.sections.paragraphs}
{/d.sections}
```

### 使用原始内容（保留格式）

如果需要保留前端编辑器的所有格式（加粗、斜体、颜色等），使用 `rawContent`：

```
{d.title}

{#d.sections}
{d.sections.heading}

{d.sections.rawContent}

{/d.sections}
```

### 使用 HTML 内容（完整格式）

如果需要最完整的格式控制，可以使用 `htmlContent`：

```
{d.htmlContent}
```

注意：直接在 Word 中使用 HTML 需要额外处理，建议使用 `rawContent` 或逐个字段。

### 使用列表

```
{#d.sections}
{#d.sections.lists}
{#d.sections.lists.items}
• {d.sections.lists.items}
{/d.sections.lists.items}
{/d.sections.lists}
{/d.sections}
```

### 添加页眉页脚

在 Word 模板中正常添加页眉页脚：

**页眉示例：**
```
{d.title}
```

**页脚示例：**
```
日期: {d.date} | 第 1 页
```

### 添加背景图

1. 在 Word 中插入背景图片
2. 设置图片为"置于底层"或"衬于文字下方"
3. 可以在背景图上放置内容占位符 `{d.title}` 等

### 条件显示

```
{d.year === 2025 ? '今年是2025年' : '其他年份'}
```

### 高级模板（完整版）

```
[页眉区域]
{d.title}
================================

{#d.sections}
第 {d.@index + 1} 章
{d.sections.heading}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{d.sections.rawContent}

{/d.sections}

[页脚区域]
生成日期: {d.date}
```

## 如何创建模板

1. 在 Microsoft Word 中创建新文档
2. 设计你的文档样式（字体、颜色、页眉页脚等）
3. 在需要插入数据的地方使用 Carbone 语法 `{d.fieldName}`
4. 保存为 .docx 格式
5. 在应用的模板选择器中上传

## API 使用说明

### 上传模板

上传模板后会获得一个 `templateId`，用于后续的文档生成。

### 生成文档

使用 `templateId` 和数据调用渲染 API 生成文档。

## 常见问题

### Q: 如何修改字体和样式？
A: 直接在 Word 模板中修改，Carbone 会保留所有格式。

### Q: 如何添加页眉页脚？
A: 在 Word 中正常添加页眉页脚，可以在其中使用 `{d.title}` 等变量。

### Q: 支持 PDF 导出吗？
A: 是的，可以通过设置 `convertTo: "pdf"` 参数来导出 PDF。

### Q: 测试 Token 和生产 Token 的区别？
A: 测试 Token 生成的文档带有水印，生产 Token 需要绑定支付方式。

### Q: 没有 API Token 怎么办？
A: 没有配置 API Token 时，会使用内置的 docx 库生成文档，仅支持 5 种预设模板。

## 参考资源

- Carbone 官方文档: https://carbone.io/documentation.html
- Carbone API 文档: https://carbone.io/documentation.html#how-to-use-api

