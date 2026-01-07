import { NextRequest, NextResponse } from 'next/server';
import { Packer } from 'docx';
import { WORD_TEMPLATES } from '@/lib/word-templates';
import { exportToDocx } from '@/lib/export-utils';

// Carbone API configuration
const CARBONE_API_URL = 'https://api.carbone.io';
const CARBONE_API_TOKEN = process.env.CARBONE_API_TOKEN || 'test_YOUR_TOKEN_HERE';

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

    if (customTemplateId && CARBONE_API_TOKEN !== 'test_YOUR_TOKEN_HERE') {
      // Use Carbone API with custom template
      buffer = await exportWithCarboneApi(blocks, outline, documentTitle, customTemplateId);
    } else {
      // Use docx library for built-in templates
      const htmlContent = blocksToHtml(blocks);
      const template = WORD_TEMPLATES.find((t) => t.id === templateId) || WORD_TEMPLATES[0];
      const doc = await exportToDocx(htmlContent, documentTitle || '文档', template);
      buffer = await Packer.toBuffer(doc);
    }

    // Return as blob
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

// Export using Carbone API
async function exportWithCarboneApi(
  blocks: any[],
  outline: any[],
  title: string,
  templateId: string
): Promise<Buffer> {
  // Prepare data for template rendering
  const data = prepareCarboneData(blocks, outline, title);

  // Render report using Carbone API
  const response = await fetch(`${CARBONE_API_URL}/render/${templateId}`, {
    method: 'POST',
    headers: {
      'carbone-version': '4',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CARBONE_API_TOKEN}`,
    },
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Carbone render error:', errorText);
    throw new Error(`Carbone API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error('Carbone API returned error');
  }

  const renderId = result.data.renderId;

  // Download the rendered document
  const downloadResponse = await fetch(`${CARBONE_API_URL}/render/${renderId}`, {
    method: 'GET',
    headers: {
      'carbone-version': '4',
    },
  });

  if (!downloadResponse.ok) {
    throw new Error('Failed to download rendered document');
  }

  const arrayBuffer = await downloadResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
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

// Prepare data for Carbone template rendering
function prepareCarboneData(blocks: any[], outline: any[], title: string) {
  const date = new Date().toLocaleDateString('zh-CN');
  const year = new Date().getFullYear();

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
