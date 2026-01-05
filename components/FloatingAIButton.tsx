'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { generateContent } from '@/store/useDocumentActions';

interface FloatingAIButtonProps {
    onGenerateAll?: () => void;
}

export function FloatingAIButton({ onGenerateAll }: FloatingAIButtonProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCount, setGeneratedCount] = useState(0);
    const { outline, updateItem } = useStore();

    const handleGenerateAll = async () => {
        if (isGenerating) return;

        // Get only level 2 items (subsections) to generate content for
        const level2Items = outline.filter((item) => item.level === 2 && item.status !== 'completed');

        if (level2Items.length === 0) {
            alert('没有需要生成内容的章节');
            return;
        }

        setIsGenerating(true);
        setGeneratedCount(0);

        try {
            for (const item of level2Items) {
                // Update status to generating
                updateItem(item.id, { status: 'generating' });

                // Generate content
                await generateContent(
                    item,
                    (chunk) => {
                        // Update content as it streams in
                        const currentContent = outline.find((i) => i.id === item.id)?.content || '';
                        updateItem(item.id, { content: currentContent + chunk });
                    },
                    () => {
                        // Update status to completed
                        updateItem(item.id, { status: 'completed' });
                        setGeneratedCount((prev) => prev + 1);
                    }
                );
            }

            setIsExpanded(false);
            if (onGenerateAll) {
                onGenerateAll();
            }
        } catch (error) {
            console.error('Error generating content:', error);
            alert('生成内容时出错，请检查 API Key 设置');
        } finally {
            setIsGenerating(false);
            setGeneratedCount(0);
        }
    };

    const handleGenerateSingle = async (itemId: string) => {
        const item = outline.find((i) => i.id === itemId);
        if (!item || item.status === 'completed') return;

        setIsGenerating(true);

        try {
            updateItem(itemId, { status: 'generating' });

            await generateContent(
                item,
                (chunk) => {
                    const currentContent = outline.find((i) => i.id === itemId)?.content || '';
                    updateItem(itemId, { content: currentContent + chunk });
                },
                () => {
                    updateItem(itemId, { status: 'completed' });
                }
            );
        } catch (error) {
            console.error('Error generating content:', error);
            alert('生成内容时出错');
        } finally {
            setIsGenerating(false);
        }
    };

    const level2Items = outline.filter((item) => item.level === 2);
    const completedCount = level2Items.filter((item) => item.status === 'completed').length;
    const totalCount = level2Items.length;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '12px',
            }}
        >
            {/* Expanded Menu */}
            {isExpanded && (
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(55, 53, 47, 0.09)',
                        padding: '16px',
                        minWidth: '280px',
                        animation: 'slideUp 200ms ease-out',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px',
                        }}
                    >
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(55, 53, 47, 1)' }}>
                            AI 内容生成
                        </span>
                        <button
                            onClick={() => setIsExpanded(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'rgba(55, 53, 47, 0.4)',
                                padding: 0,
                            }}
                        >
                            <X style={{ width: '16px', height: '16px' }} />
                        </button>
                    </div>

                    {/* Progress */}
                    {totalCount > 0 && (
                        <div
                            style={{
                                fontSize: '12px',
                                color: 'rgba(55, 53, 47, 0.65)',
                                marginBottom: '12px',
                                padding: '8px',
                                backgroundColor: 'rgba(55, 53, 47, 0.04)',
                                borderRadius: '8px',
                            }}
                        >
                            已完成 {completedCount} / {totalCount} 个章节
                        </div>
                    )}

                    {/* Generate All Button */}
                    <button
                        onClick={handleGenerateAll}
                        disabled={isGenerating || totalCount === 0}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: isGenerating ? 'not-allowed' : 'pointer',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: isGenerating || totalCount === 0 ? 0.5 : 1,
                            transition: 'opacity 150ms ease-in-out',
                        }}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
                                <span>生成中... ({generatedCount}/{totalCount})</span>
                            </>
                        ) : (
                            <>
                                <Sparkles style={{ width: '16px', height: '16px' }} />
                                <span>生成全部内容</span>
                            </>
                        )}
                    </button>

                    {/* Individual Items */}
                    {level2Items.length > 0 && (
                        <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                            {level2Items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleGenerateSingle(item.id)}
                                    disabled={isGenerating || item.status === 'completed'}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        background: item.status === 'completed' ? 'rgba(15, 157, 88, 0.1)' : 'transparent',
                                        color: item.status === 'completed' ? '#0F9D58' : 'rgba(55, 53, 47, 1)',
                                        fontSize: '13px',
                                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                                        border: item.status === 'completed' ? '1px solid rgba(15, 157, 88, 0.2)' : '1px solid rgba(55, 53, 47, 0.09)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '8px',
                                        opacity: isGenerating ? 0.5 : 1,
                                        transition: 'opacity 150ms ease-in-out',
                                    }}
                                >
                                    <span style={{ textAlign: 'left', flex: 1 }}>{item.title}</span>
                                    {item.status === 'completed' && (
                                        <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(35, 131, 226, 0.4)',
                    transition: 'transform 150ms ease-in-out, box-shadow 150ms ease-in-out',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(35, 131, 226, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(35, 131, 226, 0.4)';
                }}
            >
                {isExpanded ? (
                    <X style={{ width: '24px', height: '24px' }} />
                ) : (
                    <Sparkles style={{ width: '24px', height: '24px' }} />
                )}
            </button>

            <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}
