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
  // Calculate block numbers (1, 1.1, 1.2, 2, 2.1, etc.)
  const getBlockNumber = (index: number): string | undefined => {
    const block = blocks[index];
    if (!block || (block.type !== 'h1' && block.type !== 'h2' && block.type !== 'h3')) {
      return undefined;
    }

    if (block.type === 'h1') {
      // Count how many h1 blocks before this one
      let h1Count = 0;
      for (let i = 0; i < index; i++) {
        if (blocks[i].type === 'h1') {
          h1Count++;
        }
      }
      return (h1Count + 1).toString();
    } else if (block.type === 'h2') {
      // Find the most recent h1 block
      let h1Index = -1;
      for (let i = index - 1; i >= 0; i--) {
        if (blocks[i].type === 'h1') {
          h1Index = i;
          break;
        }
      }

      if (h1Index === -1) return undefined;

      // Count how many h1 blocks before the h1 we found
      let h1Count = 0;
      for (let i = 0; i < h1Index; i++) {
        if (blocks[i].type === 'h1') {
          h1Count++;
        }
      }

      // Count how many h2 blocks between h1 and current block
      let h2Count = 0;
      for (let i = h1Index + 1; i < index; i++) {
        if (blocks[i].type === 'h1') {
          break;
        }
        if (blocks[i].type === 'h2') {
          h2Count++;
        }
      }

      return `${h1Count + 1}.${h2Count + 1}`;
    } else if (block.type === 'h3') {
      // Find the most recent h2 block
      let h2Index = -1;
      for (let i = index - 1; i >= 0; i--) {
        if (blocks[i].type === 'h2') {
          h2Index = i;
          break;
        }
      }

      if (h2Index === -1) return undefined;

      // Find the h1 that this h2 belongs to
      let h1Index = -1;
      for (let i = h2Index - 1; i >= 0; i--) {
        if (blocks[i].type === 'h1') {
          h1Index = i;
          break;
        }
      }

      if (h1Index === -1) return undefined;

      // Count h1 blocks before h1Index
      let h1Count = 0;
      for (let i = 0; i < h1Index; i++) {
        if (blocks[i].type === 'h1') {
          h1Count++;
        }
      }

      // Count h2 blocks between h1 and h2
      let h2Count = 0;
      for (let i = h1Index + 1; i < h2Index; i++) {
        if (blocks[i].type === 'h1') break;
        if (blocks[i].type === 'h2') {
          h2Count++;
        }
      }

      // Count h3 blocks between h2 and current block
      let h3Count = 0;
      for (let i = h2Index + 1; i < index; i++) {
        if (blocks[i].type === 'h1' || blocks[i].type === 'h2') break;
        if (blocks[i].type === 'h3') {
          h3Count++;
        }
      }

      return `${h1Count + 1}.${h2Count + 1}.${h3Count + 1}`;
    }

    return undefined;
  };
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
      // Find the index of the parent block and insert after it
      const parentIndex = blocks.findIndex((b) => b.id === parentId);
      if (parentIndex !== -1) {
        setBlocks([...blocks.slice(0, parentIndex + 1), newBlock, ...blocks.slice(parentIndex + 1)]);
      }
    } else {
      // Insert at the specified position
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
        {blocks.map((block, index) => (
          <NotionBlockComponent
            key={block.id}
            block={block}
            onUpdate={updateBlock}
            onDelete={deleteBlock}
            onAdd={addBlock}
            number={getBlockNumber(index)}
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
