import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - carbone doesn't have TypeScript definitions
import carbone from 'carbone';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { htmlContent, title, templateData, templateBase64 } = body;

    if (!htmlContent || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: htmlContent and title' },
        { status: 400 }
      );
    }

    // Parse HTML to plain text
    const content = parseHtmlToText(htmlContent);
    const date = new Date().toLocaleDateString('zh-CN');
    const year = new Date().getFullYear();

    // Template data object
    const data = {
      title,
      content,
      date,
      year,
      today: new Date().toISOString().split('T')[0],
      ...templateData,
    };

    // Prepare template buffer
    let templateBuffer: Buffer;
    if (templateBase64) {
      // Decode base64 template
      templateBuffer = Buffer.from(templateBase64, 'base64');
    } else {
      // Use default simple template
      templateBuffer = Buffer.from('', 'utf-8');
    }

    // Render template using Carbone
    const result = await new Promise<Buffer>((resolve, reject) => {
      carbone.render(
        templateBuffer,
        data,
        { language: 'zh-CN' },
        (err: any, result: Buffer) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });

    // Return as blob
    return new NextResponse(result, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title.replace(/\s+/g, '_'))}.docx"`,
      },
    });
  } catch (error) {
    console.error('Carbone export error:', error);
    return NextResponse.json(
      { error: 'Failed to export document' },
      { status: 500 }
    );
  }
}

// Parse HTML content to plain text with basic formatting
function parseHtmlToText(htmlContent: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  let text = '';

  Array.from(tempDiv.children).forEach((child) => {
    const tagName = child.tagName.toLowerCase();
    const content = child.textContent || '';

    switch (tagName) {
      case 'h1':
        text += `${content}\n`;
        break;
      case 'h2':
        text += `${content}\n`;
        break;
      case 'h3':
        text += `${content}\n`;
        break;
      case 'p':
        if (content.trim()) {
          text += `${content}\n`;
        }
        break;
      case 'ul':
      case 'ol':
        const items = Array.from(child.querySelectorAll('li'));
        items.forEach((li) => {
          text += `• ${li.textContent}\n`;
        });
        text += '\n';
        break;
      default:
        if (content.trim()) {
          text += `${content}\n`;
        }
    }
  });

  return text.trim();
}
