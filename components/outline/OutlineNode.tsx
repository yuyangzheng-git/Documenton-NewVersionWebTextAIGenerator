'use client';

import { useState } from 'react';
import { GripVertical, Pencil, Check, X, ChevronDown, ChevronRight, Play, RefreshCw } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OutlineItem } from '@/store/useStore';

interface OutlineNodeProps {
    item: OutlineItem;
    onUpdate: (id: string, updates: Partial<OutlineItem>) => void;
    onDelete: (id: string) => void;
    onToggleExpand?: (id: string) => void;
    isExpanded?: boolean;
    isDragging?: boolean;
    onGenerateChapter?: (id: string) => void;
    hasChildren?: boolean; // Whether this item has child sections
}

export function OutlineNode({
    item,
    onUpdate,
    onDelete,
    onToggleExpand,
    isExpanded = true,
    isDragging = false,
    onGenerateChapter,
    hasChildren = false,
}: OutlineNodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.title);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1,
    };

    const handleEditStart = () => {
        setIsEditing(true);
        setEditValue(item.title);
    };

    const handleEditSave = () => {
        if (editValue.trim()) {
            onUpdate(item.id, { title: editValue.trim() });
        }
        setIsEditing(false);
    };

    const handleEditCancel = () => {
        setEditValue(item.title);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleEditSave();
        } else if (e.key === 'Escape') {
            handleEditCancel();
        }
    };

    const getStatusColor = () => {
        switch (item.status) {
            case 'generating':
                return '#2383E2';
            case 'completed':
                return '#0F9D58';
            case 'pending':
                return '#F4B400';
            default:
                return 'rgba(55, 53, 47, 0.4)';
        }
    };

    const getStatusText = () => {
        switch (item.status) {
            case 'generating':
                return '生成中...';
            case 'completed':
                return '已完成';
            case 'pending':
                return '待生成';
            default:
                return '';
        }
    };

    const paddingLeft = `${(item.level - 1) * 16}px`;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`outline-node ${isDragging ? 'dragging' : ''}`}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    paddingLeft,
                    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
                    backgroundColor: isSortableDragging ? 'rgba(35, 131, 226, 0.05)' : 'transparent',
                    transition: 'background-color 150ms ease-in-out',
                }}
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        marginRight: '8px',
                        cursor: 'grab',
                        color: 'rgba(55, 53, 47, 0.4)',
                        flexShrink: 0,
                    }}
                >
                    <GripVertical style={{ width: '16px', height: '16px' }} />
                </div>

                {/* Expand/Collapse Button (for level 1 items) */}
                {item.level === 1 && (
                    <button
                        onClick={() => onToggleExpand?.(item.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            marginRight: '8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(55, 53, 47, 0.4)',
                            padding: 0,
                            flexShrink: 0,
                        }}
                    >
                        {isExpanded ? (
                            <ChevronDown style={{ width: '16px', height: '16px' }} />
                        ) : (
                            <ChevronRight style={{ width: '16px', height: '16px' }} />
                        )}
                    </button>
                )}

                {/* Number */}
                <span
                    style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'rgba(55, 53, 47, 0.5)',
                        marginRight: '12px',
                        minWidth: '40px',
                        flexShrink: 0,
                    }}
                >
                    {item.number || ''}
                </span>

                {/* Title */}
                {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            style={{
                                flex: 1,
                                fontSize: '14px',
                                padding: '4px 8px',
                                border: '1px solid #2383E2',
                                borderRadius: '4px',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleEditSave}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#0F9D58',
                                padding: 0,
                            }}
                        >
                            <Check style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button
                            onClick={handleEditCancel}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#EA4335',
                                padding: 0,
                            }}
                        >
                            <X style={{ width: '16px', height: '16px' }} />
                        </button>
                    </div>
                ) : (
                    <span
                        style={{
                            fontSize: item.level === 1 ? '15px' : '14px',
                            fontWeight: item.level === 1 ? 600 : 400,
                            color: 'rgba(55, 53, 47, 1)',
                            flex: 1,
                        }}
                    >
                        {item.title}
                    </span>
                )}

                {/* Status Indicator */}
                {item.status !== 'idle' && (
                    <span
                        style={{
                            fontSize: '12px',
                            color: getStatusColor(),
                            marginLeft: '12px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                    >
                        {getStatusText()}
                    </span>
                )}

                {/* Generate Button */}
                {onGenerateChapter && (
                    <button
                        onClick={() => onGenerateChapter(item.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            marginLeft: '8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: item.status === 'generating' ? '#2383E2' : 'rgba(55, 53, 47, 0.4)',
                            padding: 0,
                            transition: 'transform 200ms ease-in-out',
                            flexShrink: 0,
                            ...(item.status === 'generating' && { animation: 'spin 1s linear infinite' }),
                        }}
                        disabled={item.status === 'generating'}
                        className="generate-button"
                        title={hasChildren ? '生成所有子章节' : '生成此章节'}
                    >
                        {item.status === 'generating' ? (
                            <RefreshCw style={{ width: '14px', height: '14px' }} />
                        ) : (
                            <Play style={{ width: '14px', height: '14px' }} />
                        )}
                    </button>
                )}

                {/* Edit Button */}
                {!isEditing && (
                    <button
                        onClick={handleEditStart}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            marginLeft: '8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(55, 53, 47, 0.4)',
                            padding: 0,
                            opacity: 0,
                            transition: 'opacity 150ms ease-in-out',
                            flexShrink: 0,
                        }}
                        className="edit-button"
                    >
                        <Pencil style={{ width: '14px', height: '14px' }} />
                    </button>
                )}
            </div>

            <style>{`
        .outline-node:hover .edit-button,
        .outline-node:hover .generate-button {
          opacity: 1;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
