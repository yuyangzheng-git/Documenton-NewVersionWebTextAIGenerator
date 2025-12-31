// Mock export functions - for demonstration purposes
// In production, integrate with actual html-docx-js-typescript and jspdf

export async function exportToDocx(htmlContent: string, title: string) {
  // Add CSS styles for better DOCX formatting
  const styledHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          margin: 2cm;
        }
        h1 { font-size: 24px; margin-top: 20px; margin-bottom: 10px; }
        h2 { font-size: 20px; margin-top: 18px; margin-bottom: 8px; }
        h3 { font-size: 18px; margin-top: 16px; margin-bottom: 6px; }
        p { margin-bottom: 10px; text-align: justify; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        img { max-width: 100%; height: auto; }
        ul, ol { margin-left: 20px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${htmlContent}
    </body>
    </html>
  `;

  // Create a blob and trigger download
  const blob = new Blob([styledHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}.doc`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportToPdf(title: string) {
  // Use browser's print functionality with print styles
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export as PDF');
    return;
  }

  // Get the editor content
  const editorContent = document.querySelector('.ProseMirror')?.innerHTML || '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @media print {
          body { margin: 0; }
          @page { margin: 2cm; }
        }
        body {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          padding: 2cm;
        }
        h1 { font-size: 24px; margin-top: 20px; margin-bottom: 10px; }
        h2 { font-size: 20px; margin-top: 18px; margin-bottom: 8px; }
        h3 { font-size: 18px; margin-top: 16px; margin-bottom: 6px; }
        p { margin-bottom: 10px; text-align: justify; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        img { max-width: 100%; height: auto; }
        ul, ol { margin-left: 20px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${editorContent}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();

  // Trigger print dialog
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
