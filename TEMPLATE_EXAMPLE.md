# Word 模板示例说明（兼容 Carbone 规范）

## 如何创建自定义 Word 模板

### 步骤 1：准备 Word 文档

**推荐工具：** LibreOffice Writer（与 Carbone 渲染引擎兼容性最好）

1. 打开 LibreOffice Writer 或 Microsoft Word
2. 设计你的文档布局，包括：
   - 页眉（Header）
   - 页脚（Footer）
   - 背景图片（Background Image）
   - 封面（Cover Page）

### 步骤 2：添加内容占位符

在需要插入数据的地方使用 Carbone 语法。

#### 简单标题示例
```
{d.title:upperCase()}
```

#### 文档信息示例
```
文档标题: {d.title}
创建日期: {d.date}
年份: {d.year}
```

#### 遍历章节内容（推荐：使用 :convCRLF 处理换行）
```
{#d.sections}
{d.sections.heading}
───────────────────────────
{d.sections.rawContent:convCRLF}
{/d.sections}
```

#### 遍历大纲
```
文档大纲:
{#d.outline}
{d.outline.number} {d.outline.title}
{/d.outline}
```

### 步骤 3：添加页眉页脚

#### 添加页眉
1. 点击"插入" > "页眉"
2. 在页眉中输入：
```
{d.title:ucFirst()}
```

#### 添加页脚
1. 点击"插入" > "页脚"
2. 在页脚中输入：
```
{d.date} | 总页数: {d.sections.len()}
```

### 步骤 4：添加背景图

1. 点击"插入" > "图片"
2. 选择你的背景图
3. 右键图片 > "设置图片格式"
4. 在"布局"选项卡中选择"衬于文字下方"
5. 调整图片大小和位置
6. 在背景图上方放置内容占位符 `{d.title}` 等

### 完整模板示例

#### 基础模板（带格式化）
```
╔════════════════════════════════════════╗
║         {d.title:upperCase()}                ║
╚══════════════════════════════════════╝

───────────────────────────────────────────────

{#d.sections}
第 {@index + 1} 章
【{d.sections.heading}】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{d.sections.rawContent:convCRLF}

{/d.sections}

───────────────────────────────────────────────
文档生成时间: {d.date}
```

#### 带列表的模板
```
{d.title}

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

#### 带条件显示的模板
```
{d.title}

{#d.sections}
{d.sections.level === 1 ? '【一级章节】' : '【二级章节】'}
{d.sections.heading}

{#d.sections.quotes.len() > 0}
> {d.sections.quotes[0]}
{/d.sections.quotes.len() > 0}

{d.sections.rawContent:convCRLF}
{/d.sections}
```

### 数据结构说明

```javascript
{
  title: "文档标题",
  date: "2025年1月7日",
  year: "2025",
  today: "2025-01-07",
  sections: [
    {
      heading: "第一章标题",
      level: 1,
      content: "纯文本内容",
      paragraphs: ["段落1", "段落2"],
      rawContent: "第一段内容\n\n第二段内容",  // 注意：包含 \n 换行符
      lists: [
        { type: "bullet", items: ["列表项1"] }
      ],
      quotes: ["引用内容"]
    }
  ],
  outline: [
    {
      number: "1.",
      title: "第一章标题",
      level: 1
    }
  ],
  htmlContent: "<h1>...</h1><p>...</p>"
}
```

**重要提示：** 数据中的 `rawContent` 包含 `\n` 换行符，在模板中必须使用 `:convCRLF` 格式化器才能正确显示换行。

### 保存模板

1. 将文档保存为 `.docx` 格式
2. 在应用的模板选择器中点击"上传模板"
3. 选择你的模板文件
4. 上传成功后会获得模板 ID
5. 使用该模板导出文档

### 注意事项（Carbone 规范）

1. **换行处理**：使用 `:convCRLF` 格式化器处理换行
   ```
   {d.rawContent:convCRLF}  // 正确
   {d.rawContent}           // 错误，\n 会显示为文本
   ```

2. **模板语法**：确保使用 `{d.字段名}` 格式

3. **循环语法**：使用 `{#d.array}...{/d.array}` 遍历数组

4. **条件判断**：使用 `{d.field === value ? 'yes' : 'no'}` 进行条件判断

5. **字符串参数**：格式化器的字符串参数必须用单引号 `'`，不要用双引号

6. **图片位置**：背景图需要设置为"衬于文字下方"或"在文本中"

7. **页眉页脚**：在 Word 的页眉页脚编辑器中正常添加

8. **编辑器选择**：推荐使用 LibreOffice，MS Word 可能产生细微差异

### 高级示例：包含封面

```
[封面页面]

{d.title:upperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
创建日期: {d.date}
作者: AI Document Generator

[换页符（Shift+Enter）]

[正文页面]

{#d.sections}
第 {@index + 1} 章
{d.sections.heading}
─────────────────────
{d.sections.rawContent:convCRLF}
{/d.sections}
```

### 高级示例：章节编号

```
{d.title}

{#d.sections}
第 {@index + 1} 章
{d.sections.heading:upperCase()}
─────────────────────
{d.sections.rawContent:convCRLF}
{/d.sections}
```

### 高级示例：条件显示

```
{d.title}

{#d.sections}
{d.sections.level === 1 ? '一级标题：' : '二级标题：'}
{d.sections.heading}

{#d.sections.quotes.len() > 0}
重要引用：
{d.sections.quotes[0]}
{/d.sections.quotes.len() > 0}

内容：
{d.sections.rawContent:convCRLF}
{/d.sections}
```

### 高级示例：表格形式展示大纲

```
文档大纲总览

章节编号 | 章节标题 | 级别
────────────────────────────────────
{#d.outline}
{d.outline.number} | {d.outline.title} | {d.outline.level}
{/d.outline}

────────────────────────────────────
```

### 高级示例：完整商务模板

```
╔════════════════════════════════════════╗
║                                          ║
║        {d.title:upperCase()}               ║
║                                          ║
║        报告日期: {d.date}                  ║
║                                          ║
╚════════════════════════════════════════╝

───────────────────────────────────────────────

{#d.sections}
【{d.sections.heading}】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{d.sections.rawContent:convCRLF}

{/d.sections}

───────────────────────────────────────────────

报告统计:
- 总章节数: {d.sections.len()}
- 生成日期: {d.date}
- 文档年份: {d.year}
```

### 上传模板到 Carbone

1. 确保 `.env.local` 中设置了 `CARBONE_API_TOKEN`
2. 上传模板文件
3. 获得模板 ID
4. 使用模板导出文档

### 测试模板

建议使用以下测试数据测试模板：

```javascript
{
  title: "测试文档标题",
  date: "2025年1月7日",
  year: "2025",
  sections: [
    {
      heading: "第一章：引言",
      level: 1,
      paragraphs: ["这是第一段内容。", "这是第二段内容。"],
      rawContent: "这是第一段内容。\n\n这是第二段内容。",
      lists: [
        { type: "bullet", items: ["要点1", "要点2", "要点3"] }
      ],
      quotes: ["这是一段重要的引用内容。"]
    },
    {
      heading: "第二章：正文",
      level: 1,
      paragraphs: ["正文内容..."],
      rawContent: "正文内容...",
      lists: [
        { type: "numbered", items: ["第一项", "第二项"] }
      ]
    }
  ],
  outline: [
    { number: "1.", title: "第一章：引言", level: 1 },
    { number: "1.1", title: "子章节", level: 2 },
    { number: "2.", title: "第二章：正文", level: 1 }
  ]
}
```

## 常见问题

### Q: 为什么换行不生效？
A: 数据中的 `\n` 需要用 `:convCRLF` 格式化器处理：
   ```
   {d.content:convCRLF}
   ```

### Q: 如何在模板中控制文本长度？
A: 使用 `:substr()` 格式化器：
   ```
   {d.title:substr(0, 50, true)}  // 按单词截取不超过50字符
   {d.text:substr(0, 50)}           // 直接截取50个字符
   ```

### Q: 如何大写/小写转换？
A: 使用对应的格式化器：
   ```
   {d.title:upperCase()}  // 全大写
   {d.title:lowerCase()}  // 全小写
   {d.title:ucFirst()}    // 首字母大写
   ```

### Q: 表格表头如何重复？
A: 在 LibreOffice 中：右键表格 > 表格属性 > 勾选"在每页顶端重复作为标题"

### Q: 如何调试模板？
A: 准备简单的 JSON 数据集和模板，隔离问题，提供详细信息给 Carbone 支持。
