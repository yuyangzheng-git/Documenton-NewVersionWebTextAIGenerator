import { NextRequest, NextResponse } from 'next/server';
import { Packer } from 'docx';
import { WORD_TEMPLATES } from '@/lib/word-templates';
import { exportToDocx } from '@/lib/export-utils';
import { renderTemplate } from '@/lib/template-parser';
import { loadTemplate } from '@/lib/template-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outline, blocks, documentTitle, templateId, customTemplateId } = body;

    if (!blocks || blocks.length === 0) {
      return NextResponse.json(
        { error: 'No content to export' },
        { status: 400 }
      );
    }

    let buffer: Buffer;

    if (customTemplateId) {
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

  // 创建简单的 Word 模板
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer } = await import('docx');

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
              bold: true,
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
          text: title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        // 日期
        new Paragraph({
          text: data.date,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        // 内容
        ...blocks.map(block => {
          if (block.type.startsWith('h')) {
            const level = block.type === 'h1' ? HeadingLevel.HEADING_1 :
                         block.type === 'h2' ? HeadingLevel.HEADING_2 :
                         HeadingLevel.HEADING_3;
            return new Paragraph({
              text: block.content,
              heading: level,
              spacing: { before: 200, after: 100 },
            });
          } else if (block.content) {
            return new Paragraph({
              text: block.content,
              spacing: { after: 200 },
            });
          }
          return null;
        }).filter((block): block is Paragraph => block !== null),
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
function blocksToHtml(blocks: any[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h1':
          return `<h1>${block.content}</h1>`;
        case 'h2':
          return `<h2>${block.content}</h2>`;
        case 'h3':
          return `<h3>${block.content}</h3>`;
        case 'bullet':
          return `<ul><li>${block.content}</li></ul>`;
        case 'numbered':
          return `<ol><li>${block.content}</li></ol>`;
        case 'quote':
          return `<blockquote>${block.content}</blockquote>`;
        case 'divider':
          return '<hr>';
        case 'code':
          return `<pre><code>${block.content}</code></pre>`;
        case 'image':
          return block.content ? `<img src="${block.content}" alt="图片" />` : '';
        case 'callout':
          return `<div style="background-color: rgba(35, 131, 226, 0.08); padding: 12px 16px; border-radius: 4px; border-left: 3px solid #2383E2;">${block.content}</div>`;
        default:
          return block.content ? `<p>${block.content}</p>` : '';
      }
    })
    .join('');
}

// Prepare data for template rendering
function prepareTemplateData(blocks: any[], outline: any[], title: string) {
  const date = new Date().toLocaleDateString('zh-CN');
  const year = String(new Date().getFullYear());

  // Convert blocks to structured content with full formatting
  const sections: Array<{
    heading: string;
    level: number;
    content: string;
    paragraphs: string[];
    lists?: Array<{ type: string; items: string[] }>;
    quotes?: string[];
    rawContent?: string;  // Raw HTML content for full formatting
  }> = [];
  let currentSection: {
    heading: string;
    level: number;
    content: string;
    paragraphs: string[];
    lists?: Array<{ type: string; items: string[] }>;
    quotes?: string[];
    rawContent?: string;
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
        rawContent: '',  // Will accumulate content with full formatting
      };
    } else if (block.type === 'paragraph' || block.type === 'text') {
      if (currentSection) {
        currentSection.paragraphs.push(block.content);
        currentSection.rawContent = (currentSection.rawContent || '') + block.content;
      } else {
        if (!sections[0]) {
          sections.push({ heading: '', level: 1, content: '', paragraphs: [], rawContent: '' });
        }
        sections[0].paragraphs.push(block.content);
        sections[0].rawContent = (sections[0].rawContent || '') + block.content;
      }
    } else if (block.type === 'bullet' || block.type === 'numbered') {
      if (currentSection) {
        if (!currentSection.lists) {
          currentSection.lists = [];
        }
        currentSection.lists.push({
          type: block.type,
          items: [block.content],
        });
        // Add list item to raw content
        const listPrefix = block.type === 'bullet' ? '• ' : '1. ';
        currentSection.rawContent = (currentSection.rawContent || '') + `${listPrefix}${block.content}\n`;
      }
    } else if (block.type === 'quote') {
      if (currentSection) {
        if (!currentSection.quotes) {
          currentSection.quotes = [];
        }
        currentSection.quotes.push(block.content);
        // Add quote to raw content
        currentSection.rawContent = (currentSection.rawContent || '') + `> ${block.content}\n`;
      }
    } else if (block.type === 'image') {
      if (currentSection) {
        currentSection.rawContent = (currentSection.rawContent || '') + `[图片: ${block.content}]`;
      }
    } else if (block.type === 'code') {
      if (currentSection) {
        currentSection.rawContent = (currentSection.rawContent || '') + `\`\`\`\n${block.content}\n\`\`\``;
      }
    } else if (block.type === 'divider') {
      if (currentSection) {
        currentSection.rawContent = (currentSection.rawContent || '') + '---\n';
      }
    } else if (block.type === 'callout') {
      if (currentSection) {
        currentSection.rawContent = (currentSection.rawContent || '') + `[提示: ${block.content}]`;
      }
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    title,
    date,
    year,
    today: new Date().toISOString().split('T')[0],
    sections,
    outline: outline.map((item) => ({
      number: item.number,
      title: item.title,
      level: item.level,
    })),
    // Full content as HTML for templates that want to preserve formatting
    htmlContent: blocksToHtml(blocks),
  };
}
