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
import { logger } from '@/lib/logger';

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
  onBlockUpdate?: (id: string, updates: Partial<NotionBlock>) => void;
  onGenerate?: (blockId: string) => void;
  generatingIds?: Set<string>;
  documentTitle?: string;
}

export function NotionEditor({ blocks, setBlocks, onBlockUpdate, onGenerate, generatingIds }: NotionEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const updateBlock = (id: string, updates: Partial<NotionBlock>) => {
    logger.log('NotionEditor updateBlock:', { id, updates, currentBlocks: blocks.map(b => ({ id: b.id, type: b.type, content: b.content.substring(0, 20) })) });
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === id) {
          logger.log('NotionEditor updateBlock found block to update:', { id, oldType: block.type, newType: updates.type });
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
    // Also notify parent component
    onBlockUpdate?.(id, updates);
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const addBlock = (parentId: string | null, position: number, type: BlockType, initialContent?: string): string | undefined => {
    const newBlockId = `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // For paragraphs, add default indent (2 full-width spaces) only if initialContent is undefined
    let content = initialContent !== undefined ? initialContent : '';
    if (type === 'paragraph' && initialContent === undefined) {
      content = '　　';
    }

    logger.log('addBlock START:', { parentId, position, type, initialContent, content, blocksLength: blocks.length });
    console.trace('addBlock call stack');

    const newBlock: NotionBlock = {
      id: newBlockId,
      type,
      content,
      properties: {},
      children: [],
    };

    if (parentId) {
      // Find the index of the parent block and insert after it
      const parentIndex = blocks.findIndex((b) => b.id === parentId);
      if (parentIndex !== -1) {
        const newBlocks = [...blocks.slice(0, parentIndex + 1), newBlock, ...blocks.slice(parentIndex + 1)];
        logger.log('addBlock setBlocks (parentId):', { parentId, parentIndex, newBlockId, newBlockContent: newBlock.content, blocksLength: newBlocks.length });
        setBlocks(newBlocks);
      }
    } else {
      // Insert at the specified position
      const newBlocks = [...blocks.slice(0, position), newBlock, ...blocks.slice(position)];
      logger.log('addBlock setBlocks (position):', { position, newBlockId, newBlockContent: newBlock.content, blocksLength: newBlocks.length });
      setBlocks(newBlocks);
    }

    return newBlockId;
  };

  const insertBeforeBlock = (beforeBlockId: string, type: BlockType, content: string): string | undefined => {
    const newBlockId = `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const newBlock: NotionBlock = {
      id: newBlockId,
      type,
      content,
      properties: {},
      children: [],
    };

    // Find the index of the target block and insert before it
    const targetIndex = blocks.findIndex((b) => b.id === beforeBlockId);
    if (targetIndex !== -1) {
      const newBlocks = [...blocks.slice(0, targetIndex), newBlock, ...blocks.slice(targetIndex)];
      logger.log('insertBeforeBlock setBlocks:', { beforeBlockId, targetIndex, newBlockId, newBlockContent: newBlock.content, blocksLength: newBlocks.length });
      setBlocks(newBlocks);
    }

    return newBlockId;
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
            onAdd={(parentId, type, initialContent, insertBefore) => {
              if (insertBefore) {
                insertBeforeBlock(parentId || block.id, type, initialContent || '');
              } else {
                addBlock(parentId, blocks.length, type, initialContent);
              }
            }}
            onGenerate={onGenerate}
            generatingIds={generatingIds}
            allBlocks={blocks}
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
