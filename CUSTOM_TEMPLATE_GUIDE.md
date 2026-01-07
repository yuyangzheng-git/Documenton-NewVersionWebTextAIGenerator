# 自定义 Word 模板指南（兼容 Carbone 设计规范）

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

## Carbone 模板语法规范

### 基本语法

- `{d.fieldName}` - 插入字段值
- `{d.array.fieldName}` - 访问数组对象的字段
- `{#d.array}...{/d.array}` - 循环遍历数组
- `{d.array.0.fieldName}` - 访问数组索引

### 循环语法

**正确的循环方式：**
```
{#d.sections}
{d.sections.heading}

{/d.sections}
```

**重要规则：**
- 每个循环必须有对应的结束标记 `{/d.array}`
- 循环内使用 `[i]` 表示当前元素，`[i+1]` 表示下一个元素
- 不要混合不同的循环，避免文档损坏

### 条件判断

```
{d.year === 2025 ? '今年是2025年' : '其他年份'}
{d.sections.level === 1 ? '一级标题' : '二级标题'}
```

### 文本格式化

#### 换行符（Carbone 规范）

在 Word 文档中渲染换行，必须使用 `:convCRLF` 格式化器：

```
{d.rawContent:convCRLF}
```

**示例：**
```
原始数据: "第一行\n第二行"
模板: {d.text:convCRLF}
结果:
第一行
第二行
```

**注意：** 不要直接使用 `\n`，在 DOCX/ODT 中它会被转换为文本而不是换行。

#### 大小写转换

```
{d.title:lowerCase()}  // 全小写
{d.title:upperCase()}  // 全大写
{d.title:ucFirst()}    // 首字母大写
{d.title:ucWords()}    // 每个单词首字母大写
```

#### 文本截断

```
{d.text:substr(0, 50)}        // 从索引0截取50个字符
{d.text:substr(50, 100)}       // 从索引50截取到100
{d.text:substr(0, 50, true)}  // 按单词模式截取（不截断单词）
```

#### 文本替换

```
{d.text:replace('旧文本', '新文本')}
{d.text:replace('待替换', null)}  // 删除文本
```

#### 文本长度

```
{d.title:len()}  // 返回标题长度
```

#### 文本补全

```
{d.text:padl(10)}        // 左补空格到10字符
{d.text:padr(10, '0')}  // 右补'0'到10字符
```

#### 省略号

```
{d.text:ellipsis(20)}  // 超过20字符显示"..."
```

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
      level: 1,
      content: "章节内容",
      paragraphs: ["段落1", "段落2"],
      lists: [
        { type: "bullet", items: ["列表项1", "列表项2"] }
      ],
      quotes: ["引用内容"],
      rawContent: "章节的所有原始内容"
    }
  ],
  outline: [
    {
      number: "1.",
      title: "大纲标题",
      level: 1
    }
  ],
  htmlContent: "<h1>...</h1><p>...</p>..."
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

### 基本文档模板（推荐）

```
{d.title:upperCase()}

生成日期: {d.date}

───────────────────────────────────────

{#d.sections}
{d.sections.heading}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{d.sections.rawContent:convCRLF}

{/d.sections}

───────────────────────────────────────

文档总数: {d.sections.length} 章
```

### 使用带格式的原始内容

```
{d.title}

{#d.sections}
【{d.sections.heading}】
{d.sections.rawContent:convCRLF}
{/d.sections}
```

### 使用列表项

```
{#d.sections}
{#d.sections.lists}
{#d.sections.lists.items}
• {d.sections.lists.items}
{/d.sections.lists.items}
{/d.sections.lists}
{/d.sections}
```

### 带编号的列表

```
{#d.sections}
{d.sections.heading}

{#d.sections.lists}
{d.sections.lists.type === 'bullet' ? '• ' : '{@index + 1}. '}
{#d.sections.lists.items}
  {d.sections.lists.items}
{/d.sections.lists.items}
{/d.sections.lists}
{/d.sections}
```

### 带页眉页脚的模板

**页眉区域：**
```
{d.title:upperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**内容区域：**
```
{#d.sections}
{d.sections.heading}

{d.sections.rawContent:convCRLF}
{/d.sections}
```

**页脚区域：**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
生成日期: {d.date} | 总页数: {d.sections.len()}
```

### 带背景图的模板

在 Word 中设计模板时：

1. 点击"插入" > "图片"
2. 选择背景图
3. 右键图片 > "设置图片格式"
4. 在"布局"中选择"衬于文字下方"
5. 在背景图上添加内容占位符：
```
{d.title}

{#d.sections}
{d.sections.heading}
─────────────────────
{d.sections.rawContent:convCRLF}
{/d.sections}
```

### 条件显示模板

```
文档标题: {d.title}

{#d.sections}
{d.sections.level === 1 ? '【一级章节】' : '【二级章节】'}
{d.sections.heading}

{#d.sections.quotes.length > 0}
> {d.sections.quotes[0]}
{/d.sections.quotes.length > 0}

{d.sections.rawContent:convCRLF}
{/d.sections}
```

### 封面 + 正文模板

**封面：**
```
╔════════════════════════════════════════╗
║                                          ║
║              {d.title:upperCase()}               ║
║                                          ║
║        生成日期: {d.date}                  ║
║                                          ║
╚════════════════════════════════════════╝
```

**正文（换页）：**
```
{#d.sections}
第 {@index + 1} 章
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{d.sections.heading}

{d.sections.rawContent:convCRLF}
{/d.sections}
```

## 如何创建模板

### 推荐工具

**强烈建议使用 LibreOffice 创建模板**，因为 Carbone 使用 LibreOffice 引擎渲染文档。MS Word 虽然完全支持，但可能会产生细微差异。

### 创建步骤

1. 在 LibreOffice Writer 或 Microsoft Word 中创建新文档
2. 设计文档布局：
   - 页眉（Header）
   - 页脚（Footer）
   - 背景图（Background Image）
   - 封面（Cover Page）
3. 在需要插入数据的地方使用 Carbone 语法
4. 保存为 `.docx` 格式
5. 在应用的模板选择器中上传

## Carbone 最佳实践

### 必须遵守的规则

1. **循环标记**：确保每个 `{#d.array}` 都有对应的 `{/d.array}`
2. **索引使用**：循环内使用 `[i]` 和 `[i+1]`，不要混用不同数组的循环
3. **格式化器**：字符串参数必须用单引号 `'`，不要用双引号
4. **换行处理**：使用 `:convCRLF` 处理换行，不要直接使用 `\n`
5. **图片锚定**：图片、形状、文本框应设置为"在文本中"
6. **表格设计**：避免用鼠标拖拽调整列宽，使用"表格属性"设置列宽

### 推荐做法

1. **一致性**：使用 LibreOffice 作为模板编辑器
2. **分页符**：使用 Shift+Enter 插入分页符（用于 showBegin/showEnd）
3. **表头重复**：表格属性中勾选"在每页顶端重复作为标题"
4. **动态图片**：图片必须是 Data URL 格式（`data:image/jpeg;base64,...`）
5. **条件块**：只在需要时使用 showBegin/showEnd，优先使用 `:ifEqual` 等格式化器

### 避免的反模式

1. ❌ 不要混用不同循环
   ```
   // 错误示例
   {#d.fruits}{d.fruits[i].name}{d.vegetables[i].name}{/d.fruits}
   // 正确示例
   {#d.fruits}{d.fruits[i].name}{/d.fruits}
   {#d.vegetables}{d.vegetables[i].name}{/d.vegetables}
   ```

2. ❌ 不要在循环中使用 `[i+1]` 后立即使用另一个数组的 `[i]`
3. ❌ 不要在格式化器参数中使用双引号
4. ❌ 不要将格式化器嵌套在另一个格式化器中

## API 使用说明

### 上传模板

上传模板后会获得一个 `templateId`，用于后续的文档生成。

### 生成文档

使用 `templateId` 和数据调用渲染 API 生成文档。

### 支持的导出格式

- `.docx` - Word 文档
- `.pdf` - PDF 文档（通过 `convertTo: "pdf"` 参数）
- `.odt` - OpenDocument 文本

## 常见问题

### Q: 如何处理多行文本？
A: 使用 `:convCRLF` 格式化器将 `\n` 转换为换行符：
   ```
   {d.content:convCRLF}
   ```

### Q: 如何修改字体和样式？
A: 直接在 Word 模板中修改，Carbone 会保留所有格式。

### Q: 如何添加页眉页脚？
A: 在 Word 中正常添加页眉页脚，可以在其中使用 `{d.title}` 等变量。

### Q: 支持 PDF 导出吗？
A: 是的，可以通过设置 `convertTo: "pdf"` 参数来导出 PDF。

### Q: 测试 Token 和生产 Token 的区别？
A: 测试 Token 生成的文档带有水印，生产 Token 需要绑定支付方式。

### Q: 为什么文档格式不对？
A: 建议使用 LibreOffice 创建模板，因为它与 Carbone 渲染引擎兼容性最好。

### Q: 如何调试模板问题？
A: 准备简单的 JSON 数据集和模板，隔离问题，联系 Carbone 支持时提供这些信息。

## 参考资源

- Carbone 官方文档: https://carbone.io/documentation.html
- Carbone API 文档: https://carbone.io/documentation.html#how-to-use-api
- Carbone 格式化器文档: https://carbone.io/documentation.html#formatters
- Carbone 常见问题: https://help.carbone.io/


