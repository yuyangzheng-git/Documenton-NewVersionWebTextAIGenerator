'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { AIChat } from '@/components/AIChat';
import { TextSelectionToolbar } from '@/components/TextSelectionToolbar';
import { NotionEditor, NotionBlock } from '@/components/NotionEditor';
import { SettingsModal } from '@/components/SettingsModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChevronLeft, Download, Settings } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function WordEditorPage() {
  const router = useRouter();
  const { outline, documentTitle, setDocumentTitle } = useStore();
  const [blocks, setBlocks] = useState<NotionBlock[]>([]);
  const blocksRef = useRef<NotionBlock[]>(blocks); // Track current blocks value

  // Update ref whenever blocks changes
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);
  const [documentTopic, setDocumentTopic] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // 追踪正在生成的章节ID
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

    // Handle block updates (不再同步到 outline)
  const handleBlockUpdate = (id: string, updates: Partial<NotionBlock>) => {
    logger.log('handleBlockUpdate called:', { id, updates });

    setBlocks(prev => {
      const newBlocks = prev.map(block =>
        block.id === id ? { ...block, ...updates } : block
      );
      logger.log('handleBlockUpdate blocks:', { prevLen: prev.length, newLen: newBlocks.length });
      return newBlocks;
    });
  };

  // Get document topic from URL or first outline item
  useEffect(() => {
    if (outline.length > 0) {
      setDocumentTopic(outline[0].title);
    }
  }, [outline]);

  const handleRewriteText = (text: string) => {
    // Handle AI rewrite request - could open a dialog with the AI chat
    logger.log('Rewrite text:', text);
  };

  // Handle generate section button click
  // 参数为 guideBlockId（从 guide 块的生成按钮传入）
  const handleGenerateSection = async (guideBlockId: string) => {
    // 1. 找到 guide 块的索引
    const guideBlockIndex = blocks.findIndex(b => b.id === guideBlockId);
    if (guideBlockIndex === -1) {
      alert('找不到写作指导块');
      return;
    }

    const guideBlock = blocks[guideBlockIndex];
    const requirements = guideBlock.content;

    // 2. 向前查找最近的 heading 块（获取章节标题）
    let sectionTitle = '';
    for (let i = guideBlockIndex - 1; i >= 0; i--) {
      const block = blocks[i];
      if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
        sectionTitle = block.content;
        break;
      }
    }

    if (!sectionTitle) {
      alert('找不到章节标题');
      return;
    }

    // 3. 向后查找下一个 heading 块的索引
    let nextHeadingIndex = blocks.length;
    for (let i = guideBlockIndex + 1; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
        nextHeadingIndex = i;
        break;
      }
    }

    // 4. 标记为正在生成
    setGeneratingIds(prev => new Set(prev).add(guideBlockId));

    logger.log('Generating section:', {
      guideBlockId,
      sectionTitle,
      requirements,
      nextHeadingIndex
    });

    // Show toast notification
    const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const toast = document.createElement('div');
      toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
      }`;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    };

    showToast('🚀 正在生成章节内容...', 'info');

    try {
      // Import the generation function
      const { generateSectionWithWorker } = await import('@/lib/dify-api');

      // Get API configuration from store
      const apiKey = useStore.getState().chapterApiKey;

      if (!apiKey || apiKey === 'app-xxxxxxxxxxxxxxxxxxx') {
        alert('请先在设置中配置"正文写作"的 API Key（NEXT_PUBLIC_DIFY_CHAPTER_KEY）');
        setGeneratingIds(prev => {
          const next = new Set(prev);
          next.delete(guideBlockId);
          return next;
        });
        return;
      }

      // Build full outline string for context
      const fullOutline = outline.map(item => {
        const indent = '  '.repeat(item.level - 1);
        return `${indent}${item.title}`;
      }).join('\n');

      // 5. 删除 guide 块后到下一个 heading 之间的所有旧段落，并添加 loading 占位符
      setBlocks(prev => {
        const newBlocks = [...prev];
        const currentGuideIndex = newBlocks.findIndex(b => b.id === guideBlockId);
        if (currentGuideIndex === -1) return newBlocks;

        // 重新计算下一个 heading 的索引
        let currentNextHeadingIndex = newBlocks.length;
        for (let i = currentGuideIndex + 1; i < newBlocks.length; i++) {
          const block = newBlocks[i];
          if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
            currentNextHeadingIndex = i;
            break;
          }
        }

        // 删除从 guide 块后到下一个 heading 之间的所有块
        const deleteCount = currentNextHeadingIndex - currentGuideIndex - 1;
        if (deleteCount > 0) {
          newBlocks.splice(currentGuideIndex + 1, deleteCount);
          logger.log('Deleted', deleteCount, 'old blocks after guide block');
        }

        // 添加一个 loading 占位符块用于显示流式内容
        const loadingBlockId = `loading-${guideBlockId}`;
        newBlocks.splice(currentGuideIndex + 1, 0, {
          id: loadingBlockId,
          type: 'paragraph',
          content: '',
          properties: { loading: true, isGenerated: true },
          children: [],
        });

        return newBlocks;
      });

      // Track generated content
      let generatedContent = '';
      const loadingBlockId = `loading-${guideBlockId}`;
      let lastUpdateTime = 0;
      const UPDATE_INTERVAL = 300; // 每300ms更新一次，避免更新太频繁

      // Generate content
      await generateSectionWithWorker(
        apiKey,
        sectionTitle,
        documentTopic,
        fullOutline,
        (chunk) => {
          generatedContent += chunk;
          logger.log('Received chunk:', chunk.substring(0, 50));

          // 节流更新：每300ms更新一次 loading 块的内容
          const now = Date.now();
          if (now - lastUpdateTime > UPDATE_INTERVAL) {
            lastUpdateTime = now;
            setBlocks(prev => prev.map(b =>
              b.id === loadingBlockId
                ? { ...b, content: generatedContent }
                : b
            ));
          }
        },
        () => {
          // 生成完成：先确保最后的内容也被显示，然后删除 loading 块并插入最终的段落块
          logger.log('Generation complete. Final content length:', generatedContent.length);

          // 先更新一次最终内容（以防最后几个 chunk 没被节流更新显示）
          setBlocks(prev => prev.map(b =>
            b.id === loadingBlockId
              ? { ...b, content: generatedContent }
              : b
          ));

          // 给一点时间让最终内容显示，然后再替换为段落块
          setTimeout(() => {
            if (!generatedContent || generatedContent.trim().length === 0) {
              logger.warn('⚠️ No content generated');
              showToast('⚠️ 未生成内容，请检查写作指导', 'info');

              // 删除 loading 块
              setBlocks(prev => prev.filter(b => b.id !== loadingBlockId));

              setGeneratingIds(prev => {
                const next = new Set(prev);
                next.delete(guideBlockId);
                return next;
              });
              return;
            }

            // 按段落分割内容（按两个换行符分割）
            const paragraphs = generatedContent
              .split(/\n\s*\n/)
              .filter(p => p.trim().length > 0)
              .map(p => p.trim());

            logger.log('Split into', paragraphs.length, 'paragraphs');

            // 创建新的 paragraph 块
            const newParagraphBlocks: NotionBlock[] = paragraphs.map(paragraph => ({
              id: generateBlockId('paragraph'),
              type: 'paragraph',
              content: paragraph,
              properties: { isGenerated: true },
              children: [],
            }));

            // 替换 loading 块为最终的段落块
            setBlocks(prev => {
              const newBlocks = [...prev];
              const loadingIndex = newBlocks.findIndex(b => b.id === loadingBlockId);
              if (loadingIndex !== -1) {
                // 删除 loading 块，插入新段落块
                newBlocks.splice(loadingIndex, 1, ...newParagraphBlocks);
                logger.log('Replaced loading block with', newParagraphBlocks.length, 'paragraph blocks');
              }
              return newBlocks;
            });

            // 移除生成中标记
            setGeneratingIds(prev => {
              const next = new Set(prev);
              next.delete(guideBlockId);
              return next;
            });

            showToast('✅ 章节内容生成完成!', 'success');
          }, 500); // 等待500ms让用户看到完整的流式内容
        },
        requirements,
        (error) => {
          logger.error('Generation error:', error);
          showToast(`❌ 生成失败: ${error.message}`, 'error');

          // 删除 loading 块
          setBlocks(prev => prev.filter(b => b.id !== loadingBlockId));

          setGeneratingIds(prev => {
            const next = new Set(prev);
            next.delete(guideBlockId);
            return next;
          });
        }
      );
    } catch (error) {
      logger.error('Error generating section:', error);
      showToast(`❌ 生成失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');

      // 删除 loading 块（如果存在）
      const loadingBlockId = `loading-${guideBlockId}`;
      setBlocks(prev => prev.filter(b => b.id !== loadingBlockId));

      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(guideBlockId);
        return next;
      });
    }
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

  // 辅助函数：生成带类型前缀的 ID
  const generateBlockId = (type: string) => {
    const typePrefix = (type === 'h1' || type === 'h2' || type === 'h3') ? 'heading' : type;
    return `${typePrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  // Convert outline to Notion blocks (只执行一次)
  useEffect(() => {
    // 只在首次进入且 blocks 为空时执行
    if (blocks.length > 0) return;
    if (outline.length === 0) return;

    logger.log('📝 首次从 outline 生成 blocks');

    const notionBlocks: NotionBlock[] = [];

    outline.forEach((item) => {
      // 1. 添加标题块
      const titleWithNumber = item.number ? `${item.number} ${item.title}` : item.title;
      const headingType = item.level === 1 ? 'h1' : item.level === 2 ? 'h2' : 'h3';

      notionBlocks.push({
        id: generateBlockId(headingType),
        type: headingType,
        content: titleWithNumber,
        properties: {},
        children: [],
      });

      // 2. 如果有 requirements，添加写作指导块
      if (item.requirements) {
        notionBlocks.push({
          id: generateBlockId('guide'),
          type: 'guide',
          content: item.requirements,
          properties: {},
          children: [],
        });
      }
    });

    setBlocks(notionBlocks);
    logger.log('✅ Blocks 生成完成，共', notionBlocks.length, '个块');
  }, []); // 空依赖数组，只执行一次

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
          usePandoc: true, // 使用 Pandoc 导出（亚信模板）
          templateId: null,
          customTemplateId: null,
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
      logger.error('Export error:', error);
      alert('导出文档失败：' + (error instanceof Error ? error.message : '请重试'));
    }
  };

  return (
    <ErrorBoundary>
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
        className="top-navbar"
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
            minWidth: '100px',
            maxWidth: '300px',
            flex: '1 1 auto',
          }}
          className="document-title-input"
        />

        <div style={{ position: 'relative', display: 'flex', flexShrink: 0, alignItems: 'center', gap: '4px' }}>
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
            className="nav-button export-button"
          >
            <Download style={{ width: '20px', height: '20px', display: 'block', flexShrink: 0 }} />
            <span className="button-text">导出</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            style={{
              userSelect: 'none',
              transition: 'background 20ms ease-in',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '28px',
              width: '28px',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.2,
              color: 'rgba(55, 53, 47, 1)',
              background: 'transparent',
              border: '1px solid rgba(55, 53, 47, 0.15)',
            }}
          >
            <Settings style={{ width: '16px', height: '16px', display: 'block' }} />
          </button>
        </div>
      </nav>

      {/* Main Content Area - Centered Canvas */}
      <div
        style={{
          display: 'flex',
          position: 'relative',
          minHeight: 'calc(100vh - 44px)',
          backgroundColor: '#f7f7f5',
          overflowX: 'auto', // 允许横向滚动
          overflowY: 'auto', // 允许纵向滚动
        }}
        className="main-content-wrapper"
      >
        {/* Notion Editor - Centered Canvas */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            padding: '40px 20px',
            transition: 'all 200ms ease-in-out',
            minWidth: 'fit-content', // 确保内容不被压缩
          }}
        >
          {/* A4-like Canvas Container */}
          <div
            style={{
              width: '100%',
              maxWidth: '800px',
              minWidth: '320px', // 最小宽度，小屏幕时使用滚动
              backgroundColor: '#fff',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              minHeight: '800px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'visible', // 确保内容溢出可见（表格滚动条）
            }}
            className="editor-canvas"
          >
            {/* Document Title */}
            <div style={{ padding: '40px 48px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#37352f', lineHeight: 1.3, marginBottom: '16px' }}>
                {documentTitle}
              </h1>
            </div>

            {/* Editor Content */}
            <div style={{
              padding: '0 48px 48px 48px',
              overflow: 'visible', // 允许表格滚动条显示
              flex: 1
            }}>
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
                  onGenerate={handleGenerateSection}
                  generatingIds={generatingIds}
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
                textAlign: 'center',
                backgroundColor: 'transparent',
                color: 'gray',
                borderTop: '1px solid rgba(55, 53, 47, 0.09)',
              }}
            >
              第 1 页
            </div>
          </div>
        </main>
      </div>

      {/* Text Selection Toolbar */}
      <TextSelectionToolbar onRewrite={handleRewriteText} onFormat={handleFormatText} />

      {/* AI Chat */}
      <AIChat
        onRewriteSection={handleRewriteSection}
        blocks={blocks}
        outline={outline}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

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
    </ErrorBoundary>
  );
}
