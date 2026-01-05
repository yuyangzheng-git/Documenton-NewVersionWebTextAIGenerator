'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Loader2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { OutlineItem } from '@/store/useStore';

interface OutlineBlockProps {
  block: OutlineItem;
  onUpdate: (id: string, updates: Partial<OutlineItem>) => void;
  onDelete: (id: string) => void;
  onAddBelow: (id: string) => void;
  onEnterPress?: (id: string) => void;
  onDropImage?: (e: React.DragEvent, id: string) => void;
  number?: string;
}

export function OutlineBlock({ block, onUpdate, onDelete, onAddBelow, number, onEnterPress, onDropImage }: OutlineBlockProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [editTitle, setEditTitle] = useState(block.title);
  const [editContent, setEditContent] = useState(block.content || '');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveTitle = () => {
    onUpdate(block.id, { title: editTitle });
    setIsEditingTitle(false);
  };

  const handleSaveContent = () => {
    onUpdate(block.id, { content: editContent });
    setIsEditingContent(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDraggingOver(false);
    onDropImage?.(e, block.id);
  };

  const getStatusIcon = () => {
    switch (block.status) {
      case 'generating':
        return <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--notion-blue)' }} />;
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--notion-blue)' }} />;
      default:
        return null;
    }
  };

  const headingClass = block.level === 1
    ? 'text-2xl font-bold'
    : block.level === 2
    ? 'text-xl font-semibold'
    : 'text-lg font-medium';

  const contentIndent = block.level === 1
    ? 'ml-0'
    : block.level === 2
    ? 'ml-12'
    : 'ml-24';

  const verticalPadding = block.level === 1
    ? 'py-4'
    : 'py-3';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group relative', contentIndent)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn(
        'flex flex-col px-4 py-3 hover:bg-[rgba(55,53,47,0.03)] transition-colors border border-transparent',
        isDraggingOver && 'border-blue-300 bg-blue-50/50',
        verticalPadding
      )}>
        {/* Title Row */}
        <div className="flex items-center gap-2">
          {/* Drag Handle - only visible on hover */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-[rgba(55,53,47,0.08)] transition-colors"
            style={{ color: 'var(--notion-text-secondary)' }}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Status Icon */}
          <div className="flex-shrink-0 w-6">
            {getStatusIcon()}
          </div>

          {/* Auto-generated numbering */}
          {number && (
            <span
              className="flex-shrink-0 mr-2 text-sm font-medium"
              style={{
                color: 'var(--notion-blue)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
              }}
            >
              {number}
            </span>
          )}

          {/* Title */}
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveTitle();
                    onEnterPress?.(block.id);
                  }
                  if (e.key === 'Escape') {
                    setEditTitle(block.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className={cn(
                  'w-full bg-transparent focus:outline-none',
                  headingClass
                )}
                style={{ color: 'var(--notion-text)', caretColor: 'var(--notion-blue)' }}
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className={cn(
                  'cursor-text w-full transition-colors',
                  headingClass
                )}
                style={{ color: 'var(--notion-text)' }}
              >
                {block.title}
              </h2>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => onAddBelow(block.id)}
              className="p-1.5 hover:bg-[rgba(55,53,47,0.08)] transition-colors"
              style={{ color: 'var(--notion-text-secondary)' }}
              title="Add block below"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(block.id)}
              className="p-1.5 hover:bg-[rgba(55,53,47,0.08)] hover:text-red-500 transition-colors"
              style={{ color: 'var(--notion-text-secondary)' }}
              title="Delete block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`mt-3 ${contentIndent}`}>
          {isEditingContent ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSaveContent}
              placeholder="Empty. Click to add content..."
              className="w-full text-base bg-transparent focus:outline-none resize-none border border-transparent focus:border-[rgba(35,131,226,0.2)] transition-colors"
              style={{
                color: 'var(--notion-text)',
                minHeight: '80px',
                caretColor: 'var(--notion-blue)',
                padding: '0.75rem'
              }}
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveContent();
                  onEnterPress?.(block.id);
                }
              }}
            />
          ) : (
            <div
              onClick={() => setIsEditingContent(true)}
              className="min-h-[60px] cursor-text transition-colors p-3 -mx-3 hover:bg-[rgba(55,53,47,0.03)] rounded-lg"
              style={{
                color: block.content ? 'var(--notion-text)' : 'var(--notion-text-tertiary)'
              }}
            >
              {block.content ? (
                block.content.split('\n').map((line, i) => {
                  if (line.startsWith('![')) {
                    const match = line.match(/!\[(.*?)\]\((.*?)\)/);
                    if (match) {
                      return (
                        <img
                          key={i}
                          src={match[2]}
                          alt={match[1]}
                          className="max-w-full h-auto rounded-lg my-2"
                          style={{ maxHeight: '300px' }}
                        />
                      );
                    }
                  }
                  return <p key={i} className="mb-1">{line}</p>;
                })
              ) : (
                <span className="text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 opacity-50" />
                  Empty. Click to add content... or drag images here
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
