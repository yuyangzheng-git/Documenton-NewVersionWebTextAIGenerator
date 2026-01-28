'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { AIChat } from '@/components/AIChat';
import { TextSelectionToolbar } from '@/components/TextSelectionToolbar';
import { NotionEditor, NotionBlock } from '@/components/NotionEditor';
import { SettingsModal } from '@/components/SettingsModal';
import { ChevronLeft, Palette, Download, Upload, Settings, FileText } from 'lucide-react';
import { WORD_TEMPLATES } from '@/lib/word-templates';
import { StreamingMarkdownParser } from '@/lib/streaming-markdown-parser';
import { StreamingMarkdownHandler } from '@/lib/streaming-markdown-handler';

export default function WordEditorPage() {
  const router = useRouter();
  const { outline, documentTitle, setDocumentTitle, updateItem } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState('simple-white');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [blocks, setBlocks] = useState<NotionBlock[]>([]);
  const [documentTopic, setDocumentTopic] = useState('');
  const [customTemplateId, setCustomTemplateId] = useState<string | null>(null);
  const [customTemplateName, setCustomTemplateName] = useState<string | null>(null);
  const [showCustomTemplate, setShowCustomTemplate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

    // If updating guide block, sync to outline (for level 2 items before generation)
    if (id.startsWith('guide-')) {
      const outlineItemId = id.replace('guide-', '');
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

  // Handle generate section button click
  const handleGenerateSection = async (headingBlockId: string) => {
    // Extract outline item ID from heading block ID (heading-{itemId})
    const outlineItemId = headingBlockId.replace('heading-', '');

    // Find the outline item
    const outlineItem = outline.find(item => item.id === outlineItemId);
    if (!outlineItem) {
      console.error('Outline item not found:', outlineItemId);
      alert('找不到对应的大纲项');
      return;
    }

    // Find the guide block to get requirements
    const guideBlock = blocks.find(b => b.id === `guide-${outlineItemId}`);
    const requirements = guideBlock?.content || outlineItem.requirements || '';

    console.log('Generating section:', {
      outlineItemId,
      title: outlineItem.title,
      requirements
    });

    // Confirm with user before overwriting
    if (outlineItem.content) {
      const confirmOverwrite = confirm(
        `⚠️ 该章节已有内容，重新生成将覆盖现有内容。\n\n标题: ${outlineItem.title}\n\n是否继续?`
      );
      if (!confirmOverwrite) return;
    }

    // Show toast notification
    const toastId = `toast-${Date.now()}`;
    const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const toast = document.createElement('div');
      toast.id = toastId;
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
      const { getDifyApiBaseUrl } = await import('@/lib/dify-api');

      // Get API configuration from store
      // Use chapterApiKey for chapter generation, DO NOT fallback to apiKey (outline key)
      const apiKey = useStore.getState().chapterApiKey;
      const apiUrl = getDifyApiBaseUrl();

      if (!apiKey || apiKey === 'app-xxxxxxxxxxxxxxxxxxx') {
        alert('请先在设置中配置"正文写作"的 API Key（NEXT_PUBLIC_DIFY_CHAPTER_KEY）');
        return;
      }

      // Build full outline string for context
      const fullOutline = outline.map(item => {
        const indent = '  '.repeat(item.level - 1);
        return `${indent}${item.title}`;
      }).join('\n');

      // Track the content as it streams in
      let generatedContent = '';

      // 创建流式 Markdown 处理器
      const markdownHandler = new StreamingMarkdownHandler();
      markdownHandler.setThrottleDelay(500); // 增加节流延迟到 500ms 减少闪烁

      // 用于跟踪已创建的块ID映射
      const blockIdMap = new Map<number, string>(); // 索引 -> 块ID

      // 设置解析回调 - 实时解析并更新块（AppFlowy 风格）
      markdownHandler.setOnComplete(() => {
        // 获取缓冲区的原始 Markdown
        const currentMarkdown = markdownHandler.getBuffer();

        // 使用 StreamingMarkdownParser 实时解析
        const parser = new StreamingMarkdownParser();
        const markdownBlocks = parser.parseComplete(currentMarkdown);
        console.log('🔄 Streaming blocks:', markdownBlocks.map(b => ({ type: b.type, hasTableData: !!b.properties?.tableData })));

        // 实时更新块结构（AppFlowy 的增量更新机制）
        setBlocks(prevBlocks => {
          const newBlocks = [...prevBlocks];

          // 找到流式内容的起始位置
          const guideBlockId = `guide-${outlineItemId}`;
          const guideBlockIndex = newBlocks.findIndex(b => b.id === guideBlockId);

          if (guideBlockIndex === -1) return newBlocks;

          // 移除之前的流式生成块（从guide block之后到下一个heading之前）
          let removeStartIndex = guideBlockIndex + 1;
          let removeEndIndex = removeStartIndex;

          for (let i = removeStartIndex; i < newBlocks.length; i++) {
            const block = newBlocks[i];
            // Stop at next heading
            if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
              removeEndIndex = i;
              break;
            }
            // Remove if it's generating, loading, or previously generated for this item
            const isGeneratedForThisItem = block.id.startsWith(`generated-${outlineItemId}-`) ||
                                          block.id.startsWith(`streaming-${outlineItemId}-`);
            if (block.properties?.isGenerating ||
                block.properties?.loading ||
                isGeneratedForThisItem) {
              removeEndIndex = i + 1;
            } else {
              // Stop if we hit an unrelated block
              break;
            }
          }

          // 删除旧的生成中的块
          if (removeEndIndex > removeStartIndex) {
            newBlocks.splice(removeStartIndex, removeEndIndex - removeStartIndex);
          }

          // 创建新的块（包括表格块）
          const newContentBlocks = markdownBlocks.map((mdBlock, index) => {
            // 为每个块生成或复用稳定的ID
            let blockId = blockIdMap.get(index);
            if (!blockId) {
              blockId = `streaming-${outlineItemId}-${mdBlock.type}-${index}`;
              blockIdMap.set(index, blockId);
            }

            const notionBlock: any = {
              id: blockId,
              type: mdBlock.type,
              content: mdBlock.content,
              properties: {
                ...(mdBlock.properties || {}),
                isGenerating: true,
                isGenerated: true
              },
              children: []
            };

            // 特殊处理表格：解析为 SimpleTableBlockData
            if (mdBlock.type === 'table' && mdBlock.properties?.tableData) {
              notionBlock.properties.tableData = mdBlock.properties.tableData;
            }

            return notionBlock;
          });

          // 在 guide block 之后插入新块
          newBlocks.splice(guideBlockIndex + 1, 0, ...newContentBlocks);

          return newBlocks;
        });
      });

      // Find current heading block index
      const headingBlockIndex = blocks.findIndex(b => b.id === headingBlockId);
      if (headingBlockIndex === -1) return;

      // Remove existing content blocks for this section (but keep the guide block)
      setBlocks(prevBlocks => {
        const newBlocks = [...prevBlocks];
        const startIndex = headingBlockIndex + 1;

        // Find the next heading block of same or higher level
        let endIndex = newBlocks.length;
        for (let i = startIndex; i < newBlocks.length; i++) {
          const block = newBlocks[i];
          if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
            endIndex = i;
            break;
          }
        }

        // Remove content blocks except the guide block (keep guide-{outlineItemId})
        const guideBlockId = `guide-${outlineItemId}`;
        const blocksToRemove: string[] = [];
        for (let i = startIndex; i < endIndex; i++) {
          if (newBlocks[i].id !== guideBlockId) {
            blocksToRemove.push(newBlocks[i].id);
          }
        }

        // Remove blocks in reverse order to preserve indices
        blocksToRemove.reverse().forEach(blockId => {
          const idx = newBlocks.findIndex(b => b.id === blockId);
          if (idx !== -1) {
            newBlocks.splice(idx, 1);
          }
        });

        // If guide block doesn't exist, create it
        const guideBlockIndex = newBlocks.findIndex(b => b.id === guideBlockId);
        if (guideBlockIndex === -1) {
          newBlocks.splice(startIndex, 0, {
            id: guideBlockId,
            type: 'callout',
            content: requirements || '',
            properties: {
              icon: '💡',
              color: '#fff9c4'
            },
            children: []
          });
        }

        // Add a loading placeholder after the guide block
        const newGuideBlockIndex = newBlocks.findIndex(b => b.id === guideBlockId);
        newBlocks.splice(newGuideBlockIndex + 1, 0, {
          id: `loading-${outlineItemId}-${Date.now()}`,
          type: 'paragraph',
          content: '正在生成内容...',
          properties: { loading: true, isGenerating: true },
          children: []
        });

        return newBlocks;
      });

      // Generate content
      await generateSectionWithWorker(
        apiKey,
        outlineItem.title,
        documentTopic,
        fullOutline,
        (chunk) => {
          // 使用流式处理器追加内容（会自动处理节流和解析）
          markdownHandler.append(chunk);
          generatedContent += chunk;
          console.log('Received chunk:', chunk);
        },
        () => {
          // On complete, convert markdown to blocks and replace streaming blocks
          console.log('Generation complete. Final content:', generatedContent);

          // Use streaming markdown parser for final block conversion
          const parser = new StreamingMarkdownParser();
          const markdownBlocks = parser.parseComplete(generatedContent);
          console.log('📊 Parsed markdown blocks:', markdownBlocks.map(b => ({ type: b.type, hasTableData: !!b.properties?.tableData })));

          const newContentBlocks = StreamingMarkdownParser.toNotionBlocks(markdownBlocks, `generated-${outlineItemId}`);
          console.log('📊 Converted notion blocks:', newContentBlocks.map(b => ({ type: b.type, hasTableData: !!b.properties?.tableData })));

          // Mark all generated blocks as isGenerated (remove isGenerating flag)
          newContentBlocks.forEach(block => {
            block.properties = { ...block.properties, isGenerated: true, isGenerating: false };
          });

          console.log('📊 After marking as generated:', newContentBlocks.map(b => ({ type: b.type, hasTableData: !!b.properties?.tableData })));

          // Replace streaming blocks with final structured blocks
          setBlocks(prevBlocks => {
            const newBlocks = [...prevBlocks];

            // Find the range of streaming/generating blocks
            const guideBlockId = `guide-${outlineItemId}`;
            const guideBlockIndex = newBlocks.findIndex(b => b.id === guideBlockId);

            console.log('📍 Guide block index:', guideBlockIndex);

            if (guideBlockIndex !== -1) {
              // Remove all blocks after guide block that belong to this outline item
              // This includes: isGenerating, loading, and previously generated blocks
              let removeCount = 0;
              for (let i = guideBlockIndex + 1; i < newBlocks.length; i++) {
                const block = newBlocks[i];
                // Stop at next heading
                if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
                  break;
                }
                // Remove if it's generating, loading, or a previously generated block for this item
                const isGeneratedForThisItem = block.id.startsWith(`generated-${outlineItemId}-`);
                if (block.properties?.isGenerating ||
                    block.properties?.loading ||
                    isGeneratedForThisItem) {
                  removeCount++;
                } else {
                  // Stop if we hit a block that's not related to this generation
                  break;
                }
              }

              console.log('🗑️ Removing', removeCount, 'blocks');
              console.log('➕ Adding', newContentBlocks.length, 'blocks');
              console.log('➕ New blocks types:', newContentBlocks.map(b => b.type));
              console.log('➕ New blocks with tableData:', newContentBlocks.filter(b => b.properties?.tableData).length);

              // Replace with final blocks
              newBlocks.splice(guideBlockIndex + 1, removeCount, ...newContentBlocks);
            }

            return newBlocks;
          });

          // Update outline with generated content
          updateItem(outlineItemId, { content: generatedContent, paragraphs: newContentBlocks.filter(b => b.type === 'paragraph').map(b => b.content) });

          // Show success toast
          showToast('✅ 章节内容生成完成!', 'success');

          // Reset handler for next use
          markdownHandler.reset();
          blockIdMap.clear();
        },
        requirements,
        (error) => {
          console.error('Generation error:', error);
          showToast(`❌ 生成失败: ${error.message}`, 'error');

          // Remove loading placeholder
          setBlocks(prevBlocks => prevBlocks.filter(b => !b.properties.loading));

          // Reset handler
          markdownHandler.reset();
        }
      );
    } catch (error) {
      console.error('Error generating section:', error);
      showToast(`❌ 生成失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');

      // Remove loading placeholder
      setBlocks(prevBlocks => prevBlocks.filter(b => !b.properties.loading));
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

      // Only level 2 and level 3 items show requirements (before content is generated)
      // Level 1 items don't show requirements
      // Level 2 items with children (level 3) also don't show requirements
      const hasNextItemAsChild = index + 1 < uniqueOutline.length &&
                                 uniqueOutline[index + 1].level > item.level;

      // Add guide block and generated content for items with requirements
      // IMPORTANT: Don't check !item.content because content is set after generation completes
      if ((item.level === 2 || item.level === 3) && item.requirements && !hasNextItemAsChild) {
        // Check if this guide block already exists and preserve user's edits
        const existingBlock = blocks.find(b => b.id === `guide-${item.id}`);
        const guideBlockId = `guide-${item.id}`;

        if (existingBlock) {
          // Keep the existing block only if it hasn't been added yet
          if (!generatedBlockIds.has(existingBlock.id)) {
            notionBlocks.push(existingBlock);
            generatedBlockIds.add(existingBlock.id);
          }
        } else if (!generatedBlockIds.has(guideBlockId)) {
          notionBlocks.push({
            id: guideBlockId,
            type: 'guide',
            content: item.requirements,
            properties: {},
            children: [],
          });
          generatedBlockIds.add(guideBlockId);
        }

        // Insert generated blocks for this item right after the guide block
        // This ensures generated content appears immediately after the guide block
        const itemGeneratedBlocks = blocks.filter(b =>
          b.id.startsWith(`generated-${item.id}-`) &&
          b.properties?.isGenerated &&
          !generatedBlockIds.has(b.id)
        );

        if (itemGeneratedBlocks.length > 0) {
          console.log(`📦 Adding ${itemGeneratedBlocks.length} generated blocks after guide-${item.id}`);
          itemGeneratedBlocks.forEach(genBlock => {
            notionBlocks.push(genBlock);
            generatedBlockIds.add(genBlock.id);
          });
        }
      }

      // Add content blocks if exists
      // But skip if we already have generated blocks for this item (to avoid duplication)
      const hasGeneratedBlocks = blocks.some(b =>
        b.id.startsWith(`generated-${item.id}-`) && b.properties?.isGenerated
      );

      if (item.content && !hasGeneratedBlocks) {
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

      // Add placeholder paragraph after each heading for easy editing
      // Only for level 1 items AND no content AND no requirements AND no child sections
      if (item.level === 1 && !item.content && !item.requirements && !hasNextItemAsChild) {
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
      ...uniqueOutline.map(item => `guide-${item.id}`),
      ...uniqueOutline.flatMap(item => item.paragraphs ? item.paragraphs.map((_, idx) => `content-${item.id}-p${idx}`) : []),
      ...uniqueOutline.map(item => `content-${item.id}`),
      ...uniqueOutline.map(item => `placeholder-${item.id}`),
    ]);

    // Find user-created blocks
    // Exclude blocks that are generated from streaming (start with "generated-")
    const userCreatedBlocks = blocks.filter(b =>
      !outlineItemIds.has(b.id) && !b.id.startsWith('generated-')
    );

    // Insert user-created blocks at their correct positions
    // We need to check the current blocks array to find the position
    userCreatedBlocks.forEach(userBlock => {
      // Skip if this block ID is already in notionBlocks
      if (generatedBlockIds.has(userBlock.id)) {
        console.warn('Skipping duplicate user-created block:', userBlock.id);
        return;
      }

      // Find where this block was in the current blocks array
      const currentIndex = blocks.findIndex(b => b.id === userBlock.id);
      if (currentIndex === -1) return;

      // Find the block before this user block in the current array
      const previousBlockId = currentIndex > 0 ? blocks[currentIndex - 1].id : null;

      if (previousBlockId) {
        // Find the position in notionBlocks where we should insert this user block
        const insertPosition = notionBlocks.findIndex(nb => nb.id === previousBlockId);
        if (insertPosition !== -1) {
          notionBlocks.splice(insertPosition + 1, 0, userBlock);
          generatedBlockIds.add(userBlock.id);
        } else {
          // If we can't find the position, add it at the end
          notionBlocks.push(userBlock);
          generatedBlockIds.add(userBlock.id);
        }
      } else {
        // Add at the beginning
        notionBlocks.unshift(userBlock);
        generatedBlockIds.add(userBlock.id);
      }
    });

    // Preserve generated streaming blocks (including tables) that weren't already inserted
    // These are blocks that might not have a guide block (edge case)
    // Only keep blocks that belong to outline items that still exist
    const validOutlineIds = new Set(uniqueOutline.map(item => item.id));
    const remainingGeneratedBlocks = blocks.filter(b => {
      if (!b.id.startsWith('generated-') || !b.properties?.isGenerated) {
        return false;
      }

      // Skip if already added
      if (generatedBlockIds.has(b.id)) {
        return false;
      }

      // Extract outlineItemId from block ID: "generated-{outlineItemId}-..."
      const idParts = b.id.split('-');
      if (idParts.length < 3) return false;

      const outlineItemId = idParts[1]; // Second part is the outlineItemId

      // Only keep blocks that belong to existing outline items
      return validOutlineIds.has(outlineItemId);
    });

    console.log('🔍 Remaining generated blocks to insert:', {
      total: blocks.filter(b => b.id.startsWith('generated-')).length,
      alreadyInserted: Array.from(generatedBlockIds).filter(id => id.startsWith('generated-')).length,
      remaining: remainingGeneratedBlocks.length,
      remainingIds: remainingGeneratedBlocks.map(b => b.id)
    });

    // Insert remaining generated blocks at their correct positions (fallback)
    remainingGeneratedBlocks.forEach(genBlock => {
      // Find where this block was in the current blocks array
      const currentIndex = blocks.findIndex(b => b.id === genBlock.id);
      if (currentIndex === -1) return;

      // Find the block before this generated block in the current array
      const previousBlockId = currentIndex > 0 ? blocks[currentIndex - 1].id : null;

      if (previousBlockId) {
        // Find the position in notionBlocks where we should insert this generated block
        const insertPosition = notionBlocks.findIndex(nb => nb.id === previousBlockId);
        if (insertPosition !== -1) {
          notionBlocks.splice(insertPosition + 1, 0, genBlock);
          generatedBlockIds.add(genBlock.id);
          console.log(`📌 Inserted generated block ${genBlock.id} after ${previousBlockId}`);
        } else {
          // If we can't find the position, add it at the end
          notionBlocks.push(genBlock);
          generatedBlockIds.add(genBlock.id);
          console.warn(`⚠️ Could not find position for ${genBlock.id}, added at end`);
        }
      } else {
        // Add at the beginning
        notionBlocks.unshift(genBlock);
        generatedBlockIds.add(genBlock.id);
      }
    });

    // Check for duplicate IDs in notionBlocks before updating
    const finalBlockIds = new Set<string>();
    const duplicateBlocks: string[] = [];
    notionBlocks.forEach(block => {
      if (finalBlockIds.has(block.id)) {
        duplicateBlocks.push(block.id);
      } else {
        finalBlockIds.add(block.id);
      }
    });

    if (duplicateBlocks.length > 0) {
      console.error('Duplicate block IDs found:', duplicateBlocks);
      console.error('All block IDs:', notionBlocks.map(b => b.id));
    }

    // Only update if blocks are different to avoid unnecessary re-renders
    const currentIds = new Set(blocks.map(b => b.id));
    const newIds = new Set(notionBlocks.map(b => b.id));

    // Check if any new blocks were added (user created them)
    const hasNewBlocks = notionBlocks.some(b => !currentIds.has(b.id));

    // Check if any blocks from current state are missing in new state
    const hasMissingBlocks = blocks.some(b => !newIds.has(b.id));

    console.log('useEffect outline -> blocks:', {
      prevLen: blocks.length,
      newLen: notionBlocks.length,
      hasNewBlocks,
      hasMissingBlocks,
      userCreatedCount: userCreatedBlocks.length,
      duplicates: duplicateBlocks,
      newBlockIds: notionBlocks.filter(b => !currentIds.has(b.id)).map(b => b.id)
    });

    // Remove duplicates from notionBlocks before updating
    const uniqueNotionBlocks = notionBlocks.filter((block, index, self) =>
      index === self.findIndex(b => b.id === block.id)
    );

    if (duplicateBlocks.length > 0) {
      console.warn('Removing duplicate blocks:', duplicateBlocks);
    }

    // Update if: new blocks were added OR blocks are missing OR there are duplicates
    if (hasNewBlocks || hasMissingBlocks || duplicateBlocks.length > 0) {
      console.log('Updating blocks (preserving user edits)');
      setBlocks(uniqueNotionBlocks);
    } else if (JSON.stringify(notionBlocks.map(b => b.id)) !== JSON.stringify(blocks.map(b => b.id))) {
      // If only order changed, update
      console.log('Updating blocks (order changed)');
      setBlocks(uniqueNotionBlocks);
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
            className="nav-button template-button"
          >
            <Palette style={{ width: '20px', height: '20px', display: 'block', fill: 'rgba(55, 53, 47, 0.65)', flexShrink: 0 }} />
            <span className="button-text">{currentTemplate.name}</span>
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
  );
}
