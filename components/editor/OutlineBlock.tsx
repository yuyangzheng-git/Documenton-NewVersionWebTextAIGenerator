'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface OutlineBlockData {
  id: string;
  level: number;
  title: string;
  content?: string;
  status?: 'idle' | 'generating' | 'completed';
}

interface OutlineBlockProps {
  block: OutlineBlockData;
  onUpdate: (id: string, updates: Partial<OutlineBlockData>) => void;
  onDelete: (id: string) => void;
  onAddBelow: (id: string) => void;
}

export function OutlineBlock({ block, onUpdate, onDelete, onAddBelow }: OutlineBlockProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
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
    ? 'text-3xl font-bold'
    : 'text-xl font-semibold';

  const contentIndent = block.level === 1 ? 'ml-0' : 'ml-8';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group relative mb-1', contentIndent)}
    >
      <div className="flex flex-col gap-1 py-1 px-2 rounded-md hover:bg-[var(--notion-hover)] transition-colors">
        {/* Title Row */}
        <div className="flex items-center gap-1">
          {/* Drag Handle - only visible on hover */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--notion-active)] transition-all flex-shrink-0"
            style={{ color: 'var(--notion-text-secondary)' }}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Status Icon */}
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
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
                style={{ color: 'var(--notion-text)' }}
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className={cn(
                  'cursor-text w-full',
                  headingClass
                )}
                style={{ color: 'var(--notion-text)' }}
              >
                {block.title}
              </h2>
            )}
          </div>

          {/* Actions - Notion style text buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => onAddBelow(block.id)}
              className="px-2 py-1 text-xs rounded hover:bg-[var(--notion-active)] transition-colors"
              style={{ color: 'var(--notion-text-secondary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(block.id)}
              className="px-2 py-1 text-xs rounded hover:bg-[var(--notion-active)] transition-colors"
              style={{ color: 'var(--notion-text-secondary)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="ml-6">
          {isEditingContent ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSaveContent}
              placeholder="Empty. Click to add content or let AI generate..."
              className="w-full p-2 text-base bg-transparent border-none focus:outline-none resize-none rounded-md"
              style={{
                color: 'var(--notion-text)',
                minHeight: '60px'
              }}
              rows={3}
            />
          ) : (
            <div
              onClick={() => setIsEditingContent(true)}
              className={cn(
                'min-h-[40px] p-2 rounded-md cursor-text transition-all',
                !block.content && 'text-sm'
              )}
              style={{
                color: block.content ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
              }}
            >
              {block.content || 'Empty. Click to add content or let AI generate...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
