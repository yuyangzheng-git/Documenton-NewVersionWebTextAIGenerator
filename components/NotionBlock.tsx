'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Type,
  Code2,
  List,
  ListOrdered,
  Quote,
  Minus,
  Image as ImageIcon,
  Plus,
  GripVertical,
  CheckCircle2,
  Copy,
} from 'lucide-react';

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
  | 'image';

export interface NotionBlock {
  id: string;
  type: BlockType;
  content: string;
  properties: Record<string, unknown>;
  children: NotionBlock[];
}

interface NotionBlockProps {
  block: NotionBlock;
  onUpdate: (id: string, updates: Partial<NotionBlock>) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string | null, position: number, type: BlockType, initialContent?: string) => string | undefined;
  onFocusNext?: () => void;
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
};

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
];

export function NotionBlock({ block, onUpdate, onDelete, onAdd }: NotionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [editContent, setEditContent] = useState(block.content);
  const editorRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    console.log('handleKeyDown START:', { 
      key: e.key, 
      code: e.code, 
      shiftKey: e.shiftKey, 
      ctrlKey: e.ctrlKey,
      type: block.type,
      blockId: block.id 
    });
    
    // Enter creates a new block (Notion-style)
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('Enter detected, preventing default');
      e.preventDefault();
      e.stopPropagation(); // Ensure event doesn't bubble

      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart;
      const beforeCursor = editContent.slice(0, cursorPosition);
      const afterCursor = editContent.slice(cursorPosition);

      // Update local state first to immediately show the change
      setEditContent(beforeCursor);

      // Then update the parent state
      console.log('NotionBlock handleKeyDown onUpdate (current block):', { blockId: block.id, content: beforeCursor });
      onUpdate(block.id, { content: beforeCursor });

      // Determine the type for the new block (Notion behavior)
      let newBlockType: BlockType = 'paragraph';
      let initialContent: string | undefined = afterCursor;

      if (block.type === 'code') {
        // For code blocks, Enter creates new line in same block
        newBlockType = 'code';
        initialContent = undefined;
      } else if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
        // For headings, Enter creates new paragraph
        newBlockType = 'paragraph';
      } else if (block.type === 'bullet') {
        // For bullet lists, Enter creates new bullet item
        newBlockType = 'bullet';
      } else if (block.type === 'numbered') {
        // For numbered lists, Enter creates new numbered item
        newBlockType = 'numbered';
      } else if (block.type === 'todo') {
        // For todo items, Enter creates new todo item
        newBlockType = 'todo';
      } else if (block.type === 'quote') {
        // For quotes, Enter creates new quote
        newBlockType = 'quote';
      } else if (block.type === 'callout') {
        // For callouts, Enter creates new callout
        newBlockType = 'callout';
      } else {
        // For paragraphs, Enter creates new paragraph with default indent
        newBlockType = 'paragraph';
      }

      // Add new block with content after cursor and get its ID
      console.log('About to call onAdd:', { 
        onAddExists: !!onAdd, 
        newBlockType, 
        initialContent, 
        afterCursor,
        blockId: block.id 
      });
      const newBlockId = onAdd ? onAdd(block.id, 0, newBlockType, initialContent) : undefined;
      console.log('onAdd result:', { newBlockId });

      // Focus the new block after it's created
      if (newBlockId) {
        // Use multiple attempts to find and focus the new block
        const focusNewBlock = (attempts = 0) => {
          const newBlockElement = document.querySelector(`[data-block-id="${newBlockId}"] textarea`) as HTMLTextAreaElement;
          if (newBlockElement) {
            newBlockElement.focus();
            // Set cursor after default indent for paragraphs with default indent
            if (newBlockType === 'paragraph' && initialContent === undefined) {
              newBlockElement.setSelectionRange(2, 2);
            } else {
              newBlockElement.setSelectionRange(0, 0);
            }
            // Trigger auto-resize
            const resizeEvent = new Event('input', { bubbles: true });
            newBlockElement.dispatchEvent(resizeEvent);
          } else if (attempts < 10) {
            // Retry with a longer delay
            setTimeout(() => focusNewBlock(attempts + 1), (attempts + 1) * 20);
          }
        };

        setTimeout(() => focusNewBlock(0), 0);
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Shift+Enter - insert newline in current block (for multi-line content)
      // Let the textarea handle the newline naturally
      setTimeout(() => autoResize(), 0);
    } else if (e.key === 'Backspace' && !editContent && !isDragging) {
      e.preventDefault();
      onDelete(block.id);
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
      console.log('NotionBlock onBlur onUpdate:', { blockId: block.id, content: editContent });
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
      console.error('复制失败:', err);
      // Fallback for older browsers
      const textarea = editorRef.current;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
      }
    }
  };

  const handleTypeChange = (type: BlockType) => {
    // Remove the '/' from content before changing type
    let cleanContent = editContent.replace(/^\/$/, '');

    // Add default indent when switching to paragraph if content is empty
    if (type === 'paragraph' && cleanContent === '') {
      cleanContent = '　　';
    }

    console.log('NotionBlock handleTypeChange:', {
      blockId: block.id,
      currentType: block.type,
      newType: type,
      currentContent: editContent,
      cleanContent
    });

    // Update local state immediately to ensure UI shows the change
    setEditContent(cleanContent);

    // Close the menu immediately
    setShowSlashMenu(false);

    // Force a re-render by using setTimeout
    setTimeout(() => {
      console.log('NotionBlock calling onUpdate with:', { type, content: cleanContent });
      onUpdate(block.id, { type, content: cleanContent });
    }, 0);
  };

  const handleMenuItemClick = (type: BlockType, e: React.MouseEvent) => {
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

    switch (block.type) {
      case 'h1':
        return (
          <textarea
            ref={editorRef as any}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
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
            onChange={(e) => setEditContent(e.target.value)}
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
            onChange={(e) => setEditContent(e.target.value)}
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
              onChange={(e) => setEditContent(e.target.value)}
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
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, width: '100%' }}>
            <span style={{ color: 'rgba(55, 53, 47, 0.4)', marginTop: '2px', flexShrink: 0 }}>•</span>
            <textarea
              ref={editorRef as any}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
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
              onChange={(e) => setEditContent(e.target.value)}
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
        return (
          <div style={{ flex: 1, marginTop: '8px' }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#F7F6F3',
                borderRadius: '4px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'rgba(55, 53, 47, 1)',
                outline: 'none',
                border: '1px solid rgba(55, 53, 47, 0.15)',
                resize: 'vertical',
                minHeight: '80px'
              }}
              placeholder="输入代码..."
              rows={3}
            />
          </div>
        );
      case 'quote':
        return (
          <div style={{ flex: 1, marginTop: '8px', paddingLeft: '16px', borderLeft: '3px solid rgba(55, 53, 47, 0.2)', backgroundColor: 'rgba(55, 53, 47, 0.03)', width: '100%' }}>
            <textarea
              ref={editorRef as any}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
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
              onChange={(e) => setEditContent(e.target.value)}
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
          <div style={{ flex: 1, marginTop: '8px', width: '100%' }}>
            {editContent ? (
              <div style={{ position: 'relative', width: '100%' }}>
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
              </div>
            ) : (
              <div style={{ border: '2px dashed rgba(55, 53, 47, 0.2)', borderRadius: '8px', padding: '32px', textAlign: 'center', backgroundColor: 'rgba(55, 53, 47, 0.02)' }}>
                <ImageIcon style={{ width: '48px', height: '48px', color: 'rgba(55, 53, 47, 0.3)', marginBottom: '12px', margin: '0 auto 12px' }} />
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
                  placeholder="输入图片 URL..."
                  rows={1}
                />
                <div style={{ fontSize: '13px', color: 'rgba(55, 53, 47, 0.5)', marginTop: '8px' }}>支持 HTTPS 图片链接</div>
              </div>
            )}
          </div>
        );
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
                    onClick={(e) => handleMenuItemClick(type.type, e)}
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
                {['quote', 'divider', 'callout', 'image'].map((type) => (
                  <button
                    key={type}
                    onClick={(e) => handleMenuItemClick(type as BlockType, e)}
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
                    <span>{type === 'quote' ? '引用' : type === 'divider' ? '分割线' : type === 'callout' ? '提示框' : '图片'}</span>
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
              onClick={() => onAdd(block.id, 0, 'paragraph')}
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
