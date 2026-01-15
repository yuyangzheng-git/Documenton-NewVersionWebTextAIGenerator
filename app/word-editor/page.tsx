'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { OutlinePanel } from '@/components/outline/OutlinePanel';
import { AIChat } from '@/components/AIChat';
import { TextSelectionToolbar } from '@/components/TextSelectionToolbar';
import { NotionEditor, NotionBlock } from '@/components/NotionEditor';
import { ChevronLeft, Palette, Download, FileText, Upload } from 'lucide-react';
import { WORD_TEMPLATES } from '@/lib/word-templates';

export default function WordEditorPage() {
  const router = useRouter();
  const { outline, documentTitle, setDocumentTitle, updateItem } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState('simple-white');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showOutlinePanel, setShowOutlinePanel] = useState(true);
  const [blocks, setBlocks] = useState<NotionBlock[]>([]);
  const [documentTopic, setDocumentTopic] = useState('');
  const [customTemplateId, setCustomTemplateId] = useState<string | null>(null);
  const [customTemplateName, setCustomTemplateName] = useState<string | null>(null);
  const [showCustomTemplate, setShowCustomTemplate] = useState(false);

  // Handle block updates and sync with outline
  const handleBlockUpdate = (id: string, updates: Partial<NotionBlock>) => {
    console.log('handleBlockUpdate called:', { id, updates });
    
    setBlocks(prev => {
      const newBlocks = prev.map(block =>
        block.id === id ? { ...block, ...updates } : block
      );
      console.log('handleBlockUpdate blocks:', { prevLen: prev.length, newLen: newBlocks.length });
      return newBlocks;
    });

    // If updating requirements block, sync to outline (for level 2 items before generation)
    if (id.startsWith('requirements-')) {
      const outlineItemId = id.replace('requirements-', '');
      if (updates.content !== undefined) {
        updateItem(outlineItemId, { requirements: updates.content });
      }
    }

    // If updating content block, sync to outline
    // Also clear requirements when content is updated (content replaces requirements)
    if (id.startsWith('content-')) {
      // Check if this is a paragraph block (content-{itemId}-p{index})
      const paragraphMatch = id.match(/^content-([^-]+)-p(\d+)$/);
      if (paragraphMatch) {
        // This is a paragraph block
        const outlineItemId = paragraphMatch[1];
        const paragraphIndex = parseInt(paragraphMatch[2], 10);

        if (updates.content !== undefined) {
          // Get the current outline item
          const currentItem = outline.find(item => item.id === outlineItemId);
          if (currentItem && currentItem.paragraphs) {
            // Update the specific paragraph
            const newParagraphs = [...currentItem.paragraphs];
            newParagraphs[paragraphIndex] = updates.content;

            // Recombine paragraphs into content
            const newContent = newParagraphs.join('\n\n');

            // Update outline with new paragraphs and content
            updateItem(outlineItemId, { paragraphs: newParagraphs, content: newContent, requirements: '' });
          }
        }
      } else {
        // This is a legacy content block (single block)
        const outlineItemId = id.replace('content-', '');
        if (updates.content !== undefined) {
          updateItem(outlineItemId, { content: updates.content, requirements: '' });
        }
      }
    }
  };

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

  const handleRewriteSection = (sectionId: string, newContent: string) => {
    // Check if this is a paragraph block or main content block
    const paragraphMatch = sectionId.match(/^content-([^-]+)-p(\d+)$/);
    if (paragraphMatch) {
      // This is a paragraph block
      const outlineItemId = paragraphMatch[1];
      const paragraphIndex = parseInt(paragraphMatch[2], 10);

      setBlocks(prev => prev.map(block => {
        if (block.id === `content-${outlineItemId}-p${paragraphIndex}`) {
          return { ...block, content: newContent };
        }
        return block;
      }));
    } else {
      // This is a main content block
      setBlocks(prev => prev.map(block => {
        if (block.id === `content-${sectionId}`) {
          return { ...block, content: newContent };
        }
        return block;
      }));
    }
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
    // Check for duplicate IDs in outline and deduplicate
    const seenIds = new Set<string>();
    const uniqueOutline: typeof outline = [];
    outline.forEach((item) => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueOutline.push(item);
      } else {
        console.warn('Removing duplicate outline item:', item.id);
      }
    });

    // Track all block IDs generated in this render to ensure uniqueness
    const generatedBlockIds = new Set<string>();

    const notionBlocks: NotionBlock[] = [];
    uniqueOutline.forEach((item, index) => {
      // Add heading block with auto-generated number
      const titleWithNumber = item.number ? `${item.number} ${item.title}` : item.title;
      const headingBlockId = `heading-${item.id}`;

      // Check for duplicate heading block ID and skip if already added
      if (generatedBlockIds.has(headingBlockId)) {
        console.warn('Skipping duplicate heading block:', headingBlockId);
        return;
      }
      generatedBlockIds.add(headingBlockId);

      notionBlocks.push({
        id: headingBlockId,
        type: item.level === 1 ? 'h1' : 'h2',
        content: titleWithNumber,
        properties: {},
        children: [],
      });

      // Only level 2 items show requirements (before content is generated)
      // Level 1 items don't show requirements
      if (item.level === 2 && item.requirements && !item.content) {
        // Check if this requirements block already exists and preserve user's edits
        const existingBlock = blocks.find(b => b.id === `requirements-${item.id}`);
        const reqBlockId = `requirements-${item.id}`;

        if (existingBlock) {
          // Keep the existing block only if it hasn't been added yet
          if (!generatedBlockIds.has(existingBlock.id)) {
            notionBlocks.push(existingBlock);
            generatedBlockIds.add(existingBlock.id);
          }
        } else if (!generatedBlockIds.has(reqBlockId)) {
          notionBlocks.push({
            id: reqBlockId,
            type: 'paragraph',
            content: item.requirements,
            properties: {},
            children: [],
          });
          generatedBlockIds.add(reqBlockId);
        }
      }

      // Add content blocks if exists
      if (item.content) {
        // 如果有段落列表，将每个段落作为独立块显示
        if (item.paragraphs && item.paragraphs.length > 0) {
          item.paragraphs.forEach((paragraph, index) => {
            const blockId = `content-${item.id}-p${index}`;

            // Check for duplicate paragraph block ID
            if (generatedBlockIds.has(blockId)) {
              console.warn('Skipping duplicate paragraph block:', blockId);
              return;
            }

            // Check if this block already exists to preserve user's edits
            const existingBlock = blocks.find(b => b.id === blockId);
            if (existingBlock) {
              // Keep the existing block
              notionBlocks.push(existingBlock);
            } else {
              notionBlocks.push({
                id: blockId,
                type: 'paragraph',
                content: paragraph,
                properties: {},
                children: [],
              });
            }
            generatedBlockIds.add(blockId);
          });
        } else {
          // 如果没有段落列表，将整个内容作为一个块
          const blockId = `content-${item.id}`;

          // Check for duplicate content block ID
          if (generatedBlockIds.has(blockId)) {
            console.warn('Skipping duplicate content block:', blockId);
            return;
          }

          const existingBlock = blocks.find(b => b.id === blockId);
          if (existingBlock) {
            notionBlocks.push(existingBlock);
          } else {
            notionBlocks.push({
              id: blockId,
              type: 'paragraph',
              content: item.content,
              properties: {},
              children: [],
            });
          }
          generatedBlockIds.add(blockId);
        }
      }

      // Check if this level 1 item has children (has 1.1, 1.2, etc.)
      // If it has children, don't add placeholder
      const hasNextItemAsChild = index + 1 < uniqueOutline.length &&
                                 uniqueOutline[index + 1].level > item.level;

      // Add placeholder paragraph after each heading for easy editing
      // Only if no content AND doesn't have child sections
      if (!item.content && !item.requirements && !hasNextItemAsChild) {
        const placeholderBlockId = `placeholder-${item.id}`;
        if (!generatedBlockIds.has(placeholderBlockId)) {
          notionBlocks.push({
            id: placeholderBlockId,
            type: 'paragraph',
            content: '',
            properties: {},
            children: [],
          });
          generatedBlockIds.add(placeholderBlockId);
        }
      }
    });

    // Preserve user-created blocks that are not in outline
    // These are blocks with IDs that don't match any outline item
    const outlineItemIds = new Set([
      ...uniqueOutline.map(item => item.id),
      ...uniqueOutline.map(item => `requirements-${item.id}`),
      ...uniqueOutline.flatMap(item => item.paragraphs ? item.paragraphs.map((_, idx) => `content-${item.id}-p${idx}`) : []),
      ...uniqueOutline.map(item => `content-${item.id}`),
      ...uniqueOutline.map(item => `placeholder-${item.id}`),
    ]);

    // Add user-created blocks that are not in outline AND not already in notionBlocks
    const userCreatedBlocks = blocks.filter(b => !outlineItemIds.has(b.id) && !generatedBlockIds.has(b.id));
    if (userCreatedBlocks.length > 0) {
      console.log('Preserving user-created blocks:', userCreatedBlocks.map(b => b.id));
      notionBlocks.push(...userCreatedBlocks);
    }

    // Only update if blocks are different to avoid unnecessary re-renders
    const currentIds = new Set(blocks.map(b => b.id));
    const newIds = new Set(notionBlocks.map(b => b.id));

    // Check if any new blocks were added (user created them)
    const hasNewBlocks = notionBlocks.some(b => !currentIds.has(b.id));

    // Check if any blocks from current state are missing in new state
    const hasMissingBlocks = blocks.some(b => !newIds.has(b.id));

    // Also check if any user-created blocks have different types
    const userCreatedBlocksChanged = userCreatedBlocks.some(userBlock => {
      const matchingBlockInNotion = notionBlocks.find(nb => nb.id === userBlock.id);
      if (matchingBlockInNotion) {
        return matchingBlockInNotion.type !== userBlock.type || matchingBlockInNotion.content !== userBlock.content;
      }
      return false;
    });

    console.log('useEffect outline -> blocks:', {
      prevLen: blocks.length,
      newLen: notionBlocks.length,
      hasNewBlocks,
      hasMissingBlocks,
      userCreatedCount: userCreatedBlocks.length,
      userCreatedBlocksChanged,
      newBlockIds: notionBlocks.filter(b => !currentIds.has(b.id)).map(b => b.id)
    });

    // Update if: new blocks were added OR blocks are missing (preserve user edits)
    if (hasNewBlocks || hasMissingBlocks || userCreatedBlocksChanged) {
      console.log('Updating blocks (preserving user edits)');
      setBlocks(notionBlocks);
    } else if (JSON.stringify(notionBlocks.map(b => b.id)) !== JSON.stringify(blocks.map(b => b.id))) {
      // If only order changed, update
      console.log('Updating blocks (order changed)');
      setBlocks(notionBlocks);
    }
  }, [outline]);

  // Redirect to home if no outline
  useEffect(() => {
    if (outline.length === 0) {
      router.push('/');
    }
  }, [outline, router]);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outline,
          blocks,
          documentTitle,
          templateId: selectedTemplate,
          customTemplateId: showCustomTemplate ? customTemplateId : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentTitle || 'document'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('导出文档失败：' + (error instanceof Error ? error.message : '请重试'));
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('请上传 .docx 格式的 Word 文档');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('template', file);

      const response = await fetch('/api/template/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '模板上传失败');
      }

      const result = await response.json();
      setCustomTemplateId(result.templateId);
      setCustomTemplateName(result.templateName);
      setShowCustomTemplate(true);
      alert('模板上传成功！');
    } catch (error) {
      console.error('Template upload error:', error);
      alert('模板上传失败：' + (error instanceof Error ? error.message : '请重试'));
    }
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
            {/* Custom Template Section */}
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(55, 53, 47, 0.09)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'rgba(55, 53, 47, 1)' }}>
                自定义模板
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {customTemplateName ? (
                  <div
                    onClick={() => {
                      setShowCustomTemplate(true);
                      setShowTemplateSelector(false);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: showCustomTemplate ? 'rgba(35, 131, 226, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'rgba(55, 53, 47, 1)',
                      cursor: 'pointer',
                      border: showCustomTemplate ? '2px solid #2383E2' : '1px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FileText style={{ width: '16px', height: '16px' }} />
                    <span>{customTemplateName}</span>
                  </div>
                ) : null}
                <label
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(35, 131, 226, 0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#2383E2',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background 20ms ease-in',
                  }}
                >
                  <input
                    type="file"
                    accept=".docx"
                    onChange={handleTemplateUpload}
                    style={{ display: 'none' }}
                  />
                  <Upload style={{ width: '16px', height: '16px' }} />
                  <span>上传模板</span>
                </label>
                <span style={{ fontSize: '12px', color: 'rgba(55, 53, 47, 0.5)' }}>
                  支持 .docx 格式 • 本地存储 • 无需联网
                </span>
              </div>
            </div>

            {/* Built-in Templates */}
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'rgba(55, 53, 47, 1)' }}>
              内置模板
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              {WORD_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setShowCustomTemplate(false);
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
                    backgroundColor: selectedTemplate === template.id && !showCustomTemplate ? 'rgba(35, 131, 226, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                    border: selectedTemplate === template.id && !showCustomTemplate ? '1px solid rgba(35, 131, 226, 0.3)' : '1px solid transparent',
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
                  setBlocks={(updater) => {
                    if (typeof updater === 'function') {
                      setBlocks(updater);
                    } else {
                      setBlocks(updater);
                    }
                  }}
                  onBlockUpdate={handleBlockUpdate}
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
      <AIChat
        onRewriteSection={handleRewriteSection}
        blocks={blocks}
        outline={outline}
      />

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
