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
  Table as TableIcon,
} from 'lucide-react';
import { RichTextBlock } from './RichTextBlock';
import { TableBlock } from './TableBlock';
import { FormatToolbar } from './FormatToolbar';

export type BlockType =
  | 'paragraph'  // 正文段落
  | 'h1'        // 一级标题
  | 'h2'        // 二级标题
  | 'h3'        // 三级标题
  | 'bullet'     // 无序列表
  | 'numbered'   // 有序列表
  | 'todo'       // 待办事项
  | 'code'       // 代码块
  | 'quote'      // 引用
  | 'divider'    // 分割线
  | 'callout'    // 提示框
  | 'image'      // 图片
  | 'table'      // 表格
  | 'guide';     // 写作指导

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
  table: TableIcon,
  guide: Lightbulb,
};

const BLOCK_TYPES = [
  { type: 'paragraph' as BlockType, label: '正文', category: 'basic' },
  { type: 'h1' as BlockType, label: '一级标题', category: 'basic' },
  { type: 'h2' as BlockType, label: '二级标题', category: 'basic' },
  { type: 'h3' as BlockType, label: '三级标题', category: 'basic' },
  { type: 'bullet' as BlockType, label: '无序列表', category: 'basic' },
  { type: 'numbered' as BlockType, label: '有序列表', category: 'basic' },
  { type: 'todo' as BlockType, label: '待办事项', category: 'basic' },
  { type: 'code' as BlockType, label: '代码', category: 'basic' },
  { type: 'quote' as BlockType, label: '引用', category: 'basic' },
  { type: 'table' as BlockType, label: '表格', category: 'basic' },
];

export function NotionBlock({ block, onUpdate, onDelete, onAdd }: NotionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

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
        // Get previous block's TipTap editor instance
        const prevProseMirror = previousBlockElement.querySelector('.ProseMirror');
        if (prevProseMirror) {
          const currentContent = block.content;
          const prevContent = (prevProseMirror as HTMLElement).innerHTML;
          
          // Delete current block
          onDelete(block.id);

          // Update previous block content by merging
          const mergedContent = prevContent + currentContent;
          onUpdate(previousBlockId, { content: mergedContent });

          // Focus previous block and set cursor at the end of previous content
          setTimeout(() => {
            const editor = prevProseMirror as HTMLElement;
            editor.focus();
            
            // Try to find the TipTap editor view
            const view = (editor as any).__tiptapEditorView__;
            if (view && view.state) {
              const { state } = view;
              const { doc } = state;
              const endPos = doc.content.size;
              const tr = state.tr.setSelection(state.tr.selection.constructor.near(doc.resolve(endPos - 1)));
              view.dispatch(tr);
            }
          }, 50);
        }
      }
    }
  };

  const handleSlashCommand = () => {
    setShowSlashMenu(true);
  };

  // Format toolbar handlers
  const handleFormatBold = () => {
    if (editorRef.current) {
      editorRef.current.chain().focus().toggleBold().run();
    }
  };

  const handleFormatItalic = () => {
    if (editorRef.current) {
      editorRef.current.chain().focus().toggleItalic().run();
    }
  };

  const handleFormatUnderline = () => {
    if (editorRef.current) {
      editorRef.current.chain().focus().toggleUnderline().run();
    }
  };

  const handleFormatStrike = () => {
    if (editorRef.current) {
      editorRef.current.chain().focus().toggleStrike().run();
    }
  };

  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.chain().focus().toggleCode().run();
    }
  };

  const handleFormatIncreaseSize = () => {
    // TipTap doesn't have built-in font size control
    // This would need custom implementation
    console.log('Font size increase not yet implemented');
  };

  const handleFormatDecreaseSize = () => {
    // TipTap doesn't have built-in font size control
    // This would need custom implementation
    console.log('Font size decrease not yet implemented');
  };

  const handleAIRewrite = () => {
    // This would need integration with AI
    console.log('AI rewrite not yet implemented');
  };

  const handleTypeChange = (type: BlockType) => {
    // Get plain text from current content
    const getPlainText = (html: string): string => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || '';
    };

    let cleanContent = getPlainText(block.content) || '';

    // Set content based on type using TipTap-compatible HTML
    const contentMapping: Record<BlockType, string> = {
      paragraph: `<p>${cleanContent || '　　'}</p>`,
      h1: `<h1>${cleanContent}</h1>`,
      h2: `<h2>${cleanContent}</h2>`,
      h3: `<h3>${cleanContent}</h3>`,
      bullet: `<ul><li>${cleanContent}</li></ul>`,
      numbered: `<ol><li>${cleanContent}</li></ol>`,
      todo: `<ul data-type="taskList"><li><label><input type="checkbox"><span></span></label><div>${cleanContent}</div></li></ul>`,
      code: `<pre><code>${cleanContent}</code></pre>`,
      quote: `<blockquote>${cleanContent}</blockquote>`,
      divider: '<hr>',
      callout: `<p>${cleanContent}</p>`,
      image: cleanContent,
      table: cleanContent,
      guide: cleanContent,
    };

    const newContent = contentMapping[type] || `<p>${cleanContent}</p>`;

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
      paragraph: '输入正文内容... (按 / 显示菜单)',
      h1: '一级标题',
      h2: '二级标题',
      h3: '三级标题',
      bullet: '无序列表项...',
      numbered: '有序列表项...',
      todo: '待办事项...',
      code: '代码内容...',
      quote: '引用内容...',
      divider: '',
      callout: '提示内容...',
      image: '输入图片 URL...',
      table: '表格内容...',
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
        <>
          <RichTextBlock
            content={block.content}
            placeholder={getPlaceholder()}
            onUpdate={handleContentUpdate}
            onEnter={handleEnter}
            onBackspaceAtStart={handleBackspaceAtStart}
            onSlashCommand={handleSlashCommand}
            editorRef={editorRef}
          />
          <FormatToolbar
            onBold={handleFormatBold}
            onItalic={handleFormatItalic}
            onUnderline={handleFormatUnderline}
            onStrike={handleFormatStrike}
            onCode={handleFormatCode}
            onIncreaseSize={handleFormatIncreaseSize}
            onDecreaseSize={handleFormatDecreaseSize}
            onAI={handleAIRewrite}
          />
        </>
      );
    }

    // Handle guide type separately
    if (block.type === 'guide') {
      return (
        <div style={{ flex: 1, marginTop: '8px', width: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            padding: '6px 10px',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderRadius: '4px',
            width: 'fit-content'
          }}>
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
          </div>
          <textarea
            value={block.content}
            onChange={(e) => onUpdate(block.id, { content: e.target.value })}
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
            <span>修改后点击右侧"生成"按钮，AI 将根据您的指导重新生成内容</span>
          </div>
        </div>
      );
    }

    // For code blocks
    if (block.type === 'code') {
      const extractPlainText = (html: string) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        const code = div.querySelector('code');
        return code?.textContent || div.textContent || '';
      };

      return (
        <div style={{ flex: 1, width: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            padding: '6px 10px',
            backgroundColor: 'rgba(135, 131, 120, 0.1)',
            borderRadius: '4px',
            width: 'fit-content'
          }}>
            <Code2 style={{ width: '16px', height: '16px', color: 'rgba(135, 131, 120, 0.8)' }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(55, 53, 47, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              代码
            </span>
          </div>
          <textarea
            value={extractPlainText(block.content)}
            onChange={(e) => {
              const newContent = `<pre><code>${e.target.value}</code></pre>`;
              onUpdate(block.id, { content: newContent });
            }}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'rgba(135, 131, 120, 0.05)',
              borderRadius: '6px',
              border: '1px solid rgba(135, 131, 120, 0.2)',
              fontSize: '13px',
              lineHeight: 1.6,
              fontFamily: "'Courier New', Courier, monospace",
              color: 'rgba(55, 53, 47, 0.9)',
              outline: 'none',
              resize: 'vertical',
              minHeight: '80px',
              overflow: 'auto',
              whiteSpace: 'pre',
              wordWrap: 'break-word',
            }}
            placeholder="输入代码..."
            rows={4}
          />
        </div>
      );
    }

    // For divider blocks
    if (block.type === 'divider') {
      return (
        <div style={{ 
          flex: 1, 
          padding: '12px 0',
          display: 'flex',
          alignItems: 'center'
        }}>
          <hr style={{
            width: '100%',
            border: 'none',
            borderTop: '1px solid rgba(55, 53, 47, 0.15)',
            margin: 0
          }} />
        </div>
      );
    }

    // For callout blocks
    if (block.type === 'callout') {
      return (
        <div style={{ flex: 1, width: '100%' }}>
          <div style={{
            padding: '14px 16px',
            backgroundColor: 'rgba(55, 53, 47, 0.04)',
            borderRadius: '6px',
            borderLeft: '3px solid rgba(55, 53, 47, 0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Type style={{ width: '18px', height: '18px', color: 'rgba(55, 53, 47, 0.4)', flexShrink: 0, marginTop: '2px' }} />
            <textarea
              value={block.content.replace(/^<\/?p>$/, '')}
              onChange={(e) => onUpdate(block.id, { content: e.target.value })}
              style={{
                flex: 1,
                outline: 'none',
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'rgba(55, 53, 47, 0.9)',
                resize: 'none',
                overflow: 'hidden',
                height: 'auto',
                minHeight: '24px',
              }}
              placeholder="输入提示内容..."
              rows={1}
            />
          </div>
        </div>
      );
    }

    // For image blocks
    if (block.type === 'image') {
      return (
        <div style={{ flex: 1, width: '100%' }}>
          <textarea
            value={block.content}
            onChange={(e) => onUpdate(block.id, { content: e.target.value })}
            style={{
              flex: 1,
              outline: 'none',
              color: 'rgba(55, 53, 47, 1)',
              backgroundColor: 'rgba(55, 53, 47, 0.02)',
              border: '1px dashed rgba(55, 53, 47, 0.2)',
              borderRadius: '6px',
              padding: '12px 14px',
              width: '100%',
              fontSize: '14px',
              lineHeight: 1.6,
              resize: 'vertical',
              minHeight: '40px',
            }}
            placeholder="输入图片 URL..."
            rows={1}
          />
          {block.content && (
            <img 
              src={block.content} 
              alt=""
              style={{
                marginTop: '12px',
                maxWidth: '100%',
                borderRadius: '6px',
                display: 'block',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.display = 'block';
              }}
            />
          )}
        </div>
      );
    }

    // For table blocks
    if (block.type === 'table') {
      return (
        <TableBlock
          content={block.content}
          onUpdate={(newContent) => onUpdate(block.id, { content: newContent })}
        />
      );
    }

    // Fallback textarea for other types
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
                {['quote', 'divider', 'callout', 'image', 'table'].map((type) => (
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
                    <span>{type === 'quote' ? '引用' : type === 'divider' ? '分割线' : type === 'callout' ? '提示框' : type === 'image' ? '图片' : '表格'}</span>
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(55, 53, 47, 0.09)', padding: '8px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(55, 53, 47, 0.5)', marginBottom: '4px', padding: '0 4px' }}>写作辅助</div>
                {['guide'].map((type) => (
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
                    <span>写作指导</span>
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
                // Extract plain text from HTML content
                const div = document.createElement('div');
                div.innerHTML = block.content;
                const plainText = div.textContent || div.innerText || '';
                navigator.clipboard.writeText(plainText);
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
