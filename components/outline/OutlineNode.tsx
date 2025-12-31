'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, ChevronRight, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';
import { OutlineItem } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface OutlineNodeProps {
  item: OutlineItem;
  level?: number;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (itemId: string) => void;
}

export function OutlineNode({
  item,
  level = 0,
  onUpdate,
  onDelete,
  onAddChild,
  onAddSibling,
}: OutlineNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [isExpanded, setIsExpanded] = useState(true);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(item.id, editTitle);
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    switch (item.status) {
      case 'generating':
        return <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--notion-blue)' }} />;
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--notion-blue)' }} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group relative', level > 0 && 'ml-4')}
    >
      {/* Node */}
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-md transition-all hover:bg-[var(--notion-hover)]',
          isDragging && 'shadow-md'
        )}
        style={isDragging ? { backgroundColor: 'var(--notion-hover)' } : {}}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-[var(--notion-active)] p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
          style={{ color: 'var(--notion-text-secondary)' }}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Expand/Collapse */}
        {item.children && item.children.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-[var(--notion-active)] rounded transition-colors"
            style={{ color: 'var(--notion-text-secondary)' }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Status */}
        {getStatusIcon()}

        {/* Title */}
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setEditTitle(item.title);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="flex-1 px-2 py-1 text-sm bg-white border rounded focus:outline-none transition-all"
            style={{
              color: 'var(--notion-text)',
              borderColor: 'var(--notion-border)'
            }}
          />
        ) : (
          <span
            onDoubleClick={() => setIsEditing(true)}
            className={cn(
              'flex-1 text-sm cursor-text transition-colors',
              item.level === 1 && 'font-medium',
              item.level === 2 && 'font-normal',
              item.level === 3 && 'font-normal'
            )}
            style={{
              color: item.level === 1 ? 'var(--notion-text)' : 'var(--notion-text-secondary)'
            }}
          >
            {item.title}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddChild(item.id)}
            className="p-1 hover:bg-[var(--notion-active)] rounded transition-colors"
            style={{ color: 'var(--notion-text-secondary)' }}
            title="Add child"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAddSibling(item.id)}
            className="p-1 hover:bg-[var(--notion-active)] rounded transition-colors"
            style={{ color: 'var(--notion-text-secondary)' }}
            title="Add sibling"
          >
            <Plus className="w-3.5 h-3.5 rotate-90" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 hover:bg-red-50 rounded transition-colors hover:text-red-600"
            style={{ color: 'var(--notion-text-secondary)' }}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {item.children && isExpanded && (
        <div className="ml-3">
          {item.children.map((child) => (
            <OutlineNode
              key={child.id}
              item={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onAddSibling={onAddSibling}
            />
          ))}
        </div>
      )}
    </div>
  );
}
