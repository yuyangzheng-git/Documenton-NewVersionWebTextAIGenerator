# 企业模板导出方案详细对比

**模板文件**: `/Users/2812019221qq.com/Desktop/newtemplate.docx`
**公司**: 亚信科技（成都）有限公司
**复杂度**: 高（4套页眉页脚 + 3张图片 + 目录）

---

## 方案 A：docxtemplater（纯 TypeScript 方案）

### 📋 方案概述

使用 `docxtemplater` 库直接在 .docx 模板中插入数据，完全保留模板的所有格式。

**核心原理**:
```
亚信模板.docx (含页眉页脚图片样式)
      ↓
添加占位符 {d.title} {d.chapters[i].title}
      ↓
docxtemplater 填充数据
      ↓
输出.docx (完美保留所有格式)
```

---

### 🔧 技术实现

#### 1. 当前状态

**代码已存在**: `app/api/export/docx/route.ts:183-202`

```typescript
async function exportWithLocalTemplate(
  blocks: any[],
  outline: any[],
  title: string,
  templateId: string
): Promise<Buffer> {
  // 加载模板
  const templateBuffer = await loadTemplate(templateId);

  // 准备数据
  const data = prepareTemplateData(blocks, outline, title);

  // 使用 docxtemplater 渲染模板
  const buffer = renderTemplate(templateBuffer, data);

  return buffer;
}
```

**模板解析器**: `lib/template-parser.ts`
```typescript
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export function renderTemplate(
  templateBuffer: Buffer,
  data: TemplateData
): Buffer {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(data);

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}
```

---

#### 2. 需要做的修改

##### 步骤 1: 复制模板到项目

```bash
# 创建模板目录
mkdir -p public/templates

# 复制亚信模板
cp /Users/2812019221qq.com/Desktop/newtemplate.docx \
   public/templates/asiainfo-template.docx
```

##### 步骤 2: 在模板中添加占位符

在 Word 中打开 `newtemplate.docx`，添加占位符：

**文档标题位置**:
```
{d.title}
```

**日期位置**:
```
{d.date}
```

**章节循环**:
```
{#d.chapters}
{title}

{#sections}
{subtitle}

{#paragraphs}
{text}

{/paragraphs}
{/sections}
{/d.chapters}
```

**占位符语法说明**:
- `{d.title}` - 简单变量
- `{#d.chapters}...{/d.chapters}` - 数组循环
- `{d.chapters[0].title}` - 访问特定元素

##### 步骤 3: 修改代码启用该方案

**文件**: `app/word-editor/page.tsx`

修改导出函数：

```typescript
// 当前代码 (第 569 行左右)
const response = await fetch('/api/export/docx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    outline,
    blocks,
    documentTitle,
    templateId: 'simple-white',  // ← 改这里
    customTemplateId: null,
  }),
});

// 修改为
const response = await fetch('/api/export/docx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    outline,
    blocks,
    documentTitle,
    templateId: null,                    // ← 不使用内置模板
    customTemplateId: 'asiainfo-template',  // ← 使用亚信模板
  }),
});
```

**文件**: `lib/template-storage.ts`

修改模板加载函数：

```typescript
export async function loadTemplate(templateId: string): Promise<Buffer | null> {
  try {
    // 优先从本地文件系统加载（服务端）
    if (typeof window === 'undefined') {
      const fs = await import('fs');
      const path = await import('path');

      // 检查 public/templates 目录
      const templatePath = path.join(process.cwd(), 'public', 'templates', `${templateId}.docx`);

      if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath);
      }
    }

    // 其他逻辑...（从 IndexedDB 加载等）
  } catch (error) {
    console.error('Load template error:', error);
    return null;
  }
}
```

---

#### 3. 数据结构

**当前已实现的数据结构** (`app/api/export/docx/route.ts:236-460`):

```typescript
{
  d: {
    title: "AI XDR 详细方案",
    date: "2026-01-29",
    year: "2026",

    doc_info: {
      project_name: "AI XDR 详细方案",
      creation_date: "2026-01-29",
      author: "亚信科技",
      version: "1.0",
      chapter_count: 5,
      total_sections: 12,
      total_paragraphs: 45
    },

    chapters: [
      {
        title: "第一章：项目背景",
        number: "1",
        level: 1,
        sections: [
          {
            subtitle: "1.1 行业现状",
            paragraphs: [
              { text: "段落内容...", index: 0 },
              { text: "段落内容...", index: 1 }
            ]
          },
          {
            subtitle: "1.2 技术趋势",
            paragraphs: [...]
          }
        ]
      },
      {
        title: "第二章：技术方案",
        // ...
      }
    ],

    // 向后兼容
    sections: [...],
    outline: [...]
  }
}
```

---

### 📝 模板占位符示例

#### 完整的亚信模板示例

```
┌─────────────────────────────────────────────────────────┐
│ [公司Logo]        亚信科技（成都）有限公司          [装饰图] │  ← 页眉（保留原有图片和样式）
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    {d.title}                           │  ← 文档标题
│                                                         │
│                  {d.date}                              │  ← 日期
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                         │
│ 目录                                                     │  ← 预设目录（需要在Word中更新）
│   第一章 ................................. 3             │
│   第二章 ................................. 8             │
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                         │
│ {#d.chapters}                                          │  ← 章节循环开始
│                                                         │
│ {title}                                                │  ← 章节标题
│                                                         │
│   {#sections}                                          │  ← 小节循环开始
│   {subtitle}                                           │  ← 小节标题
│                                                         │
│     {#paragraphs}                                      │  ← 段落循环开始
│     {text}                                             │  ← 段落内容
│                                                         │
│     {/paragraphs}                                      │  ← 段落循环结束
│   {/sections}                                          │  ← 小节循环结束
│                                                         │
│ {/d.chapters}                                          │  ← 章节循环结束
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [装饰图]  文档编号: {d.doc_info.version}  第 [页码] 页    │  ← 页脚（保留原有图片和样式）
└─────────────────────────────────────────────────────────┘
```

---

### ✅ 优势

1. **完美保留格式**
   - ✅ 页眉页脚的所有图片、样式、颜色
   - ✅ 字体、行距、段落间距
   - ✅ 公司 logo、装饰图
   - ✅ 多套页眉页脚（首页、奇偶页）

2. **技术优势**
   - ✅ 纯 TypeScript，无需 Python 环境
   - ✅ 代码已实现 90%，改动最小
   - ✅ 部署简单，无依赖
   - ✅ 性能好（本地处理）

3. **灵活性**
   - ✅ 可以随时更换模板
   - ✅ 支持复杂数据结构（嵌套循环、条件判断）
   - ✅ 模板可视化编辑（在 Word 中修改）

---

### ⚠️ 局限性

1. **目录更新**
   - ⚠️ 目录需要在 Word 中手动更新（右键 → 更新域，或按 F9）
   - ⚠️ 不能自动生成目录页码
   - **影响**: 用户需要额外操作一步

2. **复杂格式限制**
   - ⚠️ 不支持自动插入分页符（需要在模板中预设）
   - ⚠️ 表格需要在模板中预设样式
   - **影响**: 模板制作稍复杂

---

### 📊 实施时间

| 步骤 | 时间 | 难度 |
|-----|------|------|
| 复制模板到项目 | 1 分钟 | ⭐ |
| 在模板中添加占位符 | 10-20 分钟 | ⭐⭐ |
| 修改代码 | 5 分钟 | ⭐ |
| 测试验证 | 10 分钟 | ⭐⭐ |
| **总计** | **约 30 分钟** | **⭐⭐** |

---

### 🎯 适用场景

✅ **推荐使用，如果**:
- 用户可以接受在 Word 中按 F9 更新目录
- 页眉页脚包含公司 logo/图片
- 需要快速部署
- 不想配置 Python 环境

❌ **不推荐，如果**:
- 必须自动生成目录页码
- 需要复杂的格式转换（如 HTML → Word）

---

## 方案 B：Python + Pandoc（行业标准方案）

### 📋 方案概述

使用 Pandoc（行业标准文档转换工具）和 Python，支持自动生成目录。

**核心原理**:
```
Blocks → Markdown
      ↓
Python CLI
      ↓
Pandoc (--reference-doc=亚信模板.docx --toc)
      ↓
输出.docx (完美格式 + 自动目录)
```

---

### 🔧 技术实现

#### 1. 当前状态

**代码已存在但未启用**:
- `cli.py` - Python 命令行接口
- `document_generator.py` - Pandoc 封装

```python
# document_generator.py (已完整实现)
class DocumentGenerator:
    def html_to_docx(
        self,
        html_content: str,
        output_path: str,
        toc_depth: int = 3
    ) -> str:
        # 处理 Base64 图片
        processed_html, temp_files = self._extract_and_save_base64_images(html_content)

        # 使用 Pandoc 转换
        output_file = pypandoc.convert_text(
            source=processed_html,
            to='docx',
            format='html',
            output_file=output_path,
            extra_args=[
                f'--reference-doc={self.template_path}',  # 使用亚信模板
                '--toc',                                   # 自动生成目录
                f'--toc-depth={toc_depth}'                # 目录层级
            ]
        )

        return output_file
```

---

#### 2. 需要做的修改

##### 步骤 1: 安装依赖

```bash
# 安装 Pandoc (macOS)
brew install pandoc

# 或下载安装包
# https://github.com/jgm/pandoc/releases

# 安装 Python 依赖
pip3 install pypandoc
```

**验证安装**:
```bash
pandoc --version
# 应输出: pandoc 3.x.x
```

##### 步骤 2: 修改 API 路由

**文件**: `app/api/export/docx/route.ts`

添加 Python 调用函数：

```typescript
import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * 使用 Python + Pandoc 导出
 */
async function exportWithPandoc(
  blocks: any[],
  outline: any[],
  title: string,
  templatePath: string
): Promise<Buffer> {
  // 1. 将 blocks 转换为 HTML
  const html = blocksToHtml(blocks);
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
    </head>
    <body>
      <h1>${title}</h1>
      ${html}
    </body>
    </html>
  `;

  // 2. 创建临时文件
  const tmpInput = join(tmpdir(), `input-${Date.now()}.html`);
  const tmpOutput = join(tmpdir(), `output-${Date.now()}.docx`);

  await writeFile(tmpInput, fullHtml, 'utf-8');

  try {
    // 3. 调用 Python CLI
    await new Promise<void>((resolve, reject) => {
      const python = spawn('python3', [
        join(process.cwd(), 'cli.py'),
        '--input', tmpInput,
        '--output', tmpOutput,
        '--template', templatePath,
        '--toc-depth', '3'
      ]);

      let stderr = '';
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python process failed: ${stderr}`));
        }
      });
    });

    // 4. 读取输出文件
    const buffer = await readFile(tmpOutput);

    // 5. 清理临时文件
    await unlink(tmpInput);
    await unlink(tmpOutput);

    return buffer;
  } catch (error) {
    // 清理临时文件
    try {
      await unlink(tmpInput);
      await unlink(tmpOutput);
    } catch {}

    throw error;
  }
}
```

##### 步骤 3: 修改路由入口

**文件**: `app/api/export/docx/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const { outline, blocks, documentTitle, useAsiaInfoTemplate } = await request.json();

    let buffer: Buffer;

    if (useAsiaInfoTemplate) {
      // 使用亚信模板 + Pandoc
      const templatePath = join(process.cwd(), 'public', 'templates', 'asiainfo-template.docx');
      buffer = await exportWithPandoc(blocks, outline, documentTitle, templatePath);
    } else {
      // 使用内置模板 + docx 库
      buffer = await exportWithBuiltinTemplate(blocks, outline, documentTitle, 'simple-white');
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(documentTitle)}.docx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### ✅ 优势

1. **完整的格式支持**
   - ✅ 完美保留模板所有格式
   - ✅ **自动生成目录**（包括页码）
   - ✅ 自动处理分页
   - ✅ 支持复杂表格

2. **行业标准**
   - ✅ Pandoc 是文档转换的事实标准
   - ✅ 被学术界、出版业广泛使用
   - ✅ 功能强大，扩展性好

3. **目录处理**
   - ✅ **自动生成目录**，无需手动更新
   - ✅ 自动计算页码
   - ✅ 支持多级目录

---

### ⚠️ 局限性

1. **部署复杂度**
   - ⚠️ 需要安装 Pandoc（约 100MB）
   - ⚠️ 需要 Python 3.x 环境
   - ⚠️ 需要 pypandoc 库
   - **影响**: 部署环境配置稍复杂

2. **性能**
   - ⚠️ 需要启动 Python 进程
   - ⚠️ 需要创建临时文件
   - **影响**: 导出速度稍慢（约 +500ms）

3. **跨平台**
   - ⚠️ Windows/Linux/macOS 需要分别配置 Pandoc
   - **影响**: CI/CD 配置稍复杂

---

### 📊 实施时间

| 步骤 | 时间 | 难度 |
|-----|------|------|
| 安装 Pandoc | 5 分钟 | ⭐ |
| 安装 Python 依赖 | 2 分钟 | ⭐ |
| 修改 API 路由 | 15 分钟 | ⭐⭐⭐ |
| 复制模板到项目 | 1 分钟 | ⭐ |
| 测试验证 | 10 分钟 | ⭐⭐ |
| **总计** | **约 35 分钟** | **⭐⭐⭐** |

---

### 🎯 适用场景

✅ **推荐使用，如果**:
- **必须自动生成目录**（无需手动更新）
- 需要复杂的格式转换
- 服务器环境可以安装 Python
- 追求完美的导出质量

❌ **不推荐，如果**:
- 无法安装 Python/Pandoc（如某些受限环境）
- 追求极致部署简单
- 不需要自动目录

---

## 对比总结

### 功能对比

| 功能 | docxtemplater | Python + Pandoc |
|-----|---------------|-----------------|
| 保留页眉页脚 | ✅ 完美 | ✅ 完美 |
| 保留图片 | ✅ 完美 | ✅ 完美 |
| 保留样式 | ✅ 完美 | ✅ 完美 |
| 自动生成目录 | ❌ 需手动更新 | ✅ 自动生成 |
| 目录页码 | ❌ 需手动更新 | ✅ 自动计算 |
| 复杂表格 | ⚠️ 需预设 | ✅ 自动处理 |
| 分页控制 | ⚠️ 需预设 | ✅ 自动处理 |

---

### 技术对比

| 维度 | docxtemplater | Python + Pandoc |
|-----|---------------|-----------------|
| 语言 | 纯 TypeScript | TypeScript + Python |
| 依赖 | npm 包 | Pandoc + pypandoc |
| 代码改动 | 最小（5 分钟） | 中等（15 分钟） |
| 部署复杂度 | ⭐ 简单 | ⭐⭐⭐ 复杂 |
| 性能 | ⭐⭐⭐ 快 | ⭐⭐ 较快 |
| 维护成本 | ⭐ 低 | ⭐⭐ 中等 |

---

### 成本对比

| 成本维度 | docxtemplater | Python + Pandoc |
|---------|---------------|-----------------|
| 开发时间 | 30 分钟 | 35 分钟 |
| 部署时间 | 5 分钟 | 20 分钟 |
| 模板制作 | 10-20 分钟（添加占位符） | 5 分钟（原样使用） |
| 用户培训 | 需说明按 F9 更新目录 | 无需培训 |
| 维护成本 | 低（纯 TS） | 中（需维护 Python 环境） |

---

## 实际效果对比

### docxtemplater 方案

**导出流程**:
```
1. 点击"导出" → 下载 .docx
2. 打开 Word → 页眉页脚完美 ✅
3. 内容填充完美 ✅
4. 目录显示：
   第一章 .................. 错误!未定义书签。
   第二章 .................. 错误!未定义书签。
5. 用户操作：右键目录 → "更新域" → "更新整个目录"
6. 目录更新完成：
   第一章 .................. 3
   第二章 .................. 8
```

**用户体验**: ⭐⭐⭐⭐ (需要一步额外操作)

---

### Python + Pandoc 方案

**导出流程**:
```
1. 点击"导出" → 下载 .docx
2. 打开 Word → 页眉页脚完美 ✅
3. 内容填充完美 ✅
4. 目录自动生成：
   第一章 .................. 3
   第二章 .................. 8
5. 无需任何操作
```

**用户体验**: ⭐⭐⭐⭐⭐ (完美)

---

## 💡 最终建议

### 决策流程图

```
是否可以接受用户在 Word 中按 F9 更新目录？
       │
       ├─ 是 → 使用 docxtemplater 方案
       │      ✅ 部署简单
       │      ✅ 维护成本低
       │      ✅ 纯 TypeScript
       │
       └─ 否 → 使用 Python + Pandoc 方案
              ✅ 自动目录
              ✅ 完美体验
              ⚠️ 需要配置环境
```

---

### 我的推荐

**第一选择：docxtemplater**

理由：
1. 改动最小，30 分钟完成
2. 部署简单，无需 Python
3. 用户按 F9 更新目录是 Word 的常规操作，不算复杂

**如果必须自动目录，再选 Pandoc**

理由：
1. 配置环境需要一定时间
2. 维护成本稍高
3. 但效果完美

---

## 🚀 下一步

请告诉我：

1. **你的选择**：A（docxtemplater）还是 B（Pandoc）？

2. **关键问题**：用户是否可以接受在 Word 中按 F9 更新目录？
   - 这是 Word 的标准操作
   - 只需做一次，后续修改内容不影响目录

3. **部署环境**：是否可以安装 Python + Pandoc？

回答后，我会立即帮你实施选定的方案，包括：
- 完整的代码修改
- 模板占位符添加指南（如果选 A）
- 环境配置脚本（如果选 B）
- 测试验证步骤

---

**报告生成时间**: 2026-01-29
**模板文件**: newtemplate.docx (亚信科技)
**当前推荐**: docxtemplater 方案（改动最小）
