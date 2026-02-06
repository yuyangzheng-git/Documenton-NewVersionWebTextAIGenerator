import { NextRequest, NextResponse } from 'next/server';
import { Packer, TextRun, ImageRun } from 'docx';
import { WORD_TEMPLATES } from '@/lib/word-templates';
import { renderTemplate } from '@/lib/template-parser';
import { loadTemplate } from '@/lib/template-storage';
import { logger } from '@/lib/logger';
import {
  Document,
  Paragraph,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
} from 'docx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outline, blocks, documentTitle, templateId, customTemplateId, usePandoc } = body;

    if (!blocks || blocks.length === 0) {
      return NextResponse.json(
        { error: 'No content to export' },
        { status: 400 }
      );
    }

    let buffer: Buffer;

    // 优先使用 Pandoc 方案（亚信模板）
    if (usePandoc) {
      buffer = await exportWithPandoc(blocks, outline, documentTitle);
    } else if (customTemplateId) {
      // 使用上传的自定义模板
      buffer = await exportWithLocalTemplate(blocks, outline, documentTitle, customTemplateId);
    } else {
      // 使用内置模板(使用本地模板文件)
      buffer = await exportWithBuiltinTemplate(blocks, outline, documentTitle, templateId);
    }

    // 返回为 blob
    const fileName = (documentTitle || 'document').replace(/\s+/g, '_');
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}.docx"`,
      },
    });
  } catch (error) {
    logger.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * 使用内置模板导出
 */
async function exportWithBuiltinTemplate(
  blocks: any[],
  outline: any[],
  title: string,
  templateId: string
): Promise<Buffer> {
  const template = WORD_TEMPLATES.find((t) => t.id === templateId) || WORD_TEMPLATES[0];

  // 准备模板数据
  const data = prepareTemplateData(blocks, outline, title);

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 25.4mm in twips
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      headers: template.header?.text ? {
        default: new Header({
          children: [
            new Paragraph({
              text: template.header.text,
              alignment: template.header.alignment === 'left' ? AlignmentType.LEFT :
                        template.header.alignment === 'right' ? AlignmentType.RIGHT :
                        AlignmentType.CENTER,
            }),
          ],
        }),
      } : undefined,
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              text: template.footer?.text || '',
              alignment: template.footer?.alignment === 'left' ? AlignmentType.LEFT :
                        template.footer?.alignment === 'right' ? AlignmentType.RIGHT :
                        AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children: [
        // 标题
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              size: 32,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        // 日期
        new Paragraph({
          children: [
            new TextRun({
              text: data.date,
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        // 内容 - 导出标题、段落、图片和表格
        ...blocks.map(block => {
          if (block.type.startsWith('h')) {
            const level = block.type === 'h1' ? HeadingLevel.HEADING_1 :
                         block.type === 'h2' ? HeadingLevel.HEADING_2 :
                         HeadingLevel.HEADING_3;
            return new Paragraph({
              children: [
                new TextRun({
                  text: block.content,
                  bold: true,
                }),
              ],
              heading: level,
              spacing: { before: 200, after: 100 },
            });
          } else if (block.type === 'paragraph' && block.content) {
            return new Paragraph({
              children: [
                new TextRun({
                  text: block.content,
                }),
              ],
              spacing: { after: 200 },
            });
          } else if (block.type === 'image' && block.content) {
            // 图片居中导出
            let imageData: Buffer | null = null;
            let imageExt: 'jpg' | 'png' | 'gif' | 'bmp' | 'svg' = 'png';

            if (block.content.startsWith('data:image/')) {
              // Base64 图片
              const base64Data = block.content.split(',')[1];
              imageData = Buffer.from(base64Data, 'base64');
              const mimeType = block.content.split(',')[0].split(';')[0].split('/')[1];
              imageExt = (mimeType === 'jpeg' ? 'jpg' : mimeType) as 'jpg' | 'png' | 'gif' | 'bmp' | 'svg';
            } else if (block.content.startsWith('http')) {
              // URL 图片，需要获取
              // 对于 URL 图片，使用占位符或跳过
              return null;
            }

            if (imageData) {
              return new Paragraph({
                children: [
                  new ImageRun({
                    data: imageData,
                    transformation: {
                      width: 500,
                      height: 300,
                    },
                    type: imageExt as any, // 类型断言以避免 SVG fallback 要求
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              });
            }
          }
          return null;
        }).filter((block): block is any => block !== null),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

/**
 * 使用本地模板导出
 * 完全本地化,不依赖外部 API
 */
async function exportWithLocalTemplate(
  blocks: any[],
  outline: any[],
  title: string,
  templateId: string
): Promise<Buffer> {
  // 加载模板
  const templateBuffer = await loadTemplate(templateId);
  if (!templateBuffer) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // 准备数据
  const data = prepareTemplateData(blocks, outline, title);

  // 使用 docxtemplater 渲染模板
  const buffer = renderTemplate(templateBuffer, data);

  return buffer;
}

// Convert blocks to HTML string
// 导出标题、段落、图片和表格
function blocksToHtml(blocks: any[]): string {
  const result: string[] = [];

  blocks.forEach((block) => {
    // 导出标题、段落、图片和表格
    switch (block.type) {
      case 'h1':
        result.push(`<h1>${escapeHtml(block.content)}</h1>`);
        break;
      case 'h2':
        result.push(`<h2>${escapeHtml(block.content)}</h2>`);
        break;
      case 'h3':
        result.push(`<h3>${escapeHtml(block.content)}</h3>`);
        break;
      case 'paragraph':
        if (block.content && block.content.trim()) {
          result.push(`<p>${escapeHtml(block.content)}</p>`);
        }
        break;
      case 'image':
        // 导出图片（base64 或 URL）
        if (block.content) {
          result.push(`<p style="text-align: center;"><img src="${block.content}" alt="图片" /></p>`);
        }
        break;
      case 'table':
        // 导出表格
        if (block.properties?.tableData) {
          result.push(`<p style="text-align: center;">${renderTableToHtml(block.properties.tableData)}</p>`);
        } else if (block.content && block.content.includes('<table')) {
          result.push(`<p style="text-align: center;">${block.content}</p>`);
        } else if (block.content && block.content.includes('|')) {
          result.push(`<p style="text-align: center;">${markdownTableToHtml(block.content)}</p>`);
        }
        break;
      default:
        // 不导出列表、引用、代码块等其他块
        break;
    }
  });

  return result.filter(html => html).join('\n');
}

// HTML 转义
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 渲染表格数据为 HTML
// 支持两种格式：
// 1. SimpleTableBlockData: { rows: [{cells: [{content}]}], enableHeaderRow }
// 2. Legacy format: { headers: string[], rows: string[][] }
function renderTableToHtml(tableData: any): string {
  if (!tableData) return '';

  let html = '<table>';

  // 检查是否是 SimpleTableBlockData 格式（有 rows 数组，每个 row 有 cells）
  if (tableData.rows && Array.isArray(tableData.rows) && tableData.rows[0]?.cells) {
    const rows = tableData.rows;
    const enableHeaderRow = tableData.enableHeaderRow !== false; // 默认第一行是表头

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const isHeader = enableHeaderRow && i === 0;
      const tag = isHeader ? 'th' : 'td';
      const rowStyle = isHeader ? ' style="background-color: #f0f0f0;"' : '';

      html += `<tr${rowStyle}>`;
      for (const cell of row.cells || []) {
        const content = cell.content || '';
        html += `<${tag}>${escapeHtml(content)}</${tag}>`;
      }
      html += '</tr>';
    }
  }
  // Legacy format: { headers, rows }
  else if (tableData.headers && Array.isArray(tableData.headers)) {
    // 表头
    html += '<tr style="background-color: #f0f0f0;">';
    for (const header of tableData.headers) {
      html += `<th>${escapeHtml(header)}</th>`;
    }
    html += '</tr>';

    // 表体
    for (const row of tableData.rows || []) {
      html += '<tr>';
      for (const cell of row) {
        html += `<td>${escapeHtml(cell)}</td>`;
      }
      html += '</tr>';
    }
  }

  html += '</table>';
  return html;
}

// Markdown 表格转 HTML
function markdownTableToHtml(markdown: string): string {
  const lines = markdown.trim().split('\n').filter(line => line.includes('|'));
  if (lines.length < 2) return `<p>${escapeHtml(markdown)}</p>`;

  let html = '<table>';

  // 解析表头（第一行）
  const headerCells = lines[0].split('|').map(cell => cell.trim()).filter(cell => cell);
  html += '<tr style="background-color: #f0f0f0;">';
  for (const cell of headerCells) {
    html += `<th>${escapeHtml(cell)}</th>`;
  }
  html += '</tr>';

  // 跳过分隔行（第二行），解析数据行
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').map(cell => cell.trim()).filter(cell => cell);
    if (cells.length > 0) {
      html += '<tr>';
      for (const cell of cells) {
        html += `<td>${escapeHtml(cell)}</td>`;
      }
      html += '</tr>';
    }
  }

  html += '</table>';
  return html;
}

// Prepare data for template rendering
// 导出标题、段落、图片和表格
function prepareTemplateData(blocks: any[], outline: any[], title: string) {
  const date = new Date().toLocaleDateString('zh-CN');
  const year = String(new Date().getFullYear());

  // 收集标题和段落块
  const sections: Array<{
    heading: string;
    level: number;
    content: string;
    paragraphs: string[];
  }> = [];

  let currentSection: {
    heading: string;
    level: number;
    content: string;
    paragraphs: string[];
  } | null = null;

  blocks.forEach((block) => {
    if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: block.content,
        level: parseInt(block.type.replace('h', '')),
        content: '',
        paragraphs: [],
      };
    } else if (block.type === 'paragraph' || block.type === 'text') {
      if (currentSection) {
        currentSection.paragraphs.push(block.content);
        currentSection.content = (currentSection.content || '') + block.content;
      } else {
        if (!sections[0]) {
          sections.push({ heading: '', level: 1, content: '', paragraphs: [] });
        }
        sections[0].paragraphs.push(block.content);
        sections[0].content = (sections[0].content || '') + block.content;
      }
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  // 将 outline 组织为 chapters 结构
  const chapters: Array<{
    title: string;
    number: string;
    level: number;
    sections: Array<{
      subtitle: string;
      paragraphs: Array<{ text: string; index: number }>;
    }>;
  }> = [];

  let currentChapter: typeof chapters[0] | null = null;
  let currentSection2: typeof chapters[0]['sections'][0] | null = null;

  outline.forEach((item) => {
    if (item.level === 1) {
      if (currentChapter) {
        if (currentSection2) {
          currentChapter.sections.push(currentSection2);
          currentSection2 = null;
        }
        chapters.push(currentChapter);
      }
      currentChapter = {
        title: item.title,
        number: item.number || '',
        level: 1,
        sections: [],
      };
    } else if (item.level === 2) {
      if (currentChapter) {
        if (currentSection2) {
          currentChapter.sections.push(currentSection2);
        }
        currentSection2 = {
          subtitle: item.title,
          paragraphs: [],
        };
      }
    }
  });

  if (currentChapter) {
    if (currentSection2) {
      (currentChapter as any).sections.push(currentSection2);
    }
    chapters.push(currentChapter);
  }

  // 如果没有 chapters，从 sections 转换
  if (chapters.length === 0 && sections.length > 0) {
    chapters.push({
      title: title,
      number: '1',
      level: 1,
      sections: sections.map(sec => ({
        subtitle: sec.heading || '章节',
        paragraphs: sec.paragraphs.map((p, idx) => ({ text: p, index: idx })),
      })),
    });
  }

  // 创建文档信息对象
  const doc_info = {
    project_name: title,
    creation_date: date,
    year: year,
    today: new Date().toISOString().split('T')[0],
    chapter_count: chapters.length,
    total_sections: chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
    total_paragraphs: chapters.reduce((sum, ch) =>
      sum + ch.sections.reduce((s, sec) => s + sec.paragraphs.length, 0), 0
    ),
    author: '',
    version: '1.0',
  };

  const helpers = {
    first_chapter: chapters.length > 0 ? chapters[0] : null,
    last_chapter: chapters.length > 0 ? chapters[chapters.length - 1] : null,
    chapter_count: chapters.length,
  };

  return {
    d: {
      doc_info,
      title,
      date,
      year,
      today: new Date().toISOString().split('T')[0],
      chapters,
      helpers,
      sections,
      outline: outline.map((item) => ({
        number: item.number,
        title: item.title,
        level: item.level,
      })),
      htmlContent: blocksToHtml(blocks),
    },
    title,
    date,
    year,
    today: new Date().toISOString().split('T')[0],
    sections,
    chapters,
    outline: outline.map((item) => ({
      number: item.number,
      title: item.title,
      level: item.level,
    })),
    htmlContent: blocksToHtml(blocks),
  };
}

/**
 * 使用 Python + Pandoc 导出（亚信模板方案）
 *
 * 注意：Pandoc 的 --reference-doc 只使用模板的样式，不保留模板内容（如封面页）
 * 封面页由模板自带，内容直接从第二页开始
 */
async function exportWithPandoc(
  blocks: any[],
  outline: any[],
  title: string
): Promise<Buffer> {
  const { spawn } = await import('child_process');
  const { writeFile, unlink, readFile } = await import('fs/promises');
  const { tmpdir } = await import('os');
  const { join } = await import('path');

  // 1. 将 blocks 转换为 HTML
  const html = blocksToHtml(blocks);

  // 2. 生成文档标题（用于封面页）
  // 优先使用传入的标题，否则从内容中提取或生成
  let documentTitle = title;
  if (!documentTitle) {
    // 尝试从第一个 h1 标题提取
    const firstH1 = blocks.find(b => b.type === 'h1');
    if (firstH1 && firstH1.content) {
      // 如果 h1 看起来像章节标题（如"第一章 xxx"），提取主题
      const chapterMatch = firstH1.content.match(/第[一二三四五六七八九十\d]+章[：:\s]*(.+)/);
      if (chapterMatch) {
        documentTitle = chapterMatch[1].trim();
      } else {
        documentTitle = firstH1.content;
      }
    } else {
      // 从内容中提取关键词作为标题
      const allText = blocks
        .filter(b => b.type === 'paragraph' || b.type === 'h1' || b.type === 'h2')
        .map(b => b.content)
        .join(' ')
        .slice(0, 200);

      // 简单提取：取前20个字符作为标题
      documentTitle = allText.slice(0, 50).replace(/[，。！？\s]+/g, ' ').trim() || '技术方案文档';
    }
  }

  // 3. 构建 HTML - 使用中文文档标准格式
  // 注意：不添加 HTML 封面页，因为模板自带封面页
  // Pandoc 会根据 h1/h2/h3 标签自动应用模板中的 Heading 1/2/3 样式
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    /* 基础样式 - Pandoc 会将这些映射到 Word 样式 */
    body {
      font-family: "SimSun", "宋体", serif;
      font-size: 12pt;
      line-height: 1.5;
    }
    /* 段落样式 - 中文首行缩进2字符，1.5倍行距 */
    p {
      text-indent: 2em;
      line-height: 1.5;
      margin-bottom: 0.5em;
      text-align: justify;
    }
    /* 标题样式 */
    h1 { font-size: 22pt; font-weight: bold; }
    h2 { font-size: 16pt; font-weight: bold; }
    h3 { font-size: 14pt; font-weight: bold; }
    /* 表格样式 */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
    }
    th, td {
      border: 1px solid #000;
      padding: 6pt 8pt;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    /* 列表样式 */
    ul, ol {
      margin-left: 2em;
      line-height: 1.5;
    }
    li { margin-bottom: 0.3em; }
    /* 代码样式 */
    pre, code {
      font-family: "Courier New", monospace;
      font-size: 10pt;
      background-color: #f5f5f5;
    }
    pre { padding: 8pt; margin: 8pt 0; }
    /* 引用样式 */
    blockquote {
      margin-left: 2em;
      padding-left: 1em;
      border-left: 3px solid #ccc;
      color: #333;
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;

  // 4. 创建临时文件
  const tmpInput = join(tmpdir(), `docx-input-${Date.now()}.html`);
  const tmpOutput = join(tmpdir(), `docx-output-${Date.now()}.docx`);

  await writeFile(tmpInput, fullHtml, 'utf-8');

  try {
    // 5. 获取模板路径
    const templatePath = join(process.cwd(), 'public', 'templates', 'asiainfo-template.docx');

    // 6. 调用 Python CLI
    await new Promise<void>((resolve, reject) => {
      const cliPath = join(process.cwd(), 'cli.py');

      // 优先使用环境变量指定的 Python 路径，否则使用 python3
      const pythonCmd = process.env.PYTHON_PATH || 'python3';

      const python = spawn(pythonCmd, [
        cliPath,
        '--input', tmpInput,
        '--output', tmpOutput,
        '--template', templatePath,
        '--title', documentTitle
      ], {
        cwd: process.cwd(),
        env: process.env,
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
        logger.debug('[Pandoc stdout]', data.toString().trim());
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.error('[Pandoc stderr]', data.toString().trim());
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Pandoc process failed with code ${code}: ${stderr}`));
        }
      });

      python.on('error', (err) => {
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });
    });

    // 7. 读取输出文件
    const buffer = await readFile(tmpOutput);

    // 8. 清理临时文件
    await unlink(tmpInput);
    await unlink(tmpOutput);

    return buffer;
  } catch (error) {
    // 清理临时文件
    try {
      await unlink(tmpInput);
      await unlink(tmpOutput);
    } catch (cleanupError) {
      logger.error('[Pandoc] Cleanup error:', cleanupError);
    }

    throw error;
  }
}
