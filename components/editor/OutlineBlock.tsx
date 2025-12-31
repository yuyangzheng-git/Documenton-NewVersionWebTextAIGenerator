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
    ? 'text-2xl font-bold'
    : block.level === 2
    ? 'text-xl font-semibold'
    : 'text-lg font-medium';

  const contentIndent = block.level === 1 ? 'ml-0' : 'ml-8';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group relative', contentIndent)}
    >
      <div className="flex flex-col py-2 px-2 rounded hover:bg-[var(--notion-gray-hover)] transition-colors">
        {/* Title Row */}
        <div className="flex items-center gap-1">
          {/* Drag Handle - only visible on hover */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--notion-active)] transition-all flex-shrink-0"
            style={{ color: 'var(--notion-text-tertiary)' }}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Status Icon */}
          <div className="flex-shrink-0 w-5">
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
                style={{ color: 'var(--notion-text)', caretColor: 'var(--notion-blue)' }}
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
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => onAddBelow(block.id)}
              className="p-1 rounded hover:bg-[var(--notion-active)] transition-colors"
              style={{ color: 'var(--notion-text-tertiary)' }}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(block.id)}
              className="p-1 rounded hover:bg-[var(--notion-active)] transition-colors"
              style={{ color: 'var(--notion-text-tertiary)' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="ml-6 mt-1">
          {isEditingContent ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSaveContent}
              placeholder="Empty. Click to add content..."
              className="w-full text-base bg-transparent focus:outline-none resize-none rounded"
              style={{
                color: 'var(--notion-text)',
                minHeight: '60px',
                caretColor: 'var(--notion-blue)'
              }}
              rows={3}
            />
          ) : (
            <div
              onClick={() => setIsEditingContent(true)}
              className="min-h-[40px] cursor-text transition-all text-base"
              style={{
                color: block.content ? 'var(--notion-text)' : 'var(--notion-text-tertiary)',
                lineHeight: '1.6'
              }}
            >
              {block.content || 'Empty. Click to add content...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
