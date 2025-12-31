'use client';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { OutlineItem } from '@/store/useStore';
import { OutlineNode } from './OutlineNode';
import { useStore } from '@/store/useStore';

export function OutlineTree() {
  const { outline } = useStore();
  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = outline.findIndex((item) => item.id === active.id);
      const newIndex = outline.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(outline, oldIndex, newIndex);
      useStore.getState().reorderItems(reordered);
    }
  };

  const handleUpdate = (id: string, title: string) => {
    useStore.getState().updateItem(id, { title });
  };

  const handleDelete = (id: string) => {
    useStore.getState().deleteItem(id);
  };

  const handleAddChild = (parentId: string) => {
    const newItem: OutlineItem = {
      id: `new-${Date.now()}`,
      title: 'New Section',
      level: 2,
      status: 'idle',
    };
    useStore.getState().addItem(parentId, newItem);
  };

  const handleAddSibling = (itemId: string) => {
    const newItem: OutlineItem = {
      id: `new-${Date.now()}`,
      title: 'New Section',
      level: 1,
      status: 'idle',
    };
    const index = outline.findIndex((item) => item.id === itemId);
    const reordered = [...outline.slice(0, index + 1), newItem, ...outline.slice(index + 1)];
    useStore.getState().reorderItems(reordered);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={outline.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {outline.map((item) => (
            <OutlineNode
              key={item.id}
              item={item}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
              onAddSibling={handleAddSibling}
            />
          ))}
          {outline.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No outline items yet. Generate one or add manually.
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
