'use client';

import { Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Image, Video, Table, CheckSquare, Link as LinkIcon, Type, FileText, Link2, Calendar, Minus, LayoutGrid, Copy, Trash2, Move, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlashCommandMenuProps {
  isOpen: boolean;
  onSelect: (command: string) => void;
  position?: { x: number; y: number };
  searchQuery?: string;
}

export function SlashCommandMenu({ isOpen, onSelect, position, searchQuery = '' }: SlashCommandMenuProps) {
  if (!isOpen) return null;

  const categories = [
    {
      name: 'Basic Blocks',
      commands: [
        { id: 'text', icon: Type, label: 'Text', description: 'Just start writing with plain text' },
        { id: 'page', icon: FileText, label: 'Page', description: 'Create a sub-page inside current page' },
        { id: 'bullet', icon: List, label: 'Bulleted List', description: 'Create a simple bulleted list' },
        { id: 'numbered', icon: ListOrdered, label: 'Numbered List', description: 'Create a numbered list' },
        { id: 'todo', icon: CheckSquare, label: 'To-do List', description: 'Track tasks with checkboxes' },
        { id: 'toggle', icon: LayoutGrid, label: 'Toggle List', description: 'Toggles can hide and show content' },
        { id: 'divider', icon: Minus, label: 'Divider Line', description: 'Visually divide blocks' },
      ]
    },
    {
      name: 'Turn Into',
      commands: [
        { id: 'h1', icon: Heading1, label: 'Heading 1', description: 'Large section heading' },
        { id: 'h2', icon: Heading2, label: 'Heading 2', description: 'Medium section heading' },
        { id: 'h3', icon: Heading3, label: 'Heading 3', description: 'Small section heading' },
        { id: 'quote', icon: Quote, label: 'Quote', description: 'Capture a quote' },
        { id: 'callout', icon: Type, label: 'Callout', description: 'Make writing stand out' },
      ]
    },
    {
      name: 'Media & Embeds',
      commands: [
        { id: 'image', icon: Image, label: 'Image', description: 'Embed an image from your computer' },
        { id: 'video', icon: Video, label: 'Video', description: 'Embed a YouTube, Vimeo, etc.' },
        { id: 'file', icon: FileText, label: 'File', description: 'Upload a file from your computer' },
        { id: 'embed', icon: Link2, label: 'Embed', description: 'Add embed from 500+ sites' },
      ]
    },
    {
      name: 'Database',
      commands: [
        { id: 'table', icon: Table, label: 'Table', description: 'Add a table' },
        { id: 'board', icon: LayoutGrid, label: 'Board', description: 'Add a board' },
        { id: 'calendar', icon: Calendar, label: 'Calendar', description: 'Add a calendar' },
      ]
    },
    {
      name: 'Actions',
      commands: [
        { id: 'duplicate', icon: Copy, label: 'Duplicate', description: 'Duplicate current block' },
        { id: 'moveto', icon: Move, label: 'Move to', description: 'Move current block to another page' },
        { id: 'archive', icon: Archive, label: 'Archive', description: 'Archive current block' },
        { id: 'delete', icon: Trash2, label: 'Delete', description: 'Delete current block' },
      ]
    }
  ];

  // Filter commands based on search query
  const filteredCategories = categories.map(category => ({
    ...category,
    commands: category.commands.filter(command =>
      command.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      command.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.commands.length > 0);

  return (
    <div
      className="fixed z-50 w-96 rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--notion-bg-primary)',
        border: '1px solid var(--notion-border)',
        boxShadow: 'var(--notion-shadow-lg)',
        left: position?.x || 0,
        top: position?.y || 0,
        maxHeight: '480px',
      }}
    >
      <div className="overflow-y-auto" style={{ maxHeight: '480px' }}>
        {filteredCategories.map((category, categoryIndex) => (
          <div key={category.name}>
            <div
              className="px-3 py-2 text-xs font-medium"
              style={{ color: 'var(--notion-text-tertiary)' }}
            >
              {category.name}
            </div>
            <div className="py-1">
              {category.commands.map((command) => {
                const Icon = command.icon;
                return (
                  <button
                    key={command.id}
                    onClick={() => onSelect(command.id)}
                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[rgba(55,53,47,0.08)] transition-colors"
                  >
                    <div
                      className="p-1.5 rounded"
                      style={{ backgroundColor: 'var(--notion-bg-secondary)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: 'var(--notion-text-secondary)' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium" style={{ color: 'var(--notion-text)' }}>
                        {command.label}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--notion-text-tertiary)' }}>
                        {command.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {categoryIndex < filteredCategories.length - 1 && (
              <div
                className="mx-3"
                style={{ height: '1px', backgroundColor: 'var(--notion-border)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
