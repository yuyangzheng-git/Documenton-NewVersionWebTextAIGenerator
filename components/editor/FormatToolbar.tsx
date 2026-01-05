'use client';

import { Bold, Italic, Underline, List, ListOrdered, Quote, Code, Link, Strikethrough, Link2, Type, CheckSquare, Image, Video, FileText, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormatToolbarProps {
  onFormat: (format: string) => void;
  onColorChange?: (color: string) => void;
  onHighlightChange?: (color: string) => void;
  selectedText?: string;
  className?: string;
}

export function FormatToolbar({ onFormat, onColorChange, onHighlightChange, selectedText, className }: FormatToolbarProps) {
  // Text formatting
  const textFormats = [
    { id: 'bold', icon: Bold, label: 'Bold', shortcut: '⌘B' },
    { id: 'italic', icon: Italic, label: 'Italic', shortcut: '⌘I' },
    { id: 'underline', icon: Underline, label: 'Underline', shortcut: '⌘U' },
    { id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', shortcut: '⌘⇧S' },
    { id: 'code', icon: Code, label: 'Code', shortcut: '⌘E' },
  ];

  // Text color
  const textColors = [
    { id: 'default', color: 'rgba(55, 53, 47, 1)', label: 'Default' },
    { id: 'gray', color: 'rgba(120, 119, 116, 1)', label: 'Gray' },
    { id: 'brown', color: 'rgba(159, 107, 83, 1)', label: 'Brown' },
    { id: 'orange', color: 'rgba(217, 115, 13, 1)', label: 'Orange' },
    { id: 'yellow', color: 'rgba(223, 171, 1, 1)', label: 'Yellow' },
    { id: 'green', color: 'rgba(15, 123, 108, 1)', label: 'Green' },
    { id: 'blue', color: 'rgba(11, 110, 153, 1)', label: 'Blue' },
    { id: 'purple', color: 'rgba(88, 84, 242, 1)', label: 'Purple' },
    { id: 'pink', color: 'rgba(227, 70, 141, 1)', label: 'Pink' },
    { id: 'red', color: 'rgba(208, 65, 56, 1)', label: 'Red' },
  ];

  // Background colors (highlights)
  const highlightColors = [
    { id: 'default', color: 'transparent', label: 'None' },
    { id: 'gray', color: 'rgba(235, 236, 237, 1)', label: 'Gray' },
    { id: 'brown', color: 'rgba(233, 229, 227, 1)', label: 'Brown' },
    { id: 'orange', color: 'rgba(250, 222, 201, 1)', label: 'Orange' },
    { id: 'yellow', color: 'rgba(253, 226, 231, 1)', label: 'Yellow' },
    { id: 'green', color: 'rgba(219, 237, 219, 1)', label: 'Green' },
    { id: 'blue', color: 'rgba(211, 229, 239, 1)', label: 'Blue' },
    { id: 'purple', color: 'rgba(224, 221, 242, 1)', label: 'Purple' },
    { id: 'pink', color: 'rgba(244, 223, 234, 1)', label: 'Pink' },
    { id: 'red', color: 'rgba(251, 228, 228, 1)', label: 'Red' },
  ];

  // Blocks
  const blockTypes = [
    { id: 'link', icon: Link2, label: 'Link', shortcut: '⌘K' },
    { id: 'bullet', icon: List, label: 'Bullet List', shortcut: '' },
    { id: 'numbered', icon: ListOrdered, label: 'Numbered List', shortcut: '' },
    { id: 'quote', icon: Quote, label: 'Quote', shortcut: '' },
    { id: 'todo', icon: CheckSquare, label: 'To-do', shortcut: '' },
    { id: 'divider', icon: LayoutGrid, label: 'Divider', shortcut: '' },
  ];

  return (
    <div
      className={cn(
        'flex flex-col gap-1 px-2 py-2 shadow-md',
        className
      )}
      style={{
        backgroundColor: 'var(--notion-bg-primary)',
        border: '1px solid var(--notion-border)',
        boxShadow: 'var(--notion-shadow-sm)',
        minWidth: '280px',
      }}
    >
      {/* Text Formatting */}
      <div className="flex items-center gap-1 pb-2" style={{ borderBottom: '1px solid var(--notion-border)' }}>
        <span className="text-xs font-medium px-1" style={{ color: 'var(--notion-text-tertiary)' }}>TEXT</span>
        <div className="flex gap-0.5">
          {textFormats.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                onClick={() => onFormat(format.id)}
                className="p-1.5 hover:bg-[rgba(55,53,47,0.08)] transition-colors"
                style={{ color: 'var(--notion-text-secondary)' }}
                title={`${format.label}${format.shortcut ? ` (${format.shortcut})` : ''}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Color */}
      <div className="flex flex-col gap-1 pb-2" style={{ borderBottom: '1px solid var(--notion-border)' }}>
        <span className="text-xs font-medium px-1" style={{ color: 'var(--notion-text-tertiary)' }}>TEXT COLOR</span>
        <div className="flex flex-wrap gap-1 px-1">
          {textColors.map((color) => (
            <button
              key={color.id}
              onClick={() => onColorChange?.(color.color)}
              className="w-6 h-6 rounded transition-colors hover:opacity-80"
              style={{ backgroundColor: color.color }}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* Highlight Color */}
      <div className="flex flex-col gap-1 pb-2" style={{ borderBottom: '1px solid var(--notion-border)' }}>
        <span className="text-xs font-medium px-1" style={{ color: 'var(--notion-text-tertiary)' }}>HIGHLIGHT</span>
        <div className="flex flex-wrap gap-1 px-1">
          {highlightColors.map((color) => (
            <button
              key={color.id}
              onClick={() => onHighlightChange?.(color.color)}
              className="w-6 h-6 rounded transition-colors hover:opacity-80"
              style={{
                backgroundColor: color.color,
                border: color.id === 'default' ? '1px solid var(--notion-border)' : '1px solid transparent'
              }}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* Blocks */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium px-1" style={{ color: 'var(--notion-text-tertiary)' }}>BLOCKS</span>
        <div className="flex gap-0.5">
          {blockTypes.map((block) => {
            const Icon = block.icon;
            return (
              <button
                key={block.id}
                onClick={() => onFormat(block.id)}
                className="p-1.5 hover:bg-[rgba(55,53,47,0.08)] transition-colors"
                style={{ color: 'var(--notion-text-secondary)' }}
                title={`${block.label}${block.shortcut ? ` (${block.shortcut})` : ''}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
