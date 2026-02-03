import { NextRequest, NextResponse } from 'next/server';
import { Packer, TextRun } from 'docx';
import { WORD_TEMPLATES } from '@/lib/word-templates';
import { renderTemplate } from '@/lib/template-parser';
import { loadTemplate } from '@/lib/template-storage';
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

    console.log('Export request:', {
      hasBlocks: !!blocks,
      blockCount: blocks?.length,
      hasOutline: !!outline,
      outlineCount: outline?.length,
      documentTitle,
      templateId,
      customTemplateId,
      usePandoc,
    });

    if (!blocks || blocks.length === 0) {
      console.error('No blocks to export');
      return NextResponse.json(
        { error: 'No content to export' },
        { status: 400 }
      );
    }

    let buffer: Buffer;

    // 优先使用 Pandoc 方案（亚信模板）
    if (usePandoc) {
      console.log('Using Pandoc export with AsiaInfo template');
      buffer = await exportWithPandoc(blocks, outline, documentTitle);
    } else if (customTemplateId) {
      console.log('Using custom template:', customTemplateId);
      // 使用上传的自定义模板
      buffer = await exportWithLocalTemplate(blocks, outline, documentTitle, customTemplateId);
    } else {
      console.log('Using builtin template:', templateId);
      // 使用内置模板(使用本地模板文件)
      buffer = await exportWithBuiltinTemplate(blocks, outline, documentTitle, templateId);
    }

    console.log('Export successful, buffer size:', buffer.length);

    // 返回为 blob
    const fileName = (documentTitle || 'document').replace(/\s+/g, '_');
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}.docx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
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
        // 内容 - 只导出标题，不导出用户输入的段落内容
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
          }
          // 不导出段落和其他内容块
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
// 仅导出标题结构，不导出用户编辑的内容
function blocksToHtml(blocks: any[]): string {
  const result: string[] = [];

  blocks.forEach((block) => {
    // 只导出标题块，其他内容块不导出
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
      default:
        // 不导出段落、列表、表格等其他块
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

// Prepare data for template rendering
// 仅导出标题结构，不导出用户编辑的内容
function prepareTemplateData(blocks: any[], outline: any[], title: string) {
  const date = new Date().toLocaleDateString('zh-CN');
  const year = String(new Date().getFullYear());

  // 只收集标题块
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
    }
    // 不处理其他块的内容
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  // 将 outline 组织为 chapters 结构，仅包含标题信息
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
          paragraphs: [],  // 不包含段落内容
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
        paragraphs: [],  // 不包含段落内容
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
    total_paragraphs: 0,  // 没有段落内容
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
      htmlContent: blocksToHtml(blocks),  // 仅包含标题
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
    htmlContent: blocksToHtml(blocks),  // 仅包含标题
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

  console.log('[Pandoc] Document title for cover:', documentTitle);

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

  console.log('[Pandoc] Temp input file:', tmpInput);
  console.log('[Pandoc] Temp output file:', tmpOutput);

  try {
    // 5. 获取模板路径
    const templatePath = join(process.cwd(), 'public', 'templates', 'asiainfo-template.docx');
    console.log('[Pandoc] Template path:', templatePath);

    // 6. 调用 Python CLI
    await new Promise<void>((resolve, reject) => {
      const cliPath = join(process.cwd(), 'cli.py');
      console.log('[Pandoc] CLI path:', cliPath);

      const python = spawn('python3', [
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
        console.log('[Pandoc stdout]', data.toString().trim());
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('[Pandoc stderr]', data.toString().trim());
      });

      python.on('close', (code) => {
        if (code === 0) {
          console.log('[Pandoc] Conversion successful');
          resolve();
        } else {
          console.error('[Pandoc] Conversion failed with code:', code);
          console.error('[Pandoc] stdout:', stdout);
          console.error('[Pandoc] stderr:', stderr);
          reject(new Error(`Pandoc process failed with code ${code}: ${stderr}`));
        }
      });

      python.on('error', (err) => {
        console.error('[Pandoc] Process error:', err);
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });
    });

    // 7. 读取输出文件
    const buffer = await readFile(tmpOutput);
    console.log('[Pandoc] Output buffer size:', buffer.length);

    // 8. 清理临时文件
    await unlink(tmpInput);
    await unlink(tmpOutput);
    console.log('[Pandoc] Cleaned up temp files');

    return buffer;
  } catch (error) {
    // 清理临时文件
    try {
      await unlink(tmpInput);
      await unlink(tmpOutput);
    } catch (cleanupError) {
      console.error('[Pandoc] Cleanup error:', cleanupError);
    }

    throw error;
  }
}
