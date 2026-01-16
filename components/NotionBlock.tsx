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
  Lightbulb,
} from 'lucide-react';
import { RichTextBlock } from './RichTextBlock';

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
  onUpdate: (id: string, updates: Partial<NotionBlock>) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string | null, type: BlockType, initialContent?: string) => string | undefined;
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
  guide: Lightbulb,
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
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleContentUpdate = (newContent: string) => {
    onUpdate(block.id, { content: newContent });
  };

  const handleEnter = (isShiftKey: boolean) => {
    // Shift+Enter - insert newline (let TipTap handle this)
    if (isShiftKey) {
      return;
    }

    // Enter creates a new block
    const newBlockType: BlockType = 'paragraph';
    const newBlockId = onAdd ? onAdd(block.id, newBlockType, '') : undefined;

    if (newBlockId) {
      setTimeout(() => {
        const newBlockElement = document.querySelector(`[data-block-id="${newBlockId}"] .ProseMirror`);
        if (newBlockElement) {
          (newBlockElement as HTMLElement).focus();
        }
      }, 50);
    }
  };

  const handleBackspaceAtStart = () => {
    // Find the index of current block
    const allBlocks = Array.from(document.querySelectorAll('[data-block-id]'));
    const currentIndex = allBlocks.findIndex(el => el.getAttribute('data-block-id') === block.id);

    if (currentIndex > 0) {
      const previousBlockElement = allBlocks[currentIndex - 1];
      const previousBlockId = previousBlockElement?.getAttribute('data-block-id');

      if (previousBlockId) {
        // Get previous block's content
        const prevProseMirror = previousBlockElement.querySelector('.ProseMirror');
        if (prevProseMirror) {
          const prevContentLength = (prevProseMirror as HTMLElement).innerHTML.length;
          const currentContent = block.content;

          // Delete current block
          onDelete(block.id);

          // Update previous block content
          const prevContent = (prevProseMirror as HTMLElement).innerHTML;
          const mergedContent = prevContent + currentContent;
          onUpdate(previousBlockId, { content: mergedContent });

          // Focus previous block and set cursor between the two merged contents
          setTimeout(() => {
            const editor = prevProseMirror as HTMLElement;
            editor.focus();
            // TODO: Set cursor position using TipTap API - using prevContentLength: ${prevContentLength}
          }, 50);
        }
      }
    }
  };

  const handleSlashCommand = () => {
    setShowSlashMenu(true);
  };

  const handleTypeChange = (type: BlockType) => {
    let cleanContent = block.content.replace(/^<\/?p>$/, '');

    // Set content based on type
    const contentMapping: Record<BlockType, string> = {
      paragraph: cleanContent || '　　',
      h1: cleanContent,
      h2: cleanContent,
      h3: cleanContent,
      bullet: `<li>${cleanContent}</li>`,
      numbered: `<li>${cleanContent}</li>`,
      todo: `<li><input type="checkbox"><div>${cleanContent}</div></li>`,
      code: `<pre><code>${cleanContent}</code></pre>`,
      quote: `<blockquote>${cleanContent}</blockquote>`,
      divider: '<hr>',
      callout: cleanContent,
      image: cleanContent,
      guide: cleanContent,
    };

    const newContent = contentMapping[type] || cleanContent;

    setShowSlashMenu(false);
    onUpdate(block.id, { type, content: newContent });
  };

  const handleMenuItemClick = (type: BlockType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleTypeChange(type);
  };

  const getPlaceholder = () => {
    const placeholders: Record<BlockType, string> = {
      paragraph: '输入内容... (按 / 显示菜单)',
      h1: '标题 1',
      h2: '标题 2',
      h3: '标题 3',
      bullet: '列表项...',
      numbered: '列表项...',
      todo: '待办事项...',
      code: '代码块...',
      quote: '引用...',
      divider: '',
      callout: '提示...',
      image: '输入图片 URL...',
      guide: '在此编辑本章的写作指导要求...',
    };
    return placeholders[block.type] || '输入内容...';
  };

  const renderContent = () => {
    // For rich text types, use RichTextBlock
    const richTextTypes: BlockType[] = ['paragraph', 'h1', 'h2', 'h3', 'bullet', 'numbered', 'todo', 'quote'];
    const isRichText = richTextTypes.includes(block.type);

    if (isRichText) {
      return (
        <RichTextBlock
          content={block.content}
          placeholder={getPlaceholder()}
          onUpdate={handleContentUpdate}
          onEnter={handleEnter}
          onBackspaceAtStart={handleBackspaceAtStart}
          onSlashCommand={handleSlashCommand}
        />
      );
    }

    // For non-rich-text types, use original implementation
    // ... (code, divider, callout, image, guide implementations would go here)
    return (
      <textarea
        value={block.content}
        onChange={(e) => onUpdate(block.id, { content: e.target.value })}
        style={{
          flex: 1,
          outline: 'none',
          color: 'rgba(55, 53, 47, 1)',
          background: 'transparent',
          border: 'none',
          padding: 0,
          width: '100%',
          fontSize: '15px',
          lineHeight: 1.8,
          marginBottom: '8px',
          resize: 'none',
          overflow: 'hidden',
          height: 'auto',
        }}
        placeholder={getPlaceholder()}
        rows={1}
      />
    );
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
                {['quote', 'divider', 'callout', 'image', 'guide'].map((type) => (
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
              onClick={() => {
                navigator.clipboard.writeText(block.content);
              }}
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
