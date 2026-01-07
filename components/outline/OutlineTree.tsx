'use client';

import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { OutlineNode } from './OutlineNode';
import { OutlineItem } from '@/store/useStore';
import { useState } from 'react';

interface OutlineTreeProps {
    items: OutlineItem[];
    onUpdate: (id: string, updates: Partial<OutlineItem>) => void;
    onDelete: (id: string) => void;
    onReorder: (items: OutlineItem[]) => void;
    onGenerateChapter?: (id: string) => void;
}

export function OutlineTree({ items, onUpdate, onDelete, onReorder, onGenerateChapter }: OutlineTreeProps) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const handleToggleExpand = (id: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex !== newIndex) {
            const reorderedItems = arrayMove(items, oldIndex, newIndex);
            onReorder(reorderedItems);
        }
    };

    // Group items by level 1 parent for expand/collapse
    const level1Items = items.filter((item) => item.level === 1);

    // Get level 2 items that belong to a specific level 1 item
    const getLevel2Items = (level1Item: OutlineItem) => {
        const level1Index = items.findIndex((item) => item.id === level1Item.id);
        const level2Items: OutlineItem[] = [];
        
        for (let i = level1Index + 1; i < items.length; i++) {
            if (items[i].level === 1) break; // Stop when we hit the next level 1 item
            if (items[i].level === 2) {
                level2Items.push(items[i]);
            }
        }
        
        return level2Items;
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div>
                    {level1Items.map((level1Item) => {
                        const level2Items = getLevel2Items(level1Item);
                        const isExpanded = expandedItems.has(level1Item.id);

                        return (
                            <div key={level1Item.id}>
                                <OutlineNode
                                    item={level1Item}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                    onToggleExpand={handleToggleExpand}
                                    isExpanded={isExpanded}
                                    onGenerateChapter={onGenerateChapter}
                                />
                                {isExpanded && level2Items.length > 0 && (
                                    <div>
                                        {level2Items.map((level2Item) => (
                                            <OutlineNode
                                                key={level2Item.id}
                                                item={level2Item}
                                                onUpdate={onUpdate}
                                                onDelete={onDelete}
                                                onGenerateChapter={onGenerateChapter}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
}
