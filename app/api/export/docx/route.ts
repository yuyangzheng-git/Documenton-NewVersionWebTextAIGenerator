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
    const { outline, blocks, documentTitle, templateId, customTemplateId } = body;

    console.log('Export request:', {
      hasBlocks: !!blocks,
      blockCount: blocks?.length,
      hasOutline: !!outline,
      outlineCount: outline?.length,
      documentTitle,
      templateId,
      customTemplateId,
    });

    if (!blocks || blocks.length === 0) {
      console.error('No blocks to export');
      return NextResponse.json(
        { error: 'No content to export' },
        { status: 400 }
      );
    }

    let buffer: Buffer;

    if (customTemplateId) {
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
        // 内容
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
          } else if (block.content) {
            return new Paragraph({
              children: [
                new TextRun({
                  text: block.content,
                }),
              ],
              spacing: { after: 200 },
            });
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

  // 将 outline 组织为 chapters 结构，支持 d.chapters[i].title, d.chapters[i].sections[j].subtitle 等格式
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

  // 先按照层级组织
  outline.forEach((item) => {
    if (item.level === 1) {
      // 一级标题作为章节
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
      // 二级标题作为节
      if (currentChapter) {
        if (currentSection2) {
          currentChapter.sections.push(currentSection2);
        }
        currentSection2 = {
          subtitle: item.title,
          paragraphs: [],
        };
        // 查找该节对应的段落
        const itemBlocks = blocks.filter(b =>
          b.id.startsWith(`heading-${item.id}`) ||
          b.id.startsWith(`content-${item.id}`)
        );
        itemBlocks.forEach(block => {
          if (block.type === 'paragraph' || block.type === 'text') {
            currentSection2?.paragraphs.push({ text: block.content, index: currentSection2?.paragraphs.length || 0 });
          }
        });
      }
    }
  });

  // 添加最后一个章节
  if (currentChapter) {
    if (currentSection2) {
      (currentChapter as any).sections.push(currentSection2);
    }
    chapters.push(currentChapter);
  }

  // 如果没有 chapters，从 sections 转换
  if (chapters.length === 0 && sections.length > 0) {
    // 将 sections 映射为 chapters 格式（向后兼容）
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

  // 添加辅助变量，方便在模板中直接访问特定元素
  const helpers = {
    first_chapter: chapters.length > 0 ? chapters[0] : null,
    last_chapter: chapters.length > 0 ? chapters[chapters.length - 1] : null,
    chapter_count: chapters.length,
  };

  return {
    d: {  // 使用 d 作为根对象，支持 d.chapters[i].xxx 格式
      doc_info,
      title,
      date,
      year,
      today: new Date().toISOString().split('T')[0],
      chapters,
      helpers,
      // 保持向后兼容
      sections,
      outline: outline.map((item) => ({
        number: item.number,
        title: item.title,
        level: item.level,
      })),
      htmlContent: blocksToHtml(blocks),
    },
    // 同时提供根级别属性（向后兼容）
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
