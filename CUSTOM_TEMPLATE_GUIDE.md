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

{#d.sections.paragraphs}
{d.sections.paragraphs}

{/d.sections.paragraphs}
{/d.sections}
```

### 使用列表

```
{#d.sections}
{#d.sections.lists}
• {d.sections.lists.items.0}
{/d.sections.lists}
{/d.sections}
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

