'use client';

import { NotionBlock as NotionBlockComponent, BlockType } from './NotionBlock';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

export interface NotionBlock {
  id: string;
  type: BlockType;
  content: string;
  properties: Record<string, unknown>;
  children: NotionBlock[];
}

interface NotionEditorProps {
  blocks: NotionBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<NotionBlock[]>>;
  documentTitle?: string;
}

export function NotionEditor({ blocks, setBlocks }: NotionEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const updateBlock = (id: string, updates: Partial<NotionBlock>) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === id) {
          return { ...block, ...updates };
        }
        if (block.children) {
          const updatedChildren = block.children.map((child) => {
            if (child.id === id) {
              return { ...child, ...updates };
            }
            return child;
          });
          if (updatedChildren.some((c) => c.id === id)) {
            return { ...block, children: updatedChildren };
          }
        }
        return block;
      })
    );
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const addBlock = (parentId: string | null, position: number, type: BlockType) => {
    const newBlock: NotionBlock = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      properties: {},
      children: [],
    };

    if (parentId) {
      updateBlock(parentId, {
        children: [...(blocks.find((b) => b.id === parentId)?.children || []), newBlock],
      });
    } else {
      setBlocks([...blocks.slice(0, position), newBlock, ...blocks.slice(position)]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);

    if (oldIndex !== newIndex) {
      setBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
        {blocks.map((block) => (
          <NotionBlockComponent
            key={block.id}
            block={block}
            onUpdate={updateBlock}
            onDelete={deleteBlock}
            onAdd={addBlock}
          />
        ))}
      </SortableContext>

      {/* 添加新块按钮 */}
      <button
        onClick={() => addBlock(null, blocks.length, 'paragraph')}
        style={{
          userSelect: 'none',
          transition: 'background 20ms ease-in',
          cursor: 'pointer',
          width: '100%',
          marginTop: '16px',
          padding: '12px',
          borderRadius: '16px',
          border: '1px dashed rgba(55, 53, 47, 0.2)',
          backgroundColor: 'transparent',
          color: 'rgba(55, 53, 47, 0.4)',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ width: '12px', height: '1px', backgroundColor: 'currentColor' }} />
          <div style={{ width: '12px', height: '1px', backgroundColor: 'currentColor', transform: 'rotate(90deg)', position: 'absolute' }} />
        </div>
        <span>添加新块</span>
      </button>
    </DndContext>
  );
}
