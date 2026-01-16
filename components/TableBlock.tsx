'use client';

import { useState, useEffect } from 'react';
import { ListOrdered } from 'lucide-react';

interface TableBlockProps {
  content: string;
  onUpdate: (content: string) => void;
}

export function TableBlock({ content, onUpdate }: TableBlockProps) {
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  useEffect(() => {
    // Parse Markdown table
    const lines = content.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      setRows([]);
      setHeaders([]);
      return;
    }

    // Parse headers (first line)
    const headerLine = lines[0];
    const headerCells = headerLine.split('|').map(cell => cell.trim()).filter(cell => cell);
    setHeaders(headerCells);

    // Parse data rows (skip separator line)
    const dataRows: string[][] = [];
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('|')) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          dataRows.push(cells);
        }
      }
    }
    setRows(dataRows);
  }, [content]);

  const addRow = () => {
    const newContent = content + '\n| ' + headers.map(() => '').join(' | ') + ' |';
    onUpdate(newContent);
  };

  const addColumn = () => {
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
      if (line.includes('|')) {
        return line + ' |';
      }
      return line;
    });
    onUpdate(updatedLines.join('\n'));
  };

  const placeholderText = "输入 Markdown 格式表格，例如：\n| 姓名 | 年龄 | 城市 |\n|------|------|------|\n| 张三 | 25 | 北京 |\n| 李四 | 30 | 上海 |";

  return (
    <div style={{ flex: 1, width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        padding: '6px 10px',
        backgroundColor: 'rgba(55, 53, 47, 0.05)',
        borderRadius: '4px',
        width: 'fit-content'
      }}>
        <ListOrdered style={{ width: '16px', height: '16px', color: 'rgba(55, 53, 47, 0.5)' }} />
        <span style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'rgba(55, 53, 47, 0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          表格 {headers.length > 0 ? `(${headers.length} 列 × ${rows.length} 行)` : ''}
        </span>
      </div>

      {headers.length > 0 && (
        <div style={{
          border: '1px solid rgba(55, 53, 47, 0.15)',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            backgroundColor: 'white'
          }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(55, 53, 47, 0.05)' }}>
                {headers.map((header, index) => (
                  <th key={index} style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontWeight: 500,
                    color: 'rgba(55, 53, 47, 0.8)',
                    border: '1px solid rgba(55, 53, 47, 0.1)',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}>
                    {header || `列 ${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((_, cellIndex) => (
                    <td key={cellIndex} style={{
                      padding: '8px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.1)',
                      color: 'rgba(55, 53, 47, 0.7)',
                      minHeight: '32px'
                    }}>
                      {row[cellIndex] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button
          onClick={addRow}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '4px',
            border: '1px solid rgba(55, 53, 47, 0.2)',
            backgroundColor: 'white',
            color: 'rgba(55, 53, 47, 0.6)',
            cursor: 'pointer',
            transition: 'all 100ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          + 添加行
        </button>
        <button
          onClick={addColumn}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '4px',
            border: '1px solid rgba(55, 53, 47, 0.2)',
            backgroundColor: 'white',
            color: 'rgba(55, 53, 47, 0.6)',
            cursor: 'pointer',
            transition: 'all 100ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          + 添加列
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => onUpdate(e.target.value)}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: 'rgba(55, 53, 47, 0.02)',
          borderRadius: '6px',
          border: '1px solid rgba(55, 53, 47, 0.15)',
          fontSize: '13px',
          lineHeight: 1.6,
          color: 'rgba(55, 53, 47, 0.9)',
          outline: 'none',
          resize: 'vertical',
          minHeight: '120px',
          fontFamily: "'Courier New', Courier, monospace",
        }}
        placeholder={placeholderText}
        rows={6}
      />
      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        color: 'rgba(55, 53, 47, 0.4)',
      }}>
        💡 支持 Markdown 表格语法，使用 | 分隔列，第二行用 - 分隔表头
      </div>
    </div>
  );
}
