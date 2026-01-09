# 自定义 Word 模板使用指南 (本地化版本)

## 概述

本系统使用 **完全本地化的模板渲染引擎**,无需依赖任何外部付费 API。基于 docxtemplater 库实现,支持类似 Carbone 的模板语法和格式化器。

## 主要特性

- ✅ **完全本地化** - 无需联网,无需 API 密钥
- ✅ **免费使用** - 基于开源库,无使用限制
- ✅ **自定义模板** - 支持上传自定义 .docx 模板
- ✅ **格式化器支持** - 内置常用格式化器
- ✅ **模板存储** - 本地文件系统存储
- ✅ **灵活渲染** - 支持循环、条件等复杂逻辑

## 快速开始

### 1. 创建模板

使用 Microsoft Word 或 LibreOffice 创建 .docx 文件,在需要插入数据的地方使用占位符:

```
{d.title}
{d.date}
{d.sections.len()} 个章节
```

### 2. 上传模板

在前端编辑器中:
1. 点击"模板"按钮
2. 在"自定义模板"区域点击"上传模板"
3. 选择你的 .docx 文件
4. 上传成功后会获得模板 ID

### 3. 使用模板导出

选择上传的自定义模板,点击"导出"按钮即可生成文档。

## 模板语法

### 基本变量

```
文档标题: {d.title}
创建日期: {d.date}
年份: {d.year}
```

### 遍历数组

```
{#d.sections}
  {d.sections.heading}
  {d.sections.rawContent}
{/d.sections}
```

### 条件判断

```
{#d.sections.len() > 0}
  共 {d.sections.len()} 个章节
{/d.sections.len() > 0}
```

### 索引访问

```
第一个标题: {d.sections[0].heading}
```

## 支持的格式化器

### 文本格式化

| 格式化器 | 说明 | 示例 |
|---------|------|------|
| `upperCase` | 转大写 | `{d.title:upperCase()}` |
| `lowerCase` | 转小写 | `{d.title:lowerCase()}` |
| `ucFirst` | 首字母大写 | `{d.title:ucFirst()}` |
| `ucWords` | 每个单词首字母大写 | `{d.title:ucWords()}` |

### 字符串操作

| 格式化器 | 说明 | 示例 |
|---------|------|------|
| `substr` | 截取子字符串 | `{d.text:substr(0, 50)}` |
| `substr` | 按单词截取 | `{d.text:substr(0, 50, true)}` |
| `replace` | 字符串替换 | `{d.text:replace('old', 'new')}` |
| `len` | 获取长度 | `{d.sections.len()}` |

### 填充

| 格式化器 | 说明 | 示例 |
|---------|------|------|
| `padl` | 左填充 | `{d.id:padl(5, '0')}` |
| `padr` | 右填充 | `{d.text:padr(20)}` |

### 其他

| 格式化器 | 说明 | 示例 |
|---------|------|------|
| `ellipsis` | 省略号截断 | `{d.title:ellipsis(50)}` |
| `convCRLF` | 换行符转换 | `{d.content:convCRLF()}` |

**注意**: `convCRLF` 通常由 docxtemplater 的 `linebreaks: true` 选项自动处理。

## 数据结构

导出时提供给模板的数据结构:

```typescript
{
  title: string;        // 文档标题
  date: string;         // 日期 (中文格式)
  year: string;         // 年份
  today: string;        // 日期 (ISO 格式: 2025-01-07)
  sections: [{
    heading: string;     // 章节标题
    level: number;       // 章节级别 (1, 2, 3)
    content: string;     // 纯文本内容
    paragraphs: string[]; // 段落数组
    lists: [{           // 列表
      type: string;     // 'bullet' 或 'numbered'
      items: string[];  // 列表项
    }];
    quotes: string[];   // 引用内容
    rawContent: string; // 原始内容 (含换行符)
  }];
  outline: [{
    number: string;      // 编号 (如 "1.", "1.1")
    title: string;      // 标题
    level: number;      // 级别
  }];
  htmlContent: string;  // 完整 HTML 内容
}
```

## 模板示例

### 简单模板

```markdown
# {d.title}

生成日期: {d.date}

---

{#d.sections}
## {d.sections.heading}

{d.sections.rawContent}

{/d.sections}
```

### 带格式化的模板

```markdown
# {d.title:upperCase()}

文档信息:
- 创建日期: {d.date}
- 总章节数: {d.sections.len()}
- 生成年份: {d.year}

---

{#d.sections}
## 第 {@index + 1} 章: {d.sections.heading}

{d.sections.rawContent}

{/d.sections}
```

### 大纲展示模板

```markdown
{d.title}

---

**文档大纲**

{#d.outline}
{d.outline.number} {d.outline.title} (级别: {d.outline.level})
{/d.outline}

---

{#d.sections}
{d.sections.heading}
━━━━━━━━━━━━━━━━
{d.sections.rawContent}
{/d.sections}
```

## 与 Carbone 的区别

| 特性 | Carbone Cloud | 本地化版本 |
|-----|--------------|-----------|
| API 依赖 | 需要 | 不需要 |
| 网络连接 | 需要 | 不需要 |
| 费用 | 付费 (有免费额度) | 完全免费 |
| 模板存储 | 云端 | 本地文件系统 |
| 格式化器 | 丰富 | 常用格式化器 |
| 速度 | 受网络影响 | 本地快速 |

## 技术实现

### 核心库

- **docxtemplater** - 模板引擎
- **pizzip** - ZIP 文件处理
- **docx** - 内置模板生成

### API 路由

- `POST /api/template/upload` - 上传模板到本地存储
- `GET /api/templates` - 获取所有模板列表
- `POST /api/export/docx` - 使用模板导出文档

### 文件存储

模板文件存储在: `data/templates/` 目录

## 注意事项

1. **模板格式**: 必须是 .docx 格式
2. **占位符语法**: 使用 `{d.字段名}` 格式
3. **循环语法**: 使用 `{#d.array}...{/d.array}`
4. **条件判断**: 使用 `{#condition}...{/condition}`
5. **格式化器**: 使用 `{d.field:formatter()}` 格式
6. **索引**: 使用 `{@index}` 访问循环索引
7. **换行处理**: 文档中自动处理换行,无需特殊格式化器

## 故障排除

### Q: 模板上传失败
A: 确保文件是 .docx 格式,且文件大小合理

### Q: 渲染结果不正确
A: 检查占位符语法是否正确,确保字段名匹配

### Q: 格式化器不生效
A: 确保使用正确的格式化器名称和参数格式

### Q: 如何调试模板
A: 上传模板时会返回占位符列表,对照检查数据结构

## 高级用法

### 自定义格式化器

可以在 `lib/template-formatters.ts` 中添加自定义格式化器:

```typescript
export function customFormatter(str: string): string {
  // 你的逻辑
  return processedStr;
}

// 添加到 formatters 对象
export const formatters = {
  // ... 现有格式化器
  customFormatter,
};
```

### 模板验证

上传模板时会自动提取占位符,可用于验证模板的完整性。

### 批量导出

可以通过 API 路由实现批量导出多个文档。

## 更新日志

### v1.0 (2025-01-07)
- 初始版本
- 支持基本的模板渲染
- 支持常用格式化器
- 本地文件存储
