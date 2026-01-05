import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertMillimetersToTwip,
  Header,
  Footer,
  BorderStyle,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WordTemplate } from './word-templates';

export async function exportToDocx(
  htmlContent: string,
  title: string,
  template: WordTemplate
) {
  try {
    // Parse HTML content and convert to paragraphs
    const children = await parseHtmlContent(htmlContent, template);

    // Create document
    const doc = new Document({
      creator: 'AI Document Generator',
      title: title,
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertMillimetersToTwip(template.margins?.top || 25.4),
                bottom: convertMillimetersToTwip(template.margins?.bottom || 25.4),
                left: convertMillimetersToTwip(template.margins?.left || 25.4),
                right: convertMillimetersToTwip(template.margins?.right || 25.4),
              },
            },
          },
          headers: createHeader(template),
          footers: createFooter(template),
          children: [
            // Document title
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: convertMillimetersToTwip(12),
              },
            }),
            ...children,
          ],
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('DOCX export error:', error);
    alert('Failed to export DOCX. Please try again.');
  }
}

// Parse HTML content and convert to docx paragraphs
async function parseHtmlContent(htmlContent: string, template: WordTemplate): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];
  const fontFamily = template.fontFamily || 'Times New Roman';
  const fontSize = template.fontSize || 12;

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Process all elements
  processElement(tempDiv, paragraphs, fontFamily, fontSize);

  return paragraphs;
}

// Process HTML elements recursively
function processElement(
  element: Element,
  paragraphs: Paragraph[],
  fontFamily: string,
  fontSize: number
): void {
  const children = Array.from(element.children);

  if (children.length === 0) {
    // Text node
    const text = element.textContent || '';
    if (text.trim()) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: text.trim(),
              font: fontFamily,
              size: convertMillimetersToTwip(fontSize * 0.35),
            }),
          ],
          spacing: {
            line: 360,
          },
        })
      );
    }
  } else {
    // Process children
    for (const child of children) {
      const tagName = child.tagName.toLowerCase();

      switch (tagName) {
        case 'h1':
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: child.textContent || '',
                  font: fontFamily,
                  size: convertMillimetersToTwip(18 * 0.35),
                  bold: true,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: convertMillimetersToTwip(4),
                after: convertMillimetersToTwip(2),
              },
            })
          );
          break;

        case 'h2':
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: child.textContent || '',
                  font: fontFamily,
                  size: convertMillimetersToTwip(16 * 0.35),
                  bold: true,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: convertMillimetersToTwip(3),
                after: convertMillimetersToTwip(1.5),
              },
            })
          );
          break;

        case 'h3':
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: child.textContent || '',
                  font: fontFamily,
                  size: convertMillimetersToTwip(14 * 0.35),
                  bold: true,
                }),
              ],
              heading: HeadingLevel.HEADING_3,
              spacing: {
                before: convertMillimetersToTwip(2),
                after: convertMillimetersToTwip(1),
              },
            })
          );
          break;

        case 'p':
          paragraphs.push(
            new Paragraph({
              children: processInlineElements(child, fontFamily, fontSize),
              spacing: {
                after: convertMillimetersToTwip(3),
              },
              alignment: AlignmentType.JUSTIFIED,
            })
          );
          break;

        case 'img':
          const img = child as HTMLImageElement;
          const src = img.src;
          let imageRun: ImageRun | null = null;

          if (src.startsWith('data:')) {
            const parts = src.split(',');
            const meta = parts[0];
            const base64Data = parts[1];
            
            // Extract image type
            const mime = meta.split(':')[1].split(';')[0];
            let extension = mime.split('/')[1];
            if (extension === 'jpeg') extension = 'jpg';
            
            const binaryString = window.atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            imageRun = new ImageRun({
              data: bytes,
              transformation: {
                width: 400,
                height: 300,
              },
              type: extension as any,
            });
          } else if (src.startsWith('http')) {
            console.warn('URL images not yet supported in export');
            break;
          }

          if (imageRun) {
            paragraphs.push(
              new Paragraph({
                children: [imageRun],
                spacing: {
                  after: convertMillimetersToTwip(3),
                },
              })
            );
          }
          break;

        case 'table':
          const rows = Array.from(child.querySelectorAll('tr'));
          const tableRows: TableRow[] = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            return new TableRow({
              children: cells.map(cell =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cell.textContent || '',
                          font: fontFamily,
                          size: convertMillimetersToTwip(fontSize * 0.35),
                          bold: cell.tagName.toLowerCase() === 'th',
                        }),
                      ],
                    }),
                  ],
                  shading: cell.tagName.toLowerCase() === 'th' ? { fill: 'F0F0F0' } : undefined,
                  verticalAlign: 'center',
                })
              ),
            });
          });

          paragraphs.push(
            new Paragraph({
              children: [new Table({
                rows: tableRows,
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
              })],
            })
          );
          break;

        case 'ul':
        case 'ol':
          const listItems = Array.from(child.querySelectorAll('li'));
          for (const li of listItems) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${tagName === 'ol' ? '•' : '•'} ${li.textContent || ''}`,
                    font: fontFamily,
                    size: convertMillimetersToTwip(fontSize * 0.35),
                  }),
                ],
                indent: {
                  left: convertMillimetersToTwip(5),
                },
                spacing: {
                  after: convertMillimetersToTwip(1),
                },
              })
            );
          }
          break;

        case 'blockquote':
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: child.textContent || '',
                  font: 'Georgia',
                  italics: true,
                  size: convertMillimetersToTwip(fontSize * 0.35 * 1.1),
                  color: '666666',
                }),
              ],
              indent: {
                left: convertMillimetersToTwip(10),
              },
              border: {
                left: {
                  color: '000000',
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              spacing: {
                after: convertMillimetersToTwip(3),
              },
            })
          );
          break;

        case 'hr':
          paragraphs.push(
            new Paragraph({
              children: [],
              border: {
                bottom: {
                  color: 'E0E0E0',
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              spacing: {
                before: convertMillimetersToTwip(2),
                after: convertMillimetersToTwip(2),
              },
            })
          );
          break;

        default:
          processElement(child, paragraphs, fontFamily, fontSize);
          break;
      }
    }
  }
}

// Process inline elements (bold, italic, etc.)
function processInlineElements(
  element: Element,
  fontFamily: string,
  fontSize: number
): TextRun[] {
  const textRuns: TextRun[] = [];

  const processNode = (node: Node, isBold = false, isItalic = false, isUnderline = false, isStrike = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        textRuns.push(
          new TextRun({
            text,
            font: fontFamily,
            size: convertMillimetersToTwip(fontSize * 0.35),
            bold: isBold,
            italics: isItalic,
            underline: isUnderline ? {} : undefined,
            strike: isStrike,
          })
        );
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();

      const newBold = isBold || tagName === 'strong' || tagName === 'b';
      const newItalic = isItalic || tagName === 'em' || tagName === 'i';
      const newUnderline = isUnderline || tagName === 'u';
      const newStrike = isStrike || tagName === 's' || tagName === 'strike';

      Array.from(el.childNodes).forEach(child => {
        processNode(child, newBold, newItalic, newUnderline, newStrike);
      });
    }
  };

  Array.from(element.childNodes).forEach(child => processNode(child));
  return textRuns;
}

// Create header based on template configuration
function createHeader(template: WordTemplate): { default: Header } | undefined {
  if (!template.header.text) return undefined;

  const alignment =
    template.header.alignment === 'left'
      ? AlignmentType.LEFT
      : template.header.alignment === 'right'
      ? AlignmentType.RIGHT
      : AlignmentType.CENTER;

  return {
    default: new Header({
      children: [
        new Paragraph({
          alignment,
          children: [
            new TextRun({
              text: template.header.text,
              bold: true,
              size: convertMillimetersToTwip(template.header.fontSize * 0.35),
              color: template.header.textColor.replace('#', ''),
            }),
          ],
          spacing: {
            after: convertMillimetersToTwip(2),
          },
        }),
      ],
    }),
  };
}

// Create footer based on template configuration
function createFooter(template: WordTemplate): { default: Footer } | undefined {
  const alignment =
    template.footer.alignment === 'left'
      ? AlignmentType.LEFT
      : template.footer.alignment === 'right'
      ? AlignmentType.RIGHT
      : AlignmentType.CENTER;

  const footerText = template.footer.text.replace('{page}', '');

  const children: TextRun[] = [
    new TextRun({
      text: footerText,
      size: convertMillimetersToTwip(template.footer.fontSize * 0.35),
      color: template.footer.textColor.replace('#', ''),
    }),
  ];

  return {
    default: new Footer({
      children: [
        new Paragraph({
          alignment,
          children,
          spacing: {
            before: convertMillimetersToTwip(2),
          },
        }),
      ],
    }),
  };
}

export async function exportToPdf(htmlContent: string, title: string) {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.padding = '20mm';
    tempDiv.style.fontFamily = 'Times New Roman, serif';
    tempDiv.style.fontSize = '12pt';
    tempDiv.style.lineHeight = '1.6';
    tempDiv.style.color = '#000000';
    tempDiv.innerHTML = `
      <h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 12pt;">${title}</h1>
      ${htmlContent}
    `;
    document.body.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    document.body.removeChild(tempDiv);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgScaledWidth = imgWidth * ratio;
    const imgScaledHeight = imgHeight * ratio;

    pdf.addImage(imgData, 'PNG', 0, 0, imgScaledWidth, imgScaledHeight);

    let heightLeft = imgHeight;
    let position = 0;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgScaledWidth, imgScaledHeight);
      heightLeft -= imgHeight;
    }

    pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export as PDF');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @media print {
            body { margin: 0; }
            @page { margin: 2cm; size: A4; }
          }
          body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            padding: 2cm;
            color: #000000;
          }
          h1 { font-size: 18pt; margin-top: 20pt; margin-bottom: 10pt; font-weight: bold; }
          h2 { font-size: 16pt; margin-top: 18pt; margin-bottom: 8pt; font-weight: bold; }
          h3 { font-size: 14pt; margin-top: 16pt; margin-bottom: 6pt; font-weight: bold; }
          p { margin-bottom: 10pt; text-align: justify; }
          table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
          th, td { border: 1px solid #000; padding: 6pt; text-align: left; }
          img { max-width: 100%; height: auto; }
          ul, ol { margin-left: 20pt; margin-bottom: 10pt; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${htmlContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
