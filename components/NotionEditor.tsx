'use client';

import { useState } from 'react';
import { NotionBlock as NotionBlockComponent, BlockType } from './NotionBlock';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { WORD_TEMPLATES } from '@/lib/word-templates';
import { Download, ChevronLeft, Palette } from 'lucide-react';
import { exportToDocx } from '@/lib/export-utils';
import { CoverImage } from './CoverImage';
import { MoreMenu } from './MoreMenu';
import { cn } from '@/lib/utils';

export interface NotionBlock {
  id: string;
  type: BlockType;
  content: string;
  properties: any;
  children: NotionBlock[];
}

interface NotionEditorProps {
  documentTitle: string;
  onTitleChange: (title: string) => void;
}

export function NotionEditor({ documentTitle, onTitleChange }: NotionEditorProps) {
  const [blocks, setBlocks] = useState<NotionBlock[]>([
    {
      id: 'block-1',
      type: 'h1',
      content: '欢迎使用 Notion 风格的 Word 编辑器',
      properties: {},
      children: [],
    },
    {
      id: 'block-2',
      type: 'paragraph',
      content: '这是一个全新的文档编辑体验，结合了 Notion 的简洁设计和 Word 的强大功能。',
      properties: {},
      children: [],
    },
    {
      id: 'block-3',
      type: 'h2',
      content: '核心功能',
      properties: {},
      children: [],
    },
    {
      id: 'block-4',
      type: 'bullet',
      content: '📝 块级编辑 - 每个段落都是独立的块',
      properties: {},
      children: [],
    },
    {
      id: 'block-5',
      type: 'bullet',
      content: '🎨 拖拽排序 - 自由调整内容顺序',
      properties: {},
      children: [],
    },
    {
      id: 'block-6',
      type: 'bullet',
      content: '⚡ Slash 命令 - 输入 / 快速切换块类型',
      properties: {},
      children: [],
    },
    {
      id: 'block-7',
      type: 'bullet',
      content: '🎯 多种块类型 - 段落、标题、列表、代码等',
      properties: {},
      children: [],
    },
    {
      id: 'block-8',
      type: 'h2',
      content: '支持的块类型',
      properties: {},
      children: [],
    },
    {
      id: 'block-9',
      type: 'h3',
      content: '文本块',
      properties: {},
      children: [],
    },
    {
      id: 'block-10',
      type: 'bullet',
      content: '段落 - 普通文本段落',
      properties: {},
      children: [],
    },
    {
      id: 'block-11',
      type: 'bullet',
      content: '标题 (H1/H2/H3) - 多级标题结构',
      properties: {},
      children: [],
    },
    {
      id: 'block-12',
      type: 'bullet',
      content: '无序列表 - 项目符号列表',
      properties: {},
      children: [],
    },
    {
      id: 'block-13',
      type: 'bullet',
      content: '有序列表 - 数字编号列表',
      properties: {},
      children: [],
    },
    {
      id: 'block-14',
      type: 'h3',
      content: '特殊块',
      properties: {},
      children: [],
    },
    {
      id: 'block-15',
      type: 'bullet',
      content: '代码块 - 带语法高亮的代码展示',
      properties: {},
      children: [],
    },
    {
      id: 'block-16',
      type: 'bullet',
      content: '引用 - 独立样式的引用段落',
      properties: {},
      children: [],
    },
    {
      id: 'block-17',
      type: 'bullet',
      content: '分割线 - 水平分隔线',
      properties: {},
      children: [],
    },
    {
      id: 'block-18',
      type: 'bullet',
      content: '图片 - 支持拖拽上传图片',
      properties: {},
      children: [],
    },
    {
      id: 'block-19',
      type: 'bullet',
      content: 'Callout - 带图标的提示框',
      properties: {},
      children: [],
    },
    {
      id: 'block-20',
      type: 'h2',
      content: '使用技巧',
      properties: {},
      children: [],
    },
    {
      id: 'block-21',
      type: 'numbered',
      content: 'Enter - 在当前块后创建新块',
      properties: {},
      children: [],
    },
    {
      id: 'block-22',
      type: 'numbered',
      content: 'Backspace - 删除空块',
      properties: {},
      children: [],
    },
    {
      id: 'block-23',
      type: 'numbered',
      content: 'Shift + Enter - 在当前块内换行',
      properties: {},
      children: [],
    },
    {
      id: 'block-24',
      type: 'numbered',
      content: 'Esc - 退出编辑模式',
      properties: {},
      children: [],
    },
    {
      id: 'block-25',
      type: 'h2',
      content: 'Word 模板',
      properties: {},
      children: [],
    },
    {
      id: 'block-26',
      type: 'paragraph',
      content: '我们提供了 5 种预设模板，包括简约白、商务蓝、优雅灰、清新绿和专业黑。每种模板都有精心设计的页眉、页脚和配色方案。',
      properties: {},
      children: [],
    },
    {
      id: 'block-27',
      type: 'h2',
      content: '封面图片',
      properties: {},
      children: [],
    },
    {
      id: 'block-28',
      type: 'paragraph',
      content: '点击顶部的封面区域上传图片，或直接拖拽图片文件到封面区域。封面图片将为您的文档增添个性化和专业感。',
      properties: {},
      children: [],
    },
    {
      id: 'block-29',
      type: 'h2',
      content: '导出功能',
      properties: {},
      children: [],
    },
    {
      id: 'block-30',
      type: 'paragraph',
      content: '编辑完成后，点击右上角的更多菜单，选择导出功能，将您的文档导出为 Word 格式。导出的文档将保留所有内容结构和格式。',
      properties: {},
      children: [],
    },
    {
      id: 'block-31',
      type: 'h2',
      content: '示例演示',
      properties: {},
      children: [],
    },
    {
      id: 'block-32',
      type: 'divider',
      content: '',
      properties: {},
      children: [],
    },
    {
      id: 'block-33',
      type: 'code',
      content: 'function hello() {\n  console.log("Hello, Notion!");\n}',
      properties: {},
      children: [],
    },
    {
      id: 'block-34',
      type: 'quote',
      content: '好的设计是尽可能少的设计。 - Dieter Rams',
      properties: {},
      children: [],
    },
    {
      id: 'block-35',
      type: 'callout',
      content: '💡 提示：尝试输入 / 命令来快速切换块类型！',
      properties: { icon: '💡', color: 'blue' },
      children: [],
    },
  ]);

  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState('simple-white');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const updateBlock = (id: string, updates: Partial<NotionBlock>) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === id) {
          return { ...block, ...updates };
        }
        if (block.children) {
          const updatedChildren = block.children.map((child) => {
            if (child.id === id) {
              return { ...child, ...updates };
            }
            return child;
          });
          if (updatedChildren.some((c) => c.id === id)) {
            return { ...block, children: updatedChildren };
          }
        }
        return block;
      })
    );
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const addBlock = (parentId: string | null, position: number, type: BlockType) => {
    const newBlock: NotionBlock = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      properties: {},
      children: [],
    };

    if (parentId) {
      updateBlock(parentId, {
        children: [...(blocks.find((b) => b.id === parentId)?.children || []), newBlock],
      });
    } else {
      const index = blocks.findIndex((b) => b.id === parentId) + 1;
      setBlocks([...blocks.slice(0, index), newBlock, ...blocks.slice(index)]);
    }
  };

  const addChildBlock = (parentId: string, type: BlockType) => {
    const newBlock: NotionBlock = {
      id: `child-${Date.now()}`,
      type,
      content: '',
      properties: {},
      children: [],
    };
    updateBlock(parentId, {
      children: [...(blocks.find((b) => b.id === parentId)?.children || []), newBlock],
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);

    if (oldIndex !== newIndex) {
      setBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
    const template = WORD_TEMPLATES.find(t => t.id === selectedTemplate) || WORD_TEMPLATES[0];
    // Convert blocks to HTML string
    const htmlContent = blocks.map(block => {
      switch (block.type) {
        case 'h1': return `<h1>${block.content}</h1>`;
        case 'h2': return `<h2>${block.content}</h2>`;
        case 'h3': return `<h3>${block.content}</h3>`;
        case 'bullet': return `<ul><li>${block.content}</li></ul>`;
        case 'numbered': return `<ol><li>${block.content}</li></ol>`;
        case 'quote': return `<blockquote>${block.content}</blockquote>`;
        case 'divider': return '<hr>';
        case 'code': return `<pre><code>${block.content}</code></pre>`;
        default: return `<p>${block.content}</p>`;
      }
    }).join('');
    exportToDocx(htmlContent, documentTitle, template);
    setShowMoreMenu(false);
  };

  const currentTemplate = WORD_TEMPLATES.find(t => t.id === selectedTemplate) || WORD_TEMPLATES[0];

  return (
    <div style={{
      backgroundColor: '#fff',
      fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "PingFang SC", "Microsoft YaHei", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
      WebkitFontSmoothing: 'auto',
      color: 'rgba(55, 53, 47, 1)',
      lineHeight: 1.5,
      minHeight: '100vh'
    }}>
      {/* 顶部导航栏 */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          overflow: 'hidden',
          height: '44px',
          paddingInline: '12px 10px',
          borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div style={{ position: 'relative', display: 'flex', flexShrink: 0, alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              userSelect: 'none',
              transition: 'background 20ms ease-in',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              height: '28px',
              paddingInline: 0,
              borderRadius: '50%',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.2,
              width: '28px',
              color: 'rgba(55, 53, 47, 1)',
              flexShrink: 0,
              background: 'transparent',
              border: 'none'
            }}
          >
            <ChevronLeft style={{ width: '20px', height: '20px', display: 'block', fill: 'rgba(55, 53, 47, 0.65)', flexShrink: 0 }} />
          </button>
        </div>

        <input
          type="text"
          value={documentTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          style={{
            fontSize: '14px',
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'rgba(55, 53, 47, 1)',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        />

        <div style={{ position: 'relative', display: 'flex', flexShrink: 0, alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            style={{
              userSelect: 'none',
              transition: 'background 20ms ease-in',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '28px',
              paddingInline: '12px',
              borderRadius: '50px',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.2,
              color: 'rgba(55, 53, 47, 1)',
              background: 'transparent',
              gap: '6px',
              border: 'none'
            }}
          >
            <Palette style={{ width: '20px', height: '20px', display: 'block', fill: 'rgba(55, 53, 47, 0.65)', flexShrink: 0 }} />
            <span>{currentTemplate.name}</span>
          </button>

          <button
            onClick={handleExport}
            style={{
              userSelect: 'none',
              transition: 'background 20ms ease-in',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '28px',
              paddingInline: '12px',
              borderRadius: '50px',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.2,
              color: 'white',
              background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
              gap: '6px',
              border: 'none'
            }}
          >
            <Download style={{ width: '20px', height: '20px', display: 'block', flexShrink: 0 }} />
            <span>导出</span>
          </button>

          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={{
              userSelect: 'none',
              transition: 'background 20ms ease-in',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              height: '28px',
              paddingInline: 0,
              borderRadius: '50%',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.2,
              width: '28px',
              color: 'rgba(55, 53, 47, 1)',
              flexShrink: 0,
              background: 'transparent',
              border: 'none'
            }}
          >
            <div style={{ width: '5px', height: '5px', backgroundColor: 'rgba(55, 53, 47, 0.65)', borderRadius: '50%' }} />
          </button>
        </div>
      </nav>

      {/* 模板选择器 */}
      {showTemplateSelector && (
        <div
          style={{
            borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
            backgroundColor: 'white',
            animation: 'fadeIn 200ms ease-in-out'
          }}
        >
          <div style={{ padding: '16px 24px', maxWidth: '1168px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              {WORD_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setShowTemplateSelector(false);
                  }}
                  style={{
                    userSelect: 'none',
                    transition: 'background 20ms ease-in',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '16px',
                    whiteSpace: 'nowrap',
                    color: 'rgba(55, 53, 47, 1)',
                    backgroundColor: selectedTemplate === template.id ? 'rgba(35, 131, 226, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                    border: selectedTemplate === template.id ? '1px solid rgba(35, 131, 226, 0.3)' : '1px solid transparent',
                    flexBasis: 0,
                    flexGrow: 1,
                    textAlign: 'left'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      backgroundColor: template.paperBg
                    }}
                  />
                  <div style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.2 }}>
                    {template.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 更多菜单 */}
      {showMoreMenu && (
        <MoreMenu
          onClose={() => setShowMoreMenu(false)}
          onExport={handleExport}
          documentTitle={documentTitle}
        />
      )}

      {/* 主内容区 */}
      <main style={{ maxWidth: '1168px', margin: '0 auto', padding: '24px 24px 40px' }}>
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(55, 53, 47, 0.09)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
          }}
        >
          {/* 封面图 */}
          <CoverImage
            imageUrl={coverImageUrl}
            onChange={setCoverImageUrl}
            onDrop={handleCoverDrop}
          />

          {/* 文档标题 */}
          <div style={{ padding: '32px 48px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 600, color: 'rgba(55, 53, 47, 1)', lineHeight: 1.2 }}>
              {documentTitle}
            </h1>
          </div>

          {/* 页眉 */}
          <div
            style={{
              padding: '12px 48px',
              fontSize: '14px',
              fontWeight: 400,
              textAlign: currentTemplate.header?.alignment || 'center',
              backgroundColor: currentTemplate.header?.backgroundColor || 'transparent',
              color: currentTemplate.header?.textColor || 'gray'
            }}
          >
            {currentTemplate.header?.text || ''}
          </div>

          {/* 编辑器内容 */}
          <div style={{ padding: '32px 48px' }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                {blocks.map((block) => (
                  <NotionBlockComponent
                    key={block.id}
                    block={block}
                    onUpdate={updateBlock}
                    onDelete={deleteBlock}
                    onAdd={addBlock}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* 添加新块按钮 */}
            <button
              onClick={() => addBlock(null, blocks.length, 'paragraph')}
              style={{
                userSelect: 'none',
                transition: 'background 20ms ease-in',
                cursor: 'pointer',
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                borderRadius: '16px',
                border: '1px dashed rgba(55, 53, 47, 0.2)',
                backgroundColor: 'transparent',
                color: 'rgba(55, 53, 47, 0.4)',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: '12px', height: '1px', backgroundColor: 'currentColor' }} />
                <div style={{ width: '12px', height: '1px', backgroundColor: 'currentColor', transform: 'rotate(90deg)', position: 'absolute' }} />
              </div>
              <span>添加新块</span>
            </button>
          </div>

          {/* 页脚 */}
          <div
            style={{
              padding: '12px 48px',
              fontSize: '14px',
              fontWeight: 400,
              textAlign: currentTemplate.footer?.alignment || 'center',
              backgroundColor: currentTemplate.footer?.backgroundColor || 'transparent',
              color: currentTemplate.footer?.textColor || 'gray'
            }}
          >
            {currentTemplate.footer?.text?.replace('{page}', '1') || '第 1 页'}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
