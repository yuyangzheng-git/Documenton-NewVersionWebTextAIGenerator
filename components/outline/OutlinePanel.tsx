'use client';

import { useStore } from '@/store/useStore';
import { OutlineTree } from './OutlineTree';
import { X, FileText } from 'lucide-react';

interface OutlinePanelProps {
    onClose?: () => void;
    show?: boolean;
}

export function OutlinePanel({ onClose, show = true }: OutlinePanelProps) {
    const { outline, updateItem, deleteItem, reorderItems } = useStore();

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
                    <FileText style={{ width: '20px', height: '20px', color: 'rgba(55, 53, 47, 0.65)' }} />
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
