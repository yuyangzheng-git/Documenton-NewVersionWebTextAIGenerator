'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useEffect } from 'react';

export interface RichTextBlockProps {
  content: string;
  placeholder?: string;
  editable?: boolean;
  onUpdate?: (content: string) => void;
  onEnter?: (isShiftKey: boolean) => void;
  onBackspaceAtStart?: () => void;
  onSlashCommand?: () => void;
}

export function RichTextBlock({
  content,
  placeholder = '输入内容...',
  editable = true,
  onUpdate,
  onEnter,
  onBackspaceAtStart,
  onSlashCommand,
}: RichTextBlockProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        codeBlock: false,
        horizontalRule: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: () => placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        // Handle Enter key
        if (event.key === 'Enter') {
          event.preventDefault();
          onEnter?.(event.shiftKey);
          return true;
        }

        // Handle Backspace at the beginning
        if (event.key === 'Backspace') {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;

          // Check if cursor is at the very beginning of the document
          if ($from.pos === 0) {
            event.preventDefault();
            onBackspaceAtStart?.();
            return true;
          }
        }

        // Handle slash command
        if (event.key === '/') {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;

          // Check if slash is at the beginning of a block
          if ($from.parentOffset === 0) {
            onSlashCommand?.();
          }
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  return (
    <div className="rich-text-block">
      <EditorContent editor={editor} />
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 1.5em;
          font-size: 15px;
          line-height: 1.8;
          color: rgba(55, 53, 47, 1);
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(55, 53, 47, 0.4);
          pointer-events: none;
          height: 0;
        }

        /* Headings */
        .ProseMirror h1 {
          font-size: 22px;
          font-weight: 600;
          line-height: 1.6;
          margin-bottom: 16px;
          margin-top: 24px;
        }

        .ProseMirror h2 {
          font-size: 18px;
          font-weight: 600;
          line-height: 1.6;
          margin-bottom: 14px;
          margin-top: 20px;
        }

        .ProseMirror h3 {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.6;
          margin-bottom: 12px;
          margin-top: 16px;
        }

        /* Lists */
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 24px;
          margin-bottom: 8px;
        }

        .ProseMirror li {
          margin: 4px 0;
        }

        /* Task lists */
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }

        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 4px 0;
        }

        .ProseMirror ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1;
        }

        .ProseMirror ul[data-type="taskList"] li input[type="checkbox"] {
          cursor: pointer;
          width: 16px;
          height: 16px;
          margin-top: 2px;
        }

        .ProseMirror ul[data-type="taskList"] input[type="checkbox"]:checked + div {
          text-decoration: line-through;
          opacity: 0.5;
        }

        /* Code */
        .ProseMirror code {
          background-color: rgba(135, 131, 120, 0.15);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
          font-family: 'Courier New', Courier, monospace;
        }

        /* Bold and Italic */
        .ProseMirror strong {
          font-weight: 600;
        }

        .ProseMirror em {
          font-style: italic;
        }

        /* Blockquote */
        .ProseMirror blockquote {
          border-left: 3px solid rgba(55, 53, 47, 0.2);
          padding-left: 16px;
          margin-left: 0;
          font-style: italic;
          color: rgba(55, 53, 47, 0.8);
          margin-bottom: 12px;
        }

        /* Links */
        .ProseMirror a {
          color: rgba(35, 131, 226, 1);
          text-decoration: underline;
          cursor: pointer;
        }

        /* Selection */
        ::selection {
          background-color: rgba(35, 131, 226, 0.2);
        }
      `}</style>
    </div>
  );
}
