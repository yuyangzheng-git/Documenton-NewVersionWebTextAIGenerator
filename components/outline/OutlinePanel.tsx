'use client';

import { useStore } from '@/store/useStore';
import { OutlineTree } from './OutlineTree';
import { X, FileText, Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { generateSectionWithWorker, getDifyAppParameters } from '@/lib/dify-api';

interface OutlinePanelProps {
    onClose?: () => void;
    show?: boolean;
    documentTopic?: string;
}

export function OutlinePanel({ onClose, show = true, documentTopic = '' }: OutlinePanelProps) {
    const { outline, updateItem, deleteItem, reorderItems, chapterApiKey } = useStore();
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch chapter writing bot parameters on mount
    useEffect(() => {
        if (chapterApiKey) {
            getDifyAppParameters(chapterApiKey)
                .then(params => {
                    console.log('Chapter bot parameters:', params);
                })
                .catch(err => {
                    console.error('Failed to get chapter bot parameters:', err);
                });
        }
    }, [chapterApiKey]);

    const handleGenerateChapter = async (itemId: string) => {
        const item = outline.find(i => i.id === itemId);
        if (!item) return;

        try {
            setIsGenerating(true);
            updateItem(itemId, { status: 'generating', content: '' });

            // Build full outline as string
            const fullOutline = outline.map(i => `${i.number ? i.number + ' ' : ''}${i.title}`).join('\n');

            console.log('Generating chapter for:', item.title);
            console.log('Document topic:', documentTopic);
            console.log('Full outline:', fullOutline);
            console.log('Using API key:', chapterApiKey);

            let accumulatedContent = '';

            await generateSectionWithWorker(
                chapterApiKey,
                item.title,
                documentTopic,
                fullOutline,
                (text: string) => {
                    accumulatedContent += text;
                    console.log('Received chunk:', text.substring(0, 50) + '...');
                    // Real-time update of content in outline
                    updateItem(itemId, { content: accumulatedContent });
                },
                () => {
                    updateItem(itemId, { status: 'completed' });
                    setIsGenerating(false);
                    console.log('Chapter generation completed');
                },
                (error: Error) => {
                    console.error('生成章节失败:', error);
                    updateItem(itemId, { status: 'pending' });
                    setIsGenerating(false);
                    alert(`生成失败: ${error.message}`);
                }
            );
        } catch (error) {
            console.error('生成章节失败:', error);
            updateItem(itemId, { status: 'pending' });
            setIsGenerating(false);
            alert(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
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
