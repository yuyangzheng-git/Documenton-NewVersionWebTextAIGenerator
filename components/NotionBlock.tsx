'use client';

import { useState, useRef } from 'react';
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
  onAdd: (parentId: string | null, position: number, type: BlockType) => void;
  number?: string;
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

export function NotionBlock({ block, onUpdate, onDelete, onAdd, number }: NotionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [editContent, setEditContent] = useState(block.content);
  const editorRef = useRef<HTMLInputElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Find current block index by traversing parent
      // For now, we'll use a simpler approach - add after the current block
      onAdd(block.id, 0, 'paragraph');
    } else if (e.key === 'Backspace' && !editContent && !isDragging) {
      e.preventDefault();
      onDelete(block.id);
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
    } else if (e.key === '/') {
      setShowSlashMenu(true);
    }
  };

  const handleBlur = () => {
    // Only update if slash menu is not shown
    if (!showSlashMenu) {
      onUpdate(block.id, { content: editContent });
    }
    setShowSlashMenu(false);
  };

  const handleFocus = () => {
    setEditContent(block.content);
  };

  const handleTypeChange = (type: BlockType) => {
    // Remove the '/' from content before changing type
    const cleanContent = editContent.replace(/^\/$/, '');
    onUpdate(block.id, { type, content: cleanContent });
    setShowSlashMenu(false);
    editorRef.current?.focus();
  };

  const renderContent = () => {
    const baseStyle = {
      flex: 1,
      outline: 'none',
      color: 'rgba(55, 53, 47, 1)',
      fontSize: '14px',
      lineHeight: 1.5,
      background: 'transparent',
      border: 'none',
      padding: 0
    };

    switch (block.type) {
      case 'h1':
        return (
          <input
            ref={editorRef}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ ...baseStyle, fontSize: '30px', fontWeight: 600 }}
            placeholder="标题 1"
          />
        );
      case 'h2':
        return (
          <input
            ref={editorRef}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ ...baseStyle, fontSize: '24px', fontWeight: 600 }}
            placeholder="标题 2"
          />
        );
      case 'h3':
        return (
          <input
            ref={editorRef}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ ...baseStyle, fontSize: '20px', fontWeight: 500 }}
            placeholder="标题 3"
          />
        );
      case 'bullet':
      case 'numbered':
        return (
          <input
            ref={editorRef}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={baseStyle}
            placeholder="输入内容..."
          />
        );
      case 'todo':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <button
              onClick={() => onUpdate(block.id, { properties: { ...block.properties, checked: !block.properties.checked } })}
              style={{ cursor: 'pointer', padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center' }}
            >
              <CheckCircle2
                style={{
                  width: '20px',
                  height: '20px',
                  color: block.properties.checked ? 'rgba(35, 131, 226, 1)' : 'rgba(55, 53, 47, 0.4)',
                  fill: block.properties.checked ? 'rgba(35, 131, 226, 1)' : 'none'
                }}
              />
            </button>
            <input
              ref={editorRef}
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{ ...baseStyle, textDecoration: block.properties.checked ? 'line-through' : 'none', opacity: block.properties.checked ? 0.5 : 1 }}
              placeholder="待办事项..."
            />
          </div>
        );
      case 'code':
        return (
          <div style={{ flex: 1 }}>
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
                borderRadius: '8px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: '13px',
                color: 'rgba(55, 53, 47, 1)',
                outline: 'none',
                border: '1px solid rgba(55, 53, 47, 0.09)',
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
          <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '2px solid rgba(55, 53, 47, 0.3)' }}>
            <input
              ref={editorRef}
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{ ...baseStyle, fontSize: '16px', fontStyle: 'italic' }}
              placeholder="引用..."
            />
          </div>
        );
      case 'divider':
        return <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(55, 53, 47, 0.2)', margin: '16px 0' }} />;
      case 'callout':
        return (
          <div style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(35, 131, 226, 0.08)' }}>
            <input
              ref={editorRef}
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{ width: '100%', background: 'transparent', outline: 'none', border: 'none', fontSize: '14px', color: 'rgba(55, 53, 47, 1)' }}
              placeholder="提示..."
            />
          </div>
        );
      default:
        return (
          <input
            ref={editorRef}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={baseStyle}
            placeholder="输入内容... (按 / 显示菜单)"
          />
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'relative',
        padding: '4px 0',
        transition: 'opacity 150ms ease-in-out'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...attributes}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        {/* 拖拽手柄 */}
        <button
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
          {...listeners}
        >
          <GripVertical style={{ width: '16px', height: '16px', color: 'rgba(55, 53, 47, 0.4)' }} />
        </button>

        {/* 序号显示（仅用于标题） */}
        {number && (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') && (
          <span
            style={{
              color: 'rgba(55, 53, 47, 0.5)',
              fontSize: block.type === 'h1' ? '18px' : block.type === 'h2' ? '16px' : '14px',
              fontWeight: 500,
              minWidth: '50px',
              flexShrink: 0,
            }}
          >
            {number}
          </span>
        )}

        {/* 内容 */}
        <div style={{ flex: 1, position: 'relative' }}>
          {renderContent()}

          {/* Slash 菜单 */}
          {showSlashMenu && (
            <div
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
                    onClick={() => handleTypeChange(type.type)}
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
                {['quote', 'divider', 'callout'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      handleTypeChange(type as BlockType);
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
                  >
                    <span style={{ color: 'rgba(55, 53, 47, 0.5)', display: 'flex', alignItems: 'center' }}>
                      {(() => {
                        const Icon = BLOCK_ICONS[type as BlockType];
                        return Icon ? <Icon style={{ width: '16px', height: '16px' }} /> : null;
                      })()}
                    </span>
                    <span>{type === 'quote' ? '引用' : type === 'divider' ? '分割线' : '提示框'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 添加按钮 */}
        {isHovered && (
          <button
            onClick={() => onAdd(block.id, 0, 'paragraph')}
            style={{
              position: 'absolute',
              right: '-32px',
              top: '50%',
              transform: 'translateY(-50%)',
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
        )}
      </div>
    </div>
  );
}
