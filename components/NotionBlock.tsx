'use client';

import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { ChevronDown, ChevronUp, Check, Plus, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import {
  Type,
  Code2,
  List,
  ListOrdered,
  Quote,
  Minus,
  Image as ImageIcon,
  GripVertical,
  CheckCircle2,
  Copy,
  Lightbulb,
  Sparkles,
  Upload,
  Table as TableIcon,
} from 'lucide-react';
import { SimpleTableBlock, type SimpleTableBlockData } from '@/components/blocks';
import { logger } from '@/lib/logger';

// Lazy load StreamingMarkdownRenderer to avoid circular dependencies
const StreamingMarkdownRenderer = lazy(() => import('@/components/StreamingMarkdownRenderer').then(m => ({ default: m.StreamingMarkdownRenderer })));

export type BlockType =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet'
  | 'numbered'
  | 'todo'
  | 'code'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'image'
  | 'table'
  | 'guide';

export interface NotionBlock {
  id: string;
  type: BlockType;
  content: string;
  properties: Record<string, unknown>;
  children: NotionBlock[];
}

interface NotionBlockProps {
  block: NotionBlock;
  editable?: boolean;
  onUpdate: (id: string, updates: Partial<NotionBlock>) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string | null, type: BlockType, initialContent?: string, insertBefore?: boolean) => string | undefined;
  onFocusNext?: () => void;
  onGenerate?: (blockId: string) => void;
  generatingIds?: Set<string>;
  allBlocks?: NotionBlock[];
}

const BLOCK_ICONS: Record<BlockType, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  paragraph: Type,
  h1: Type,
  h2: Type,
  h3: Type,
  bullet: List,
  numbered: ListOrdered,
  todo: CheckCircle2,
  code: Code2,
  quote: Quote,
  divider: Minus,
  callout: Type,
  image: ImageIcon,
  table: TableIcon,
  guide: Lightbulb,
};

// Helper function to generate empty 3x3 table HTML
function generateEmptyTable(): string {
  let html = '<table style="border-collapse: collapse; width: 100%; border: 1px solid #e0e0e0;">';
  for (let i = 0; i < 3; i++) {
    html += '<tr>';
    for (let j = 0; j < 3; j++) {
      html += `<td style="border: 1px solid #e0e0e0; padding: 8px; min-width: 80px; height: 40px; vertical-align: top;"></td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
}

// Helper function to parse table HTML and manipulate rows/cols
function addTableRow(html: string): string {
  const tbodyMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/);
  if (!tbodyMatch) return html;

  const tableContent = tbodyMatch[1];
  const trCount = (tableContent.match(/<tr>/g) || []).length;
  const tdCount = tableContent.match(/<td>/g)?.length || 3;

  let newTr = '<tr>';
  for (let i = 0; i < Math.floor(tdCount / trCount); i++) {
    newTr += `<td style="border: 1px solid #e0e0e0; padding: 8px; min-width: 80px; height: 40px; vertical-align: top;"></td>`;
  }
  newTr += '</tr>';

  return html.replace(/<\/table>/, `${newTr}</table>`);
}

function removeTableRow(html: string): string {
  const tbodyMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/);
  if (!tbodyMatch) return html;

  const tableContent = tbodyMatch[1];
  const trMatches = tableContent.match(/<tr>[\s\S]*?<\/tr>/g);

  if (!trMatches || trMatches.length <= 1) return html;

  // Remove last row
  const newTableContent = tableContent.replace(/<tr>[\s\S]*?<\/tr>$/, '');

  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/, `<table style="border-collapse: collapse; width: 100%; border: 1px solid #e0e0e0;">${newTableContent}</table>`);
}

function addTableColumn(html: string): string {
  const tbodyMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/);
  if (!tbodyMatch) return html;

  const tableContent = tbodyMatch[1];
  // Add a td to each tr
  const newTableContent = tableContent.replace(/<\/tr>/g, `<td style="border: 1px solid #e0e0e0; padding: 8px; min-width: 80px; height: 40px; vertical-align: top;"></td></tr>`);

  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/, `<table style="border-collapse: collapse; width: 100%; border: 1px solid #e0e0e0;">${newTableContent}</table>`);
}

function removeTableColumn(html: string): string {
  const tbodyMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/);
  if (!tbodyMatch) return html;

  const tableContent = tbodyMatch[1];
  const trMatches = tableContent.match(/<tr>[\s\S]*?<\/tr>/g);

  if (!trMatches || trMatches.length === 0) return html;

  // Check if each row has at least 2 cells
  for (const tr of trMatches) {
    const cellCount = (tr.match(/<td[^>]*>/g) || []).length;
    if (cellCount <= 1) return html;
  }

  // Remove last cell from each tr
  const newTableContent = tableContent.replace(/<td[^>]*>[\s\S]*?<\/td><\/tr>/g, '</tr>');

  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/, `<table style="border-collapse: collapse; width: 100%; border: 1px solid #e0e0e0;">${newTableContent}</table>`);
}

// Table control button component
function TableControlButton({
  onClick,
  icon,
  title,
  position,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  position: 'top-right' | 'bottom-right';
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        position: 'absolute',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: '#2383E2',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        zIndex: 10,
        ...(position === 'top-right' ? {
          top: '-4px',
          right: '-4px',
        } : {
          bottom: '-4px',
          right: '-4px',
        }),
      }}
    >
      {icon}
    </button>
  );
}

const BLOCK_TYPES = [
  { type: 'paragraph' as BlockType, label: '文本' },
  { type: 'h1' as BlockType, label: '标题 1' },
  { type: 'h2' as BlockType, label: '标题 2' },
  { type: 'h3' as BlockType, label: '标题 3' },
  { type: 'bullet' as BlockType, label: '无序列表' },
  { type: 'numbered' as BlockType, label: '有序列表' },
  { type: 'todo' as BlockType, label: '待办事项' },
  { type: 'code' as BlockType, label: '代码' },
  { type: 'quote' as BlockType, label: '引用' },
  { type: 'table' as BlockType, label: '表格' },
  { type: 'image' as BlockType, label: '图片' },
];

export function NotionBlock({ block, editable = true, onUpdate, onDelete, onAdd, onGenerate, generatingIds, allBlocks }: NotionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [editContent, setEditContent] = useState(block.content);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const autoResize = () => {
    const textarea = editorRef.current;
    if (textarea && textarea.tagName === 'TEXTAREA') {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    autoResize();
  }, [editContent]);

  // Update local content when block content or type changes from parent
  useEffect(() => {
    setEditContent(block.content);
  }, [block.content, block.type]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setShowSlashMenu(false);
      }
    };

    if (showSlashMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSlashMenu]);

  // Handle block selection and Backspace to delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if block is selected and Backspace is pressed
      if (e.key === 'Backspace' && isSelected && !e.shiftKey) {
        // Don't delete if the user is typing in an editable element
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );

        // For table and image blocks, allow deletion
        if ((block.type === 'table' || block.type === 'image') && isSelected && !isTyping) {
          e.preventDefault();
          if (confirm(`确定要删除这个${block.type === 'table' ? '表格' : '图片'}块吗？`)) {
            onDelete(block.id);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelected, block.type, onDelete]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    logger.log('handleKeyDown START:', {
      key: e.key,
      code: e.code,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      type: block.type,
      blockId: block.id
    });

    // Enter creates a new block (Notion-style)
    if (e.key === 'Enter' && !e.shiftKey) {
      logger.log('Enter detected, preventing default');
      e.preventDefault();
      e.stopPropagation(); // Ensure event doesn't bubble

      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart;
      const isAtEnd = cursorPosition === editContent.length;

      // 判断是否在块的最后
      if (isAtEnd) {
        // 在块的最后回车：新建同类型空块，光标放在新块中
        const newBlockType: BlockType = block.type;

        // No default content for new blocks
        let initialContent: string | undefined = undefined;

        // Add new block and get its ID
        logger.log('About to call onAdd (at end of block):', {
          onAddExists: !!onAdd,
          newBlockType,
          initialContent,
          blockId: block.id
        });
        const newBlockId = onAdd ? onAdd(block.id, newBlockType, initialContent) : undefined;
        logger.log('onAdd result:', { newBlockId });

        // Focus the new block after it's created
        if (newBlockId) {
          // Use multiple attempts to find and focus the new block
          const focusNewBlock = (attempts = 0) => {
            const newBlockElement = document.querySelector(`[data-block-id="${newBlockId}"] textarea`) as HTMLTextAreaElement;
            if (newBlockElement) {
              newBlockElement.focus();

              // 光标始终放在新块的开头（标准文本编辑器行为）
              newBlockElement.setSelectionRange(0, 0);

              // Trigger auto-resize
              const resizeEvent = new Event('input', { bubbles: true });
              newBlockElement.dispatchEvent(resizeEvent);
            } else if (attempts < 10) {
              // Retry with a longer delay
              setTimeout(() => focusNewBlock(attempts + 1), (attempts + 1) * 50);
            }
          };

          setTimeout(() => focusNewBlock(0), 50);
        }
      } else {
        // 在块中间回车：分割内容
        const beforeCursor = editContent.slice(0, cursorPosition);
        const afterCursor = editContent.slice(cursorPosition);

        // Update local state first to immediately show the change
        setEditContent(beforeCursor);

        // Then update the parent state
        logger.log('NotionBlock handleKeyDown onUpdate (current block):', { blockId: block.id, content: beforeCursor });
        onUpdate(block.id, { content: beforeCursor });

        // Create a new block with the same type as current block
        const newBlockType: BlockType = block.type;

        // Use content after cursor as initial content
        let initialContent: string | undefined = afterCursor;

        // Add new block with content after cursor and get its ID
        logger.log('About to call onAdd (middle of block):', {
          onAddExists: !!onAdd,
          newBlockType,
          initialContent,
          afterCursor,
          blockId: block.id
        });
        const newBlockId = onAdd ? onAdd(block.id, newBlockType, initialContent) : undefined;
        logger.log('onAdd result:', { newBlockId });

        // Focus the new block after it's created
        if (newBlockId) {
          // Use multiple attempts to find and focus the new block
          const focusNewBlock = (attempts = 0) => {
            const newBlockElement = document.querySelector(`[data-block-id="${newBlockId}"] textarea`) as HTMLTextAreaElement;
            if (newBlockElement) {
              newBlockElement.focus();

              // 光标始终放在新块的开头（标准文本编辑器行为）
              newBlockElement.setSelectionRange(0, 0);

              // Trigger auto-resize
              const resizeEvent = new Event('input', { bubbles: true });
              newBlockElement.dispatchEvent(resizeEvent);
            } else if (attempts < 10) {
              // Retry with a longer delay
              setTimeout(() => focusNewBlock(attempts + 1), (attempts + 1) * 50);
            }
          };

          setTimeout(() => focusNewBlock(0), 50);
        }
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Shift+Enter - insert newline in current block (for multi-line content)
      // Let the textarea handle the newline naturally
      setTimeout(() => autoResize(), 0);
    } else if (e.key === 'Backspace' && !editContent && !isDragging) {
      // Block is empty, delete it and move cursor to end of previous block
      e.preventDefault();

      // Find the index of current block by looking for its data attribute
      const allBlocks = Array.from(document.querySelectorAll('[data-block-id]'));
      const currentIndex = allBlocks.findIndex(el => el.getAttribute('data-block-id') === block.id);

      // Delete current block
      onDelete(block.id);

      // Focus the previous block if it exists
      if (currentIndex > 0) {
        const previousBlockElement = allBlocks[currentIndex - 1];
        const prevTextarea = previousBlockElement?.querySelector('textarea');

        if (prevTextarea) {
          setTimeout(() => {
            prevTextarea.focus();
            // Move cursor to the end of previous block
            const contentLength = prevTextarea.value.length;
            prevTextarea.setSelectionRange(contentLength, contentLength);
          }, 50);
        }
      }
    } else if (e.key === 'Backspace' && e.currentTarget.selectionStart === 0 && !isDragging) {
      // Cursor at the beginning of the block, merge with previous block
      e.preventDefault();

      // Find the index of current block by looking for its data attribute
      const allBlocks = Array.from(document.querySelectorAll('[data-block-id]'));
      const currentIndex = allBlocks.findIndex(el => el.getAttribute('data-block-id') === block.id);

      if (currentIndex > 0) {
        const previousBlockElement = allBlocks[currentIndex - 1];
        const previousBlockId = previousBlockElement?.getAttribute('data-block-id');

        if (previousBlockId) {
          // Get the previous textarea and its content BEFORE deleting the current block
          const prevTextarea = previousBlockElement.querySelector('textarea');
          if (!prevTextarea) {
            return;
          }

          // Save the previous content length BEFORE any updates
          const prevContentLength = prevTextarea.value.length;

          // Get the content to merge (current block content)
          const currentContent = editContent || block.content;

          // Delete current block
          onDelete(block.id);

          // Update the previous block content
          const prevContent = prevTextarea.value;
          const mergedContent = prevContent + currentContent;
          onUpdate(previousBlockId, { content: mergedContent });

          // Focus the previous block and set cursor between the two merged contents
          setTimeout(() => {
            prevTextarea.focus();
            setTimeout(() => {
              // Position cursor right after the previous block's content
              prevTextarea.setSelectionRange(prevContentLength, prevContentLength);
            }, 0);
          }, 50);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
    } else if (e.key === '/') {
      // Only show menu if it's the first character
      if (!editContent || editContent === '') {
        setShowSlashMenu(true);
      }
    }
  };

  const handleBlur = () => {
    // Only update if slash menu is not shown
    if (!showSlashMenu) {
      logger.log('NotionBlock onBlur onUpdate:', { blockId: block.id, content: editContent });
      onUpdate(block.id, { content: editContent });
    }
    setShowSlashMenu(false);
  };

  const handleFocus = () => {
    setEditContent(block.content);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editContent || block.content);
      // Optional: Show visual feedback
      const originalText = block.content;
      setEditContent('已复制!');
      setTimeout(() => {
        setEditContent(originalText);
      }, 1000);
    } catch (err) {
      logger.error('复制失败:', err);
      // Fallback for older browsers
      const textarea = editorRef.current;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
      }
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (!imageFile) {
      return;
    }

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // Update block with base64 image
      onUpdate(block.id, { content: base64 });
    } catch (error) {
      logger.error('Error processing image:', error);
      alert('图片处理失败');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFile) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        onUpdate(block.id, { content: base64 });
      } catch (error) {
        logger.error('Error processing image:', error);
        alert('图片处理失败');
      }
    };
    input.click();
  };

  const handleTypeChange = (type: BlockType) => {
    // Remove the '/' from content before changing type
    let cleanContent = editContent.replace(/^\/+$/, '');

    logger.log('NotionBlock handleTypeChange:', {
      blockId: block.id,
      currentType: block.type,
      newType: type,
      originalEditContent: editContent,
      cleanContent: cleanContent
    });

    // Generate proper SimpleTableBlockData when switching to table type
    if (type === 'table') {
      const tableData: SimpleTableBlockData = {
        id: block.id,
        type: 'table',
        rows: [
          { cells: [{ content: '' }, { content: '' }, { content: '' }] },
          { cells: [{ content: '' }, { content: '' }, { content: '' }] },
          { cells: [{ content: '' }, { content: '' }, { content: '' }] }
        ],
        enableHeaderRow: true,
        columnWidths: {
          0: 160,
          1: 160,
          2: 160
        }
      };

      logger.log('NotionBlock generating empty table data:', tableData);
      cleanContent = '';  // Clear content for table blocks

      // Update with table data in properties
      setEditContent(cleanContent);
      setShowSlashMenu(false);
      onUpdate(block.id, {
        type,
        content: cleanContent,
        properties: {
          ...block.properties,
          tableData
        }
      });
      return;
    }

    // Update local state immediately
    setEditContent(cleanContent);

    // Close the menu
    setShowSlashMenu(false);

    // Update parent state immediately (not in setTimeout)
    onUpdate(block.id, { type, content: cleanContent });
  };

  const handleMenuItemClick = (type: BlockType, e: React.MouseEvent) => {
    logger.log('NotionBlock handleMenuItemClick:', { type, e });
    e.preventDefault();
    e.stopPropagation();
    handleTypeChange(type);
  };

  const renderContent = () => {
    // 中文文档标准格式配置
    const getBlockStyles = () => {
      switch (block.type) {
        case 'h1':
          return {
            fontSize: '22px',
            fontWeight: 600,
            lineHeight: 1.6,
            marginBottom: '16px',
            marginTop: '24px',
          };
        case 'h2':
          return {
            fontSize: '18px',
            fontWeight: 600,
            lineHeight: 1.6,
            marginBottom: '14px',
            marginTop: '20px',
          };
        case 'h3':
          return {
            fontSize: '16px',
            fontWeight: 600,
            lineHeight: 1.6,
            marginBottom: '12px',
            marginTop: '16px',
          };
        case 'bullet':
        case 'numbered':
          return {
            fontSize: '15px',
            lineHeight: 1.8,
            marginBottom: '8px',
            paddingLeft: block.type === 'bullet' ? '24px' : '24px',
          };
        case 'quote':
          return {
            fontSize: '15px',
            lineHeight: 1.8,
            marginBottom: '12px',
            fontStyle: 'italic',
            color: 'rgba(55, 53, 47, 0.8)',
            paddingLeft: '16px',
            borderLeft: '3px solid rgba(55, 53, 47, 0.2)',
          };
        default:
          return {
            fontSize: '15px',
            lineHeight: 1.8,
            marginBottom: '8px',
          };
      }
    };

    const baseStyle = {
      flex: 1,
      outline: 'none',
      color: 'rgba(55, 53, 47, 1)',
      background: 'transparent',
      border: 'none',
      padding: 0,
      width: '100%',
      ...getBlockStyles()
    };

    // Use streaming markdown renderer for paragraph blocks with markdown content
    // This includes both loading state and completed markdown content
    const hasMarkdownContent = editContent && (
      editContent.includes('```') ||
      editContent.includes('|') ||
      editContent.includes('#') ||
      editContent.includes('**') ||
      editContent.includes('*') ||
      editContent.includes('- ') ||
      editContent.includes('1. ')
    );

    if (block.type === 'paragraph' && (block.properties.loading || (block.properties.isGenerated && hasMarkdownContent))) {
      return (
        <Suspense fallback={<div style={{ padding: '12px', color: 'rgba(55, 53, 47, 0.5)' }}>加载中...</div>}>
          <div style={{ flex: 1, marginTop: '8px', width: '100%', padding: '12px', backgroundColor: block.properties.loading ? 'rgba(35, 131, 226, 0.02)' : 'transparent', borderRadius: '4px' }}>
            <StreamingMarkdownRenderer markdown={editContent} isComplete={!block.properties.loading} />
          </div>
        </Suspense>
      );
    }

    switch (block.type) {
      case 'h1':
        return (
          <textarea
            ref={editorRef as any}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              onUpdate(block.id, { content: e.target.value });
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ ...baseStyle, width: '100%', resize: 'none', overflow: 'hidden', height: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginTop: '2px' }}
            placeholder="标题 1"
            rows={1}
          />
        );
      case 'h2':
        return (
          <textarea
            ref={editorRef as any}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              onUpdate(block.id, { content: e.target.value });
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ ...baseStyle, width: '100%', resize: 'none', overflow: 'hidden', height: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginTop: '2px' }}
            placeholder="标题 2"
            rows={1}
          />
        );
      case 'h3':
        return (
          <textarea
            ref={editorRef as any}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              onUpdate(block.id, { content: e.target.value });
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ ...baseStyle, width: '100%', resize: 'none', overflow: 'hidden', height: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginTop: '2px' }}
            placeholder="标题 3"
            rows={1}
          />
        );
      case 'bullet':
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, width: '100%' }}>
            <span style={{ color: 'rgba(55, 53, 47, 0.4)', marginTop: '2px', flexShrink: 0 }}>•</span>
            <textarea
              ref={editorRef as any}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                onUpdate(block.id, { content: e.target.value });
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{ ...baseStyle, flex: 1, resize: 'none', overflow: 'hidden', height: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginTop: '2px' }}
              placeholder="输入内容..."
              rows={1}
            />
          </div>
        );
      case 'numbered':
        // Try to extract number from content or use a default
        const numberMatch = editContent.match(/^(\d+)\./);
        const displayNumber = numberMatch ? numberMatch[1] : '1';

        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, width: '100%' }}>
            <span style={{ color: 'rgba(55, 53, 47, 0.4)', marginTop: '2px', flexShrink: 0, minWidth: '20px' }}>
              {displayNumber}.
            </span>
            <textarea
              ref={editorRef as any}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                onUpdate(block.id, { content: e.target.value });
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{ ...baseStyle, flex: 1, resize: 'none', overflow: 'hidden', height: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginTop: '2px' }}
              placeholder="输入内容..."
              rows={1}
            />
          </div>
        );
      case 'todo':
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, marginTop: '8px', width: '100%' }}>
            <button
              onClick={() => onUpdate(block.id, { properties: { ...block.properties, checked: !block.properties.checked } })}
              style={{ cursor: 'pointer', padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', marginTop: '2px', flexShrink: 0 }}
            >
              <CheckCircle2
                style={{
                  width: '18px',
                  height: '18px',
                  color: block.properties.checked ? 'rgba(35, 131, 226, 1)' : 'rgba(55, 53, 47, 0.4)',
                  fill: block.properties.checked ? 'rgba(35, 131, 226, 1)' : 'none'
                }}
              />
            </button>
            <textarea
              ref={editorRef as any}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                onUpdate(block.id, { content: e.target.value });
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{ ...baseStyle, textDecoration: block.properties.checked ? 'line-through' : 'none', opacity: block.properties.checked ? 0.5 : 1, flex: 1, resize: 'none', overflow: 'hidden', height: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
              placeholder="待办事项..."
              rows={1}
            />
          </div>
        );
      case 'code':
        const codeRef = useRef<HTMLPreElement>(null);
        const [showPreview, setShowPreview] = useState(false);
        const [copied, setCopied] = useState(false);

        // Apply syntax highlighting when preview is shown
        useEffect(() => {
          if (showPreview && codeRef.current) {
            Prism.highlightElement(codeRef.current);
          }
        }, [editContent, showPreview]);

        // Extract language from content if specified (e.g., ```javascript)
        const languageMatch = editContent.match(/^```(\w+)?\n/);
        const codeLanguage = languageMatch ? (languageMatch[1] || 'javascript') : 'javascript';
        const cleanCode = languageMatch ? editContent.replace(/^```\w*\n/, '').replace(/```$/, '') : editContent;

        // Language alias map
        const languageMap: Record<string, string> = {
          'js': 'javascript',
          'ts': 'typescript',
          'py': 'python',
          'sh': 'bash',
          'zsh': 'bash',
          'yml': 'yaml',
        };

        const normalizedLanguage = languageMap[codeLanguage.toLowerCase()] || codeLanguage.toLowerCase();

        const handleCopy = async () => {
          try {
            await navigator.clipboard.writeText(cleanCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (error) {
            logger.error('复制失败:', error);
          }
        };

        return (
          <div style={{ flex: 1, marginTop: '8px', position: 'relative' }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              padding: '4px 8px',
              backgroundColor: '#2d2d2d',
              borderRadius: '4px 4px 0 0',
              borderBottom: '1px solid #404040'
            }}>
              <span style={{
                fontSize: '12px',
                color: '#b9b9b9',
                textTransform: 'uppercase',
                fontWeight: 500
              }}>
                {normalizedLanguage}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: showPreview ? '#2383E2' : 'transparent',
                    color: showPreview ? 'white' : '#b9b9b9',
                    border: showPreview ? 'none' : '1px solid #505050',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  {showPreview ? '编辑' : '预览'}
                </button>
                {showPreview && (
                  <button
                    onClick={handleCopy}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: copied ? '#4CAF50' : 'transparent',
                      color: copied ? 'white' : '#b9b9b9',
                      border: '1px solid #505050',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copied ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                    {copied ? '已复制' : '复制'}
                  </button>
                )}
              </div>
            </div>

            {/* Content area */}
            {showPreview ? (
              <pre
                ref={codeRef}
                className={`language-${normalizedLanguage}`}
                style={{
                  margin: 0,
                  padding: '16px',
                  borderRadius: '0 0 4px 4px',
                  overflow: 'auto',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  maxHeight: '500px',
                  background: '#2d2d2d',
                  borderTop: 'none'
                }}
              >
                <code
                  className={`language-${normalizedLanguage}`}
                  style={{
                    display: 'block',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 'inherit',
                    lineHeight: 'inherit'
                  }}
                >
                  {cleanCode}
                </code>
              </pre>
            ) : (
              <textarea
                ref={editorRef as any}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#F7F6F3',
                  borderRadius: '0 0 4px 4px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: 'rgba(55, 53, 47, 1)',
                  outline: 'none',
                  border: '1px solid rgba(55, 53, 47, 0.15)',
                  borderTop: 'none',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
                placeholder="输入代码... (例如: ```javascript ... ```)"
                rows={6}
              />
            )}
          </div>
        );
      case 'quote':
        return (
          <div style={{ flex: 1, marginTop: '8px', paddingLeft: '16px', borderLeft: '3px solid rgba(55, 53, 47, 0.2)', backgroundColor: 'rgba(55, 53, 47, 0.03)', width: '100%' }}>
            <textarea
              ref={editorRef as any}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                onUpdate(block.id, { content: e.target.value });
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{ ...baseStyle, width: '100%', resize: 'none', overflow: 'hidden', height: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
              placeholder="引用..."
              rows={1}
            />
          </div>
        );
      case 'divider':
        return <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(55, 53, 47, 0.15)', margin: '24px 0' }} />;
      case 'callout':
        return (
          <div style={{ flex: 1, marginTop: '8px', padding: '12px 16px', borderRadius: '4px', backgroundColor: 'rgba(35, 131, 226, 0.08)', width: '100%' }}>
            <textarea
              ref={editorRef as any}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                onUpdate(block.id, { content: e.target.value });
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{ width: '100%', background: 'transparent', outline: 'none', border: 'none', fontSize: '15px', color: 'rgba(55, 53, 47, 1)', lineHeight: 1.8, resize: 'none', overflow: 'hidden', height: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
              placeholder="提示..."
              rows={1}
            />
          </div>
        );
      case 'image':
        return (
          <div
            style={{
              flex: 1,
              marginTop: '8px',
              width: '100%',
              border: isDraggingFile ? '2px dashed #2383E2' : 'none',
              borderRadius: '8px',
              padding: isDraggingFile ? '8px' : 0,
              backgroundColor: isDraggingFile ? 'rgba(35, 131, 226, 0.05)' : 'transparent',
              transition: 'all 200ms ease'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
          >
            {editContent ? (
              <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={editContent}
                  alt="插入的图片"
                  style={{ maxWidth: '100%', borderRadius: '4px', display: 'block' }}
                  onError={() => {
                    // 如果图片加载失败，清除内容
                    onUpdate(block.id, { content: '' });
                    alert('图片加载失败，请检查图片链接是否正确');
                  }}
                />
                {/* 只在图片是 URL 格式时显示编辑区域（不是 base64） */}
                {!editContent.startsWith('data:image/') && (
                  <textarea
                    ref={editorRef as any}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#F7F6F3',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: 'rgba(55, 53, 47, 0.6)',
                      outline: 'none',
                      border: '1px solid rgba(55, 53, 47, 0.15)',
                      resize: 'none',
                      overflow: 'hidden',
                      height: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}
                    placeholder="输入图片 URL..."
                    rows={1}
                  />
                )}
              </div>
            ) : (
              <div
                style={{
                  border: isDraggingFile ? '2px dashed #2383E2' : '2px dashed rgba(55, 53, 47, 0.2)',
                  borderRadius: '8px',
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: isDraggingFile ? 'rgba(35, 131, 226, 0.05)' : 'rgba(55, 53, 47, 0.02)',
                  transition: 'all 200ms ease'
                }}
              >
                <ImageIcon style={{ width: '48px', height: '48px', color: isDraggingFile ? '#2383E2' : 'rgba(55, 53, 47, 0.3)', marginBottom: '12px', margin: '0 auto 12px' }} />
                <textarea
                  ref={editorRef as any}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    border: 'none',
                    fontSize: '15px',
                    color: 'rgba(55, 53, 47, 1)',
                    textAlign: 'center',
                    resize: 'none',
                    overflow: 'hidden',
                    height: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}
                  placeholder={isDraggingFile ? '松开以上传图片' : '输入图片 URL 或拖拽图片到这里...'}
                  rows={1}
                  disabled={isDraggingFile}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', color: 'rgba(55, 53, 47, 0.5)' }}>
                    {isDraggingFile ? '📁 拖拽图片文件以上传' : '支持 HTTPS 图片链接和拖拽上传'}
                  </div>
                  {!isDraggingFile && (
                    <button
                      onClick={handleImageUpload}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        backgroundColor: 'white',
                        color: '#2383E2',
                        border: '1px solid rgba(35, 131, 226, 0.3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(35, 131, 226, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <Upload style={{ width: '14px', height: '14px' }} />
                      <span>选择文件上传</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'guide': {
        const isGuidanceVisible = block.properties.guidanceVisible !== false;
        // 从 guide-{itemId} 推导出 heading-{itemId}
        const headingBlockId = block.id.replace('guide-', 'heading-');

        return (
          <div style={{ flex: 1, marginTop: '8px', width: '100%' }}>
            {/* 写作指导容器 - 添加 position: relative */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => onUpdate(block.id, { properties: { ...block.properties, guidanceVisible: !isGuidanceVisible } })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: isGuidanceVisible ? '8px' : '0',
                  padding: '6px 10px',
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  borderRadius: '4px',
                  width: 'fit-content',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.1)'; }}
              >
                <Lightbulb style={{ width: '16px', height: '16px', color: '#FFC107' }} />
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#F57C00',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  写作指导
                </span>
                {isGuidanceVisible ? (
                  <ChevronUp style={{ width: '14px', height: '14px', color: '#F57C00', marginLeft: '4px' }} />
                ) : (
                  <ChevronDown style={{ width: '14px', height: '14px', color: '#F57C00', marginLeft: '4px' }} />
                )}
              </div>

              {/* 生成/重写按钮 - 右上角 */}
              {onGenerate && (() => {
                // 直接使用 guide 块 ID（新逻辑：写作指导点击生成只需要 requirements）
                const outlineItemId = block.id.replace('guide-', '');

                // 判断状态 - 使用 headingBlockId 来判断生成状态
                const headingBlockId = `heading-${outlineItemId}`;
                const isGenerating = generatingIds?.has(headingBlockId) || false;
                const hasGenerated = allBlocks?.some(b =>
                  b.id.startsWith(`generated-${headingBlockId}-`) &&
                  b.properties?.isGenerated
                ) || false;

                let buttonText = '生成';
                let buttonColor = '#2383E2';
                let bgColor = 'rgba(35, 131, 226, 0.1)';
                let borderColor = 'rgba(35, 131, 226, 0.2)';
                let hoverBgColor = 'rgba(35, 131, 226, 0.15)';

                if (isGenerating) {
                  buttonText = '生成中...';
                  buttonColor = '#999';
                  bgColor = 'rgba(153, 153, 153, 0.1)';
                  borderColor = 'rgba(153, 153, 153, 0.2)';
                  hoverBgColor = bgColor;
                } else if (hasGenerated) {
                  buttonText = '重写';
                  buttonColor = '#10B981';
                  bgColor = 'rgba(16, 185, 129, 0.1)';
                  borderColor = 'rgba(16, 185, 129, 0.2)';
                  hoverBgColor = 'rgba(16, 185, 129, 0.15)';
                }

                return (
                  <button
                    onClick={(e) => {
                      if (!isGenerating) {
                        e.preventDefault();
                        e.stopPropagation();
                        // 直接传入 guide 块 ID
                        onGenerate(block.id);
                      }
                    }}
                    disabled={isGenerating}
                    style={{
                      position: 'absolute',
                      top: '0',
                      right: '0',
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: bgColor,
                      color: buttonColor,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '4px',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 200ms ease',
                      whiteSpace: 'nowrap',
                      opacity: isGenerating ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.backgroundColor = hoverBgColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bgColor; }}
                  >
                    <Sparkles style={{ width: '12px', height: '12px' }} />
                    <span>{buttonText}</span>
                  </button>
                );
              })()}
            </div>
            {isGuidanceVisible && (
              <>
                <textarea
                  ref={editorRef as any}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(255, 193, 7, 0.05)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: 'rgba(55, 53, 47, 0.9)',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '80px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    transition: 'border-color 150ms ease',
                  }}
                  placeholder="在此编辑本章的写作指导要求，如：重点讨论的要点、写作风格、字数要求等..."
                  rows={3}
                />
                <div style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: 'rgba(55, 53, 47, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>💡</span>
                  <span>修改后点击上方标题右侧"生成/重写"按钮，AI 将根据您的指导重新生成内容</span>
                </div>
              </>
            )}
          </div>
        );
      }
      case 'table': {
        // Check if content is a SimpleTableBlockData object
        logger.log('🎨 Rendering table block:', block.id, 'has tableData:', !!block.properties?.tableData);
        let tableData: SimpleTableBlockData;

        if (typeof block.properties.tableData === 'object' && block.properties.tableData !== null) {
          // Already have proper table data
          tableData = block.properties.tableData as SimpleTableBlockData;
          logger.log('✅ Using existing tableData with', tableData.rows.length, 'rows');
        } else {
          // Legacy HTML table or need to create default table
          // For now, create a default 3x3 table
          logger.log('⚠️ No tableData found, creating default 3x3 table');
          tableData = {
            id: block.id,
            type: 'table',
            rows: [
              { cells: [{ content: '' }, { content: '' }, { content: '' }] },
              { cells: [{ content: '' }, { content: '' }, { content: '' }] },
              { cells: [{ content: '' }, { content: '' }, { content: '' }] }
            ],
            enableHeaderRow: true,
            columnWidths: {
              0: 160,
              1: 160,
              2: 160
            }
          };
        }

        return (
          <div style={{ flex: 1, marginTop: '8px', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <SimpleTableBlock
              node={tableData}
              editable={editable}
              onUpdateNode={(updates) => {
                // Save the entire table data structure
                onUpdate(block.id, {
                  properties: {
                    ...block.properties,
                    tableData: {
                      ...tableData,
                      ...updates
                    }
                  }
                });
              }}
            />
          </div>
        );
      }
      default:
        return (
          <textarea
            ref={editorRef as any}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ ...baseStyle, width: '100%', resize: 'none', overflow: 'hidden', height: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginTop: '2px' }}
            placeholder="输入内容... (按 / 显示菜单)"
            rows={1}
          />
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      data-block-id={block.id}
      style={{
        ...style,
        position: 'relative',
        padding: '0',
        transition: 'opacity 150ms ease-in-out'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        // Toggle selection for table and image blocks
        if (block.type === 'table' || block.type === 'image') {
          setIsSelected(!isSelected);
        }
      }}
      style={{
        ...style,
        position: 'relative',
        padding: '0',
        transition: 'opacity 150ms ease-in-out',
        border: isSelected && (block.type === 'table' || block.type === 'image') ? '2px solid #7C3AED' : 'transparent',
        borderRadius: isSelected ? '4px' : '0'
      }}
      {...attributes}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <button
          {...listeners}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            padding: 0,
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'grab',
            opacity: isHovered || isDragging ? 1 : 0,
            transition: 'opacity 20ms ease-in',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <GripVertical style={{ width: '16px', height: '16px', color: 'rgba(55, 53, 47, 0.4)' }} />
        </button>

        {/* 内容 */}
        <div style={{ flex: 1, position: 'relative' }}>
          {renderContent()}

          {/* Slash 菜单 */}
          {showSlashMenu && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 10,
                marginTop: '4px',
                width: '256px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(55, 53, 47, 0.09)',
                overflow: 'hidden',
                animation: 'fadeIn 200ms ease-in-out'
              }}
            >
              <div style={{ padding: '8px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(55, 53, 47, 0.5)', marginBottom: '4px', padding: '0 4px' }}>基础块</div>
                {BLOCK_TYPES.map((type) => (
                  <button
                    key={type.type}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      logger.log('Menu button clicked:', type.type);
                      handleMenuItemClick(type.type, e);
                    }}
                    style={{
                      userSelect: 'none',
                      transition: 'background 20ms ease-in',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: 1.2,
                      color: 'rgba(55, 53, 47, 1)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ color: 'rgba(55, 53, 47, 0.5)', display: 'flex', alignItems: 'center' }}>
                      {(() => {
                        const Icon = BLOCK_ICONS[type.type];
                        return Icon ? <Icon style={{ width: '16px', height: '16px' }} /> : null;
                      })()}
                    </span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(55, 53, 47, 0.09)', padding: '8px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(55, 53, 47, 0.5)', marginBottom: '4px', padding: '0 4px' }}>高级块</div>
                {['quote', 'divider', 'callout', 'image', 'guide'].map((type) => (
                  <button
                    key={type}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      logger.log('Menu button clicked:', type);
                      handleMenuItemClick(type as BlockType, e);
                    }}
                    style={{
                      userSelect: 'none',
                      transition: 'background 20ms ease-in',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: 1.2,
                      color: 'rgba(55, 53, 47, 1)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ color: 'rgba(55, 53, 47, 0.5)', display: 'flex', alignItems: 'center' }}>
                      {(() => {
                        const Icon = BLOCK_ICONS[type as BlockType];
                        return Icon ? <Icon style={{ width: '16px', height: '16px' }} /> : null;
                      })()}
                    </span>
                    <span>{type === 'quote' ? '引用' : type === 'divider' ? '分割线' : type === 'callout' ? '提示框' : type === 'image' ? '图片' : '写作指导'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 添加按钮 */}
        {isHovered && (
          <>
            <button
              onClick={handleCopy}
              style={{
                position: 'absolute',
                right: '-32px',
                top: '50%',
                transform: 'translateY(-50%) translateY(-14px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                padding: 0,
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 20ms ease-in',
                opacity: 1
              }}
              title="复制"
            >
              <Copy style={{ width: '16px', height: '16px', color: 'rgba(55, 53, 47, 0.4)' }} />
            </button>
            <button
              onClick={() => onAdd(block.id, 'paragraph')}
              style={{
                position: 'absolute',
                right: '-32px',
                top: '50%',
                transform: 'translateY(-50%) translateY(14px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                padding: 0,
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 20ms ease-in',
                opacity: 1
              }}
            >
              <Plus style={{ width: '16px', height: '16px', color: 'rgba(55, 53, 47, 0.4)' }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
