'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import { WordTemplate } from '@/lib/word-templates';
import { useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
} from 'lucide-react';

interface WordEditorProps {
  template: WordTemplate;
  content?: string;
  onChange?: (html: string) => void;
}

export function WordEditor({ template, content = '', onChange }: WordEditorProps) {
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        allowBase64: true,
        inline: false,
        HTMLAttributes: {
          class: 'word-image',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'word-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'word-editor',
        style: `
          background-color: ${template.paperBg};
          font-family: ${template.fontFamily};
          font-size: ${template.fontSize}pt;
          line-height: ${template.lineHeight};
          min-height: ${297 - (template.margins?.top || 25.4) / 10 - (template.margins?.bottom || 25.4) / 10}mm;
        `,
      },
    },
  });

  const handleImageInsert = useCallback(() => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImagePrompt(false);
    }
  }, [imageUrl, editor]);

  const handleInsertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 工具栏 */}
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-lg border"
        style={{
          backgroundColor: 'var(--notion-bg-secondary)',
          borderColor: 'var(--notion-border)',
        }}
      >
        {/* 撤销/重做 */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-[rgba(55,53,47,0.08)] disabled:opacity-40 transition-colors"
          style={{ color: 'var(--notion-text-secondary)' }}
          title="撤销"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-[rgba(55,53,47,0.08)] disabled:opacity-40 transition-colors"
          style={{ color: 'var(--notion-text-secondary)' }}
          title="重做"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--notion-border)' }}></div>

        {/* 标题 */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-[rgba(35,131,226,0.1)]' : ''
          }`}
          style={{ color: 'var(--notion-text-secondary)' }}
          title="标题1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-[rgba(35,131,226,0.1)]' : ''
          }`}
          style={{ color: 'var(--notion-text-secondary)' }}
          title="标题2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-[rgba(35,131,226,0.1)]' : ''
          }`}
          style={{ color: 'var(--notion-text-secondary)' }}
          title="标题3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--notion-border)' }}></div>

        {/* 文本格式 */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors ${
            editor.isActive('bold') ? 'bg-[rgba(35,131,226,0.1)]' : ''
          }`}
          style={{ color: 'var(--notion-text-secondary)' }}
          title="粗体"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors ${
            editor.isActive('italic') ? 'bg-[rgba(35,131,226,0.1)]' : ''
          }`}
          style={{ color: 'var(--notion-text-secondary)' }}
          title="斜体"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors ${
            editor.isActive('underline') ? 'bg-[rgba(35,131,226,0.1)]' : ''
          }`}
          style={{ color: 'var(--notion-text-secondary)' }}
          title="下划线"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--notion-border)' }}></div>

        {/* 列表 */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors ${
            editor.isActive('bulletList') ? 'bg-[rgba(35,131,226,0.1)]' : ''
          }`}
          style={{ color: 'var(--notion-text-secondary)' }}
          title="无序列表"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors ${
            editor.isActive('orderedList') ? 'bg-[rgba(35,131,226,0.1)]' : ''
          }`}
          style={{ color: 'var(--notion-text-secondary)' }}
          title="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--notion-border)' }}></div>

        {/* 引用 */}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors ${
            editor.isActive('blockquote') ? 'bg-[rgba(35,131,226,0.1)]' : ''
          }`}
          style={{ color: 'var(--notion-text-secondary)' }}
          title="引用"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--notion-border)' }}></div>

        {/* 插入 */}
        <button
          onClick={() => setShowImagePrompt(true)}
          className="p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors"
          style={{ color: 'var(--notion-text-secondary)' }}
          title="插入图片"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleInsertTable}
          className="p-2 rounded hover:bg-[rgba(55,53,47,0.08)] transition-colors"
          style={{ color: 'var(--notion-text-secondary)' }}
          title="插入表格"
        >
          <TableIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 图片输入提示 */}
      {showImagePrompt && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="输入图片 URL 或 base64..."
            className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{
              backgroundColor: 'var(--notion-bg-secondary)',
              color: 'var(--notion-text)',
              border: '1px solid var(--notion-border)',
            }}
            autoFocus
          />
          <button
            onClick={handleImageInsert}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)' }}
          >
            插入
          </button>
          <button
            onClick={() => {
              setShowImagePrompt(false);
              setImageUrl('');
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--notion-bg-secondary)', color: 'var(--notion-text)' }}
          >
            取消
          </button>
        </div>
      )}

      {/* A4 纸张容器 */}
      <div className="relative mx-auto">
        {/* 页眉 */}
        <div
          className="a4-header flex items-center"
          style={{
            backgroundColor: template.header.backgroundColor,
            color: template.header.textColor,
            height: template.header.height,
            textAlign: template.header.alignment,
            paddingLeft: '20mm',
            paddingRight: '20mm',
            fontSize: `${template.header.fontSize}pt`,
          }}
        >
          {template.header.text}
        </div>

        {/* 编辑器内容 */}
        <div
          className="a4-content"
          style={{
            paddingLeft: '20mm',
            paddingRight: '20mm',
          }}
        >
          <EditorContent editor={editor} />
        </div>

        {/* 页脚 */}
        <div
          className="a4-footer flex items-center"
          style={{
            backgroundColor: template.footer.backgroundColor,
            color: template.footer.textColor,
            height: template.footer.height,
            textAlign: template.footer.alignment,
            paddingLeft: '20mm',
            paddingRight: '20mm',
            fontSize: `${template.footer.fontSize}pt`,
          }}
        >
          {template.footer.text.replace('{page}', '1')}
        </div>
      </div>
    </div>
  );
}
