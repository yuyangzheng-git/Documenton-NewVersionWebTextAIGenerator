'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { OutlinePanel } from '@/components/outline/OutlinePanel';
import { AIChat } from '@/components/AIChat';
import { TextSelectionToolbar } from '@/components/TextSelectionToolbar';
import { NotionEditor, NotionBlock } from '@/components/NotionEditor';
import { ChevronLeft, Palette, Download, FileText } from 'lucide-react';
import { WORD_TEMPLATES } from '@/lib/word-templates';
import { exportWithCarbone } from '@/lib/export-carbone';

export default function WordEditorPage() {
  const router = useRouter();
  const { outline, documentTitle, setDocumentTitle } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState('simple-white');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showOutlinePanel, setShowOutlinePanel] = useState(true);
  const [blocks, setBlocks] = useState<NotionBlock[]>([]);
  const [documentTopic, setDocumentTopic] = useState('');

  // Get document topic from URL or first outline item
  useEffect(() => {
    if (outline.length > 0) {
      setDocumentTopic(outline[0].title);
    }
  }, [outline]);

  const handleRewriteText = (text: string) => {
    // Handle AI rewrite request - could open a dialog with the AI chat
    console.log('Rewrite text:', text);
  };

  const handleFormatText = (text: string, format: { bold?: boolean; italic?: boolean; size?: number }) => {
    // Find the block containing the text and update it with formatting
    setBlocks(prev => prev.map(block => {
      if (block.content.includes(text)) {
        const updatedContent = block.content.replace(
          text,
          `<span style="${format.bold ? 'font-weight:bold;' : ''}${format.italic ? 'font-style:italic;' : ''}${format.size ? `font-size:${format.size}px;` : ''}">${text}</span>`
        );
        return { ...block, content: updatedContent };
      }
      return block;
    }));
  };

  // Convert outline to Notion blocks
  useEffect(() => {
    const notionBlocks: NotionBlock[] = [];
    outline.forEach((item) => {
      // Add heading block with auto-generated number
      const titleWithNumber = item.number ? `${item.number} ${item.title}` : item.title;
      notionBlocks.push({
        id: `heading-${item.id}`,
        type: item.level === 1 ? 'h1' : 'h2',
        content: titleWithNumber,
        properties: {},
        children: [],
      });

      // Add content block if exists
      if (item.content) {
        notionBlocks.push({
          id: `content-${item.id}`,
          type: 'paragraph',
          content: item.content,
          properties: {},
          children: [],
        });
      }

      // Add placeholder paragraph after each heading for easy editing
      if (!item.content) {
        notionBlocks.push({
          id: `placeholder-${item.id}`,
          type: 'paragraph',
          content: '',
          properties: {},
          children: [],
        });
      }
    });
    setBlocks(notionBlocks);
  }, [outline]);

  // Redirect to home if no outline
  useEffect(() => {
    if (outline.length === 0) {
      router.push('/');
    }
  }, [outline, router]);

  const handleExport = async () => {
    const template = WORD_TEMPLATES.find((t) => t.id === selectedTemplate) || WORD_TEMPLATES[0];

    // Convert blocks to HTML string
    const htmlContent = blocks
      .map((block) => {
        switch (block.type) {
          case 'h1':
            return `<h1>${block.content}</h1>`;
          case 'h2':
            return `<h2>${block.content}</h2>`;
          case 'h3':
            return `<h3>${block.content}</h3>`;
          case 'bullet':
            return `<ul><li>${block.content}</li></ul>`;
          case 'numbered':
            return `<ol><li>${block.content}</li></ol>`;
          case 'quote':
            return `<blockquote>${block.content}</blockquote>`;
          case 'divider':
            return '<hr>';
          case 'code':
            return `<pre><code>${block.content}</code></pre>`;
          case 'image':
            return block.content ? `<img src="${block.content}" alt="图片" />` : '';
          case 'callout':
            return `<div style="background-color: rgba(35, 131, 226, 0.08); padding: 12px 16px; border-radius: 4px; border-left: 3px solid #2383E2;">${block.content}</div>`;
          default:
            return `<p>${block.content}</p>`;
        }
      })
      .join('');

    // Try to use template file with Carbone, fallback to programmatic export
    await exportWithCarbone(htmlContent, documentTitle, template);
  };

  const currentTemplate = WORD_TEMPLATES.find((t) => t.id === selectedTemplate) || WORD_TEMPLATES[0];

  return (
    <div
      style={{
        backgroundColor: '#fff',
        fontFamily:
          'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "PingFang SC", "Microsoft YaHei", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
        WebkitFontSmoothing: 'auto',
        color: 'rgba(55, 53, 47, 1)',
        lineHeight: 1.5,
        minHeight: '100vh',
      }}
    >
      {/* Top Navigation Bar */}
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
          zIndex: 50,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', flexShrink: 0, alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => router.push('/')}
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
              border: 'none',
            }}
          >
            <ChevronLeft style={{ width: '20px', height: '20px', display: 'block', fill: 'rgba(55, 53, 47, 0.65)', flexShrink: 0 }} />
          </button>
        </div>

        <input
          type="text"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
          style={{
            fontSize: '14px',
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'rgba(55, 53, 47, 1)',
            padding: '4px 8px',
            borderRadius: '4px',
            textAlign: 'center',
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
              border: 'none',
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
              border: 'none',
            }}
          >
            <Download style={{ width: '20px', height: '20px', display: 'block', flexShrink: 0 }} />
            <span>导出</span>
          </button>

          <button
            onClick={() => setShowOutlinePanel(!showOutlinePanel)}
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
              background: showOutlinePanel ? 'rgba(35, 131, 226, 0.1)' : 'transparent',
              gap: '6px',
              border: 'none',
            }}
          >
            <FileText style={{ width: '20px', height: '20px', display: 'block', fill: 'rgba(55, 53, 47, 0.65)', flexShrink: 0 }} />
            <span>大纲</span>
          </button>
        </div>
      </nav>

      {/* Template Selector */}
      {showTemplateSelector && (
        <div
          style={{
            borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
            backgroundColor: 'white',
            animation: 'fadeIn 200ms ease-in-out',
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
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      backgroundColor: template.paperBg,
                    }}
                  />
                  <div style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.2 }}>{template.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ display: 'flex', position: 'relative', minHeight: 'calc(100vh - 44px)' }}>
        {/* Notion Editor */}
        <main
          style={{
            flex: 1,
            maxWidth: showOutlinePanel ? 'calc(1168px - 320px)' : '1168px',
            width: showOutlinePanel ? 'calc(100% - 320px)' : '100%',
            margin: '0 auto',
            padding: '24px',
            transition: 'all 200ms ease-in-out',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              overflow: 'visible',
              border: '1px solid rgba(55, 53, 47, 0.09)',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              minHeight: '600px',
            }}
          >
            {/* Document Title */}
            <div style={{ padding: '32px 48px' }}>
              <h1 style={{ fontSize: '30px', fontWeight: 600, color: 'rgba(55, 53, 47, 1)', lineHeight: 1.2 }}>
                {documentTitle}
              </h1>
            </div>

            {/* Page Header */}
            <div
              style={{
                padding: '12px 48px',
                fontSize: '14px',
                fontWeight: 400,
                textAlign: currentTemplate.header?.alignment || 'center',
                backgroundColor: currentTemplate.header?.backgroundColor || 'transparent',
                color: currentTemplate.header?.textColor || 'gray',
              }}
            >
              {currentTemplate.header?.text || ''}
            </div>

            {/* Editor Content */}
            <div style={{ padding: '32px 48px' }}>
              {blocks.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    color: 'rgba(55, 53, 47, 0.4)',
                    fontSize: '14px',
                  }}
                >
                  <p>正在加载文档内容...</p>
                </div>
              ) : (
                <NotionEditor
                  blocks={blocks}
                  setBlocks={setBlocks}
                  documentTitle={documentTitle}
                />
              )}
            </div>

            {/* Page Footer */}
            <div
              style={{
                padding: '12px 48px',
                fontSize: '14px',
                fontWeight: 400,
                textAlign: currentTemplate.footer?.alignment || 'center',
                backgroundColor: currentTemplate.footer?.backgroundColor || 'transparent',
                color: currentTemplate.footer?.textColor || 'gray',
                borderTop: '1px solid rgba(55, 53, 47, 0.09)',
              }}
            >
              {currentTemplate.footer?.text?.replace('{page}', '1') || '第 1 页'}
            </div>
          </div>
        </main>

        {/* Outline Panel */}
        <OutlinePanel
          show={showOutlinePanel}
          onClose={() => setShowOutlinePanel(false)}
          documentTopic={documentTopic}
        />
      </div>

      {/* Text Selection Toolbar */}
      <TextSelectionToolbar onRewrite={handleRewriteText} onFormat={handleFormatText} />

      {/* AI Chat */}
      <AIChat />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
