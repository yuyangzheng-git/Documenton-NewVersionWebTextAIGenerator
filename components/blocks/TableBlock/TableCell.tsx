'use client';

import { useState, useRef, useEffect } from 'react';
import { TableCell as TableCellType } from './types';

interface TableCellProps {
  cell: TableCellType;
  isHeader?: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onUpdate: (content: string) => void;
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
  editable?: boolean;
}

export function TableCell({
  cell,
  isHeader = false,
  isEditing,
  onStartEdit,
  onEndEdit,
  onUpdate,
  onNavigate,
  editable = true
}: TableCellProps) {
  const [localContent, setLocalContent] = useState(cell.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local content when cell content changes
  useEffect(() => {
    setLocalContent(cell.content);
  }, [cell.content]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onNavigate('down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onNavigate(e.shiftKey ? 'left' : 'right');
    } else if (e.key === 'Escape') {
      onEndEdit();
    } else if (e.key === 'ArrowUp' && e.metaKey) {
      e.preventDefault();
      onNavigate('up');
    } else if (e.key === 'ArrowDown' && e.metaKey) {
      e.preventDefault();
      onNavigate('down');
    }
  };

  const handleBlur = () => {
    onUpdate(localContent);
    onEndEdit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  };

  return (
    <td
      onClick={isEditing || !editable ? undefined : onStartEdit}
      style={{
        border: '1px solid #e0e0e0',
        padding: isEditing ? '0' : '8px',
        minHeight: '36px',
        backgroundColor: isHeader ? '#F7F6F3' : 'white',
        cursor: !editable ? 'default' : isEditing ? 'text' : 'pointer',
        position: 'relative',
        verticalAlign: 'top',
        textAlign: cell.align || 'left',
        overflow: 'hidden',
        whiteSpace: 'normal',
        wordBreak: 'break-word'
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid #2383E2',
            padding: '6px',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: '14px',
            lineHeight: '1.5',
            backgroundColor: 'white',
            minHeight: '36px'
          }}
        />
      ) : (
        <div
          style={{
            minHeight: '24px',
            fontWeight: isHeader ? 600 : 400,
            color: cell.content ? 'rgba(55, 53, 47, 1)' : 'rgba(55, 53, 47, 0.3)',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: '1.5'
          }}
        >
          {cell.content || '\u00A0'}
        </div>
      )}
    </td>
  );
}
