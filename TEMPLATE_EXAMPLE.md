# Word 模板示例说明

## 如何创建自定义 Word 模板

### 步骤 1：准备 Word 文档

1. 打开 Microsoft Word
2. 设计你的文档布局，包括：
   - 页眉（Header）
   - 页脚（Footer）
   - 背景图片（Background Image）
   - 封面（Cover Page）

### 步骤 2：添加内容占位符

在需要插入数据的地方使用 Carbone 语法：

#### 简单标题示例
```
{d.title}
```

#### 文档信息示例
```
文档标题: {d.title}
创建日期: {d.date}
年份: {d.year}
```

#### 遍历章节内容
```
{#d.sections}
{d.sections.heading}
───────────────────────────
{d.sections.rawContent}

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
{d.title}
```

#### 添加页脚
1. 点击"插入" > "页脚"
2. 在页脚中输入：
```
{d.date} | 第 1 页
```

### 步骤 4：添加背景图

1. 点击"插入" > "图片"
2. 选择你的背景图
3. 右键图片 > "设置图片格式"
4. 在"布局"选项卡中选择"衬于文字下方"
5. 调整图片大小和位置

### 完整模板示例

```
╔════════════════════════════════════════╗
║           {d.title}                         ║
╚════════════════════════════════════════╝

───────────────────────────────────────────────

{#d.sections}
【{d.sections.heading}】
{#d.sections.paragraphs}
{d.sections.paragraphs}

{/d.sections.paragraphs}

───────────────────────────────────────────────
{/d.sections}

文档生成时间: {d.date}
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
      rawContent: "完整内容\n包含格式",
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

### 保存模板

1. 将文档保存为 `.docx` 格式
2. 在应用的模板选择器中点击"上传模板"
3. 选择你的模板文件
4. 上传成功后会获得模板 ID
5. 使用该模板导出文档

### 注意事项

1. **模板语法**：确保使用 `{d.字段名}` 格式
2. **循环语法**：使用 `{#d.array}...{/d.array}` 遍历数组
3. **条件判断**：使用 `{d.field === value ? 'yes' : 'no'}` 进行条件判断
4. **图片位置**：背景图需要设置为"衬于文字下方"
5. **页眉页脚**：在 Word 的页眉页脚编辑器中正常添加
6. **格式保留**：`rawContent` 会保留所有格式，`htmlContent` 包含完整 HTML

### 高级示例：包含封面

```
[封面页面]

{d.title}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{d.date}

[分页符]

[正文页面]

{#d.sections}
{d.sections.heading}
─────────────────────
{d.sections.rawContent}
{/d.sections}
```

### 高级示例：章节编号

```
{#d.sections}
第 {@index + 1} 章
{d.sections.heading}
─────────────────────
{d.sections.rawContent}
{/d.sections}
```

### 高级示例：条件显示

```
{d.sections.level === 1 ? '一级标题' : '二级标题'}
{d.sections.quotes.length > 0 ? '有引用' : '无引用'}
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
