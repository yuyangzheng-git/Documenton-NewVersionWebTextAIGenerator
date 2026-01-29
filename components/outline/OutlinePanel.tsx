'use client';

import { useStore } from '@/store/useStore';
import { OutlineTree } from './OutlineTree';
import { X, FileText, Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { generateSectionWithWorker, getDifyAppParameters } from '@/lib/dify-api';
import { createAIProvider } from '@/lib/ai/provider-factory';
import { OutlineItem } from '@/store/useStore';
import { logger } from '@/lib/logger';

interface OutlinePanelProps {
    onClose?: () => void;
    show?: boolean;
    documentTopic?: string;
}

export function OutlinePanel({ onClose, show = true, documentTopic = '' }: OutlinePanelProps) {
    const { outline, updateItem, deleteItem, reorderItems, chapterApiKey, aiPlatform,
        openaiApiKey, openaiModel, openaiBaseUrl,
        geminiApiKey, geminiModel, geminiBaseUrl,
        kimiApiKey, kimiModel, kimiBaseUrl,
        qwenApiKey, qwenModel, qwenBaseUrl } = useStore();

    // Fetch chapter writing bot parameters on mount (only for Dify)
    useEffect(() => {
        if (aiPlatform === 'dify' && chapterApiKey) {
            getDifyAppParameters(chapterApiKey)
                .then(params => {
                    logger.log('Chapter bot parameters:', params);
                })
                .catch(err => {
                    logger.error('Failed to get chapter bot parameters:', err);
                });
        }
    }, [chapterApiKey, aiPlatform]);

    const handleGenerateChapter = async (itemId: string) => {
        const item = outline.find(i => i.id === itemId);
        if (!item) return;

        // Check if this item has children (next item has higher level)
        const itemIndex = outline.findIndex(i => i.id === itemId);
        const hasNextItemAsChild = itemIndex + 1 < outline.length &&
                                 outline[itemIndex + 1].level > item.level;

        // If item has children, generate all child sections recursively
        if (hasNextItemAsChild) {
            await generateAllChildren(itemId);
            return;
        }

        // Otherwise, generate this single chapter
        try {
            setIsGenerating(true);
            updateItem(itemId, { status: 'generating', content: '' });

            // Build full outline as string
            const fullOutline = outline.map(i => `${i.number ? i.number + ' ' : ''}${i.title}`).join('\n');

            logger.log('Generating chapter for:', item.title);
            logger.log('Document topic:', documentTopic);
            logger.log('Full outline:', fullOutline);
            logger.log('Requirements:', item.requirements || '(none)');
            logger.log('Using platform:', aiPlatform);

            let accumulatedContent = '';
            let paragraphBuffer = '';

            if (aiPlatform === 'dify') {
                await generateSectionWithWorker(
                    chapterApiKey,
                    item.title,
                    documentTopic,
                    fullOutline,
                    (text: string) => {
                        accumulatedContent += text;
                        paragraphBuffer += text;
                        logger.log('Received chunk:', text.substring(0, 50) + '...');
                        // Real-time update of content in outline
                        updateItem(itemId, { content: accumulatedContent });
                    },
                    () => {
                        // 生成完成：将内容按段落分割为多个块
                        const paragraphs = accumulatedContent
                            .split(/(\n\s*\n|\n{2,})/g)
                            .filter(p => {
                                const trimmed = p.trim();
                                return trimmed && !trimmed.match(/^\s*$/);
                            })
                            .map(p => p.replace(/\s+/g, ' ').trim());

                        // 将段落列表存储在 outline item 的 metadata 中
                        updateItem(itemId, {
                            status: 'completed',
                            content: accumulatedContent,
                            paragraphs: paragraphs
                        });
                        setIsGenerating(false);
                        logger.log('Chapter generation completed, paragraphs:', paragraphs.length);
                    },
                    item.requirements,
                    (error: Error) => {
                        logger.error('生成章节失败:', error);
                        updateItem(itemId, { status: 'pending' });
                        setIsGenerating(false);
                        alert(`生成失败: ${error.message}`);
                    }
                );
            } else {
                // Use AI Provider for other platforms
                let config: any;
                switch (aiPlatform) {
                    case 'openai':
                        config = { apiKey: openaiApiKey, model: openaiModel, baseUrl: openaiBaseUrl };
                        break;
                    case 'gemini':
                        config = { apiKey: geminiApiKey, model: geminiModel, baseUrl: geminiBaseUrl };
                        break;
                    case 'kimi':
                        config = { apiKey: kimiApiKey, model: kimiModel, baseUrl: kimiBaseUrl };
                        break;
                    case 'qwen':
                        config = { apiKey: qwenApiKey, model: qwenModel, baseUrl: qwenBaseUrl };
                        break;
                    default:
                        throw new Error(`Unsupported platform: ${aiPlatform}`);
                }

                const provider = createAIProvider(aiPlatform, config.baseUrl);
                await provider.generateContent(
                    {
                        sectionTitle: item.title,
                        documentTopic: documentTopic,
                        fullOutline: fullOutline,
                        requirements: item.requirements,
                    },
                    config,
                    (chunk) => {
                        accumulatedContent += chunk.text;
                        updateItem(itemId, { content: accumulatedContent });
                    },
                    () => {
                        // 生成完成：将内容按段落分割为多个块
                        const paragraphs = accumulatedContent
                            .split(/(\n\s*\n|\n{2,})/g)
                            .filter(p => {
                                const trimmed = p.trim();
                                return trimmed && !trimmed.match(/^\s*$/);
                            })
                            .map(p => p.replace(/\s+/g, ' ').trim());

                        updateItem(itemId, {
                            status: 'completed',
                            content: accumulatedContent,
                            paragraphs: paragraphs
                        });
                        setIsGenerating(false);
                        logger.log('Chapter generation completed, paragraphs:', paragraphs.length);
                    },
                    (error: Error) => {
                        logger.error('生成章节失败:', error);
                        updateItem(itemId, { status: 'pending' });
                        setIsGenerating(false);
                        alert(`生成失败: ${error.message}`);
                    }
                );
            }
        } catch (error) {
            logger.error('生成章节失败:', error);
            updateItem(itemId, { status: 'pending' });
            setIsGenerating(false);
            alert(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    };

    // Generate all child sections recursively
    const generateAllChildren = async (parentId: string) => {
        const parentIndex = outline.findIndex(i => i.id === parentId);
        if (parentIndex === -1) return;

        const parentLevel = outline[parentIndex].level;

        // Find all child sections (items with higher level until next sibling or lower level)
        const childItems: OutlineItem[] = [];
        for (let i = parentIndex + 1; i < outline.length; i++) {
            const currentItem = outline[i];
            if (currentItem.level > parentLevel) {
                childItems.push(currentItem);
            } else {
                // Found next sibling or parent, stop
                break;
            }
        }

        logger.log(`Found ${childItems.length} child sections to generate for ${outline[parentIndex].title}`);

        // Get provider config based on platform
        let config: any;
        if (aiPlatform === 'dify') {
            config = { apiKey: chapterApiKey };
        } else {
            switch (aiPlatform) {
                case 'openai':
                    config = { apiKey: openaiApiKey, model: openaiModel, baseUrl: openaiBaseUrl };
                    break;
                case 'gemini':
                    config = { apiKey: geminiApiKey, model: geminiModel, baseUrl: geminiBaseUrl };
                    break;
                case 'kimi':
                    config = { apiKey: kimiApiKey, model: kimiModel, baseUrl: kimiBaseUrl };
                    break;
                case 'qwen':
                    config = { apiKey: qwenApiKey, model: qwenModel, baseUrl: qwenBaseUrl };
                    break;
            }
        }

        const provider = aiPlatform !== 'dify' ? createAIProvider(aiPlatform, config.baseUrl) : null;

        // Generate each child section sequentially
        for (const childItem of childItems) {
            if (childItem.content) {
                logger.log(`Skipping ${childItem.title} - already has content`);
                continue;
            }

            try {
                setIsGenerating(true);
                updateItem(childItem.id, { status: 'generating', content: '' });

                const fullOutline = outline.map(i => `${i.number ? i.number + ' ' : ''}${i.title}`).join('\n');

                logger.log('Generating chapter for:', childItem.title);
                logger.log('Requirements:', childItem.requirements || '(none)');

                let accumulatedContent = '';

                if (aiPlatform === 'dify') {
                    await generateSectionWithWorker(
                        chapterApiKey,
                        childItem.title,
                        documentTopic,
                        fullOutline,
                        (text: string) => {
                            accumulatedContent += text;
                            updateItem(childItem.id, { content: accumulatedContent });
                        },
                        () => {
                            // 生成完成：将内容按段落分割为多个块
                            const paragraphList = accumulatedContent
                                .split(/(\n\s*\n|\n{2,})/g)
                                .filter(p => {
                                    const trimmed = p.trim();
                                    return trimmed && !trimmed.match(/^\s*$/);
                                })
                                .map(p => p.replace(/\s+/g, ' ').trim());

                            // 将段落列表存储在 outline item 的 metadata 中
                            updateItem(childItem.id, {
                                status: 'completed',
                                content: accumulatedContent,
                                paragraphs: paragraphList
                            });
                            logger.log('Chapter generation completed:', childItem.title, 'paragraphs:', paragraphList.length);
                        },
                        childItem.requirements,
                        (error: Error) => {
                            logger.error('生成章节失败:', error);
                            updateItem(childItem.id, { status: 'pending' });
                            alert(`生成失败: ${childItem.title} - ${error.message}`);
                        }
                    );
                } else {
                    await provider!.generateContent(
                        {
                            sectionTitle: childItem.title,
                            documentTopic: documentTopic,
                            fullOutline: fullOutline,
                            requirements: childItem.requirements,
                        },
                        config,
                        (chunk) => {
                            accumulatedContent += chunk.text;
                            updateItem(childItem.id, { content: accumulatedContent });
                        },
                        () => {
                            const paragraphList = accumulatedContent
                                .split(/(\n\s*\n|\n{2,})/g)
                                .filter(p => {
                                    const trimmed = p.trim();
                                    return trimmed && !trimmed.match(/^\s*$/);
                                })
                                .map(p => p.replace(/\s+/g, ' ').trim());

                            updateItem(childItem.id, {
                                status: 'completed',
                                content: accumulatedContent,
                                paragraphs: paragraphList
                            });
                            logger.log('Chapter generation completed:', childItem.title, 'paragraphs:', paragraphList.length);
                        },
                        (error: Error) => {
                            logger.error('生成章节失败:', error);
                            updateItem(childItem.id, { status: 'pending' });
                            alert(`生成失败: ${childItem.title} - ${error.message}`);
                        }
                    );
                }
            } catch (error) {
                logger.error('生成章节失败:', error);
                updateItem(childItem.id, { status: 'pending' });
                alert(`生成失败: ${childItem.title} - ${error instanceof Error ? error.message : '未知错误'}`);
            }
        }

        setIsGenerating(false);
        logger.log('All child chapters generation completed');
    };

    if (!show) return null;

    return (
        <div
            style={{
                position: 'fixed',
                right: 0,
                top: 44,
                bottom: 0,
                width: '320px',
                backgroundColor: 'white',
                borderLeft: '1px solid rgba(55, 53, 47, 0.09)',
                boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.05)',
                zIndex: 40,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 200ms ease-in-out',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wand2 style={{ width: '20px', height: '20px', color: 'rgba(55, 53, 47, 0.65)' }} />
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(55, 53, 47, 1)' }}>
                        文档大纲
                    </span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(55, 53, 47, 0.4)',
                            borderRadius: '4px',
                            transition: 'background 100ms ease-in-out',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(55, 53, 47, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <X style={{ width: '18px', height: '18px' }} />
                    </button>
                )}
            </div>

            {/* Outline Content */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px 0',
                }}
            >
                {outline.length === 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'rgba(55, 53, 47, 0.4)',
                            fontSize: '14px',
                            padding: '24px',
                            textAlign: 'center',
                        }}
                    >
                        <FileText style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
                        <p>暂无大纲内容</p>
                        <p style={{ fontSize: '12px', marginTop: '8px' }}>请在首页输入文档需求生成大纲</p>
                    </div>
                ) : (
                    <OutlineTree
                        items={outline}
                        onUpdate={updateItem}
                        onDelete={deleteItem}
                        onReorder={reorderItems}
                        onGenerateChapter={handleGenerateChapter}
                    />
                )}
            </div>

            {/* Footer - Stats */}
            <div
                style={{
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(55, 53, 47, 0.09)',
                    fontSize: '12px',
                    color: 'rgba(55, 53, 47, 0.5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <span>共 {outline.length} 个章节</span>
                <span>
                    {outline.filter((item) => item.status === 'completed').length} 已完成
                </span>
            </div>
        </div>
    );
}
