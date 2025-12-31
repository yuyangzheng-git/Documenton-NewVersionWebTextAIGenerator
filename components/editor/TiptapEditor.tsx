'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from './tiptap-extensions';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Image, Table as TableIcon } from 'lucide-react';

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  editable?: boolean;
  className?: string;
}

export function TiptapEditor({
  content = '',
  onChange,
  editable = true,
  className,
}: TiptapEditorProps) {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: getExtensions(),
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[800px]',
          'text-gray-800'
        ),
      },
    },
  });

  // Handle text selection for format menu
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from !== to && editor.view.hasFocus()) {
        const coords = editor.view.coordsAtPos(from);
        const rect = editor.view.dom.getBoundingClientRect();
        setMenuPosition({
          x: coords.left - rect.left + 50,
          y: coords.top - rect.top - 10,
        });
        setShowFormatMenu(true);
      } else {
        setShowFormatMenu(false);
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  // Handle slash command
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/') {
        const { from } = editor.state.selection;
        const coords = editor.view.coordsAtPos(from);
        const rect = editor.view.dom.getBoundingClientRect();
        setMenuPosition({
          x: coords.left - rect.left,
          y: coords.top - rect.top + 30,
        });
        setShowSlashMenu(true);
        setSlashFilter('');
      }
      if (event.key === 'Escape') {
        setShowSlashMenu(false);
        setShowFormatMenu(false);
      }
    };

    editor.on('keydown', handleKeyDown);

    return () => {
      editor.off('keydown', handleKeyDown);
    };
  }, [editor]);

  const FormatButton = ({
    onClick,
    isActive,
    title,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-all',
        isActive
          ? 'bg-[var(--notion-blue)] bg-opacity-10 text-[var(--notion-blue)]'
          : 'hover:bg-[var(--notion-hover)]'
      )}
      style={!isActive ? { color: 'var(--notion-text)' } : {}}
    >
      {children}
    </button>
  );

  const slashCommands = [
    { id: 'h1', label: 'Heading 1', icon: 'H1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { id: 'h2', label: 'Heading 2', icon: 'H2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: 'h3', label: 'Heading 3', icon: 'H3', action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    { id: 'text', label: 'Text', icon: 'A', action: () => editor?.chain().focus().setParagraph().run() },
    { id: 'bullet', label: 'Bullet List', icon: '•', action: () => editor?.chain().focus().toggleBulletList().run() },
    { id: 'numbered', label: 'Numbered List', icon: '1.', action: () => editor?.chain().focus().toggleOrderedList().run() },
    { id: 'quote', label: 'Quote', icon: '"', action: () => editor?.chain().focus().toggleBlockquote().run() },
  ];

  const filteredCommands = slashCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  return (
    <div className={cn('relative', className)}>
      <EditorContent editor={editor} />

      {/* Format Menu (shows on text selection) - Notion style */}
      {showFormatMenu && (
        <div
          ref={menuRef}
          className="fixed bg-white rounded-lg shadow-2xl border p-1 flex items-center gap-0.5 z-50"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            borderColor: 'var(--notion-border)'
          }}
        >
          {/* Font Size */}
          <select
            className="px-2 py-1 text-xs bg-transparent border-0 rounded focus:outline-none focus:bg-[var(--notion-hover)]"
            style={{ color: 'var(--notion-text)' }}
            onChange={(e) => {
              editor?.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run();
            }}
          >
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
          </select>

          {/* Text Formatting */}
          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--notion-border)' }} />
          <FormatButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </FormatButton>
          <FormatButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </FormatButton>
          <FormatButton
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            isActive={editor?.isActive('underline')}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </FormatButton>

          {/* Alignment */}
          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--notion-border)' }} />
          <FormatButton
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            isActive={editor?.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </FormatButton>
          <FormatButton
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            isActive={editor?.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </FormatButton>
          <FormatButton
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            isActive={editor?.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </FormatButton>

          {/* Lists */}
          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--notion-border)' }} />
          <FormatButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </FormatButton>
          <FormatButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={editor?.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </FormatButton>

          {/* Insert */}
          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--notion-border)' }} />
          <FormatButton
            onClick={() => {
              const url = window.prompt('Enter image URL:');
              if (url) editor?.chain().focus().setImage({ src: url }).run();
            }}
            title="Insert Image"
          >
            <Image className="w-4 h-4" />
          </FormatButton>
          <FormatButton
            onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </FormatButton>
        </div>
      )}

      {/* Slash Menu - Notion style */}
      {showSlashMenu && (
        <div
          ref={slashMenuRef}
          className="fixed bg-white rounded-lg shadow-2xl border py-1 w-64 z-50"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            borderColor: 'var(--notion-border)'
          }}
        >
          <div className="px-3 py-1.5 text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--notion-text-secondary)' }}>
            Basic Blocks
          </div>
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => {
                cmd.action();
                setShowSlashMenu(false);
              }}
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[var(--notion-hover)] text-left transition-colors"
            >
              <div className="w-8 h-8 bg-[var(--notion-bg-secondary)] rounded flex items-center justify-center text-xs font-semibold" style={{ color: 'var(--notion-text-secondary)' }}>
                {cmd.icon}
              </div>
              <span className="text-sm" style={{ color: 'var(--notion-text)' }}>{cmd.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
