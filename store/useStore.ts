import { create } from 'zustand';

export interface OutlineItem {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  status: 'idle' | 'generating' | 'completed' | 'pending';
  content?: string;
  children?: OutlineItem[];
}

interface DocumentStore {
  // Outline state
  outline: OutlineItem[];
  setOutline: (outline: OutlineItem[]) => void;
  addItem: (parentId: string | null, item: OutlineItem) => void;
  updateItem: (id: string, updates: Partial<OutlineItem>) => void;
  deleteItem: (id: string) => void;
  reorderItems: (items: OutlineItem[]) => void;
  updateItemStatus: (id: string, status: OutlineItem['status']) => void;

  // Generation state
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;

  // Config
  apiKey: string;
  setApiKey: (key: string) => void;

  // Export
  documentTitle: string;
  setDocumentTitle: (title: string) => void;
}

export const useStore = create<DocumentStore>((set) => ({
  outline: [],
  setOutline: (outline) => set({ outline }),
  addItem: (parentId, item) =>
    set((state) => {
      const addItemRecursively = (items: OutlineItem[]): OutlineItem[] => {
        if (!parentId) {
          return [...items, item];
        }
        return items.map((i) => {
          if (i.id === parentId) {
            return { ...i, children: [...(i.children || []), item] };
          }
          if (i.children) {
            return { ...i, children: addItemRecursively(i.children) };
          }
          return i;
        });
      };
      return { outline: addItemRecursively(state.outline) };
    }),
  updateItem: (id, updates) =>
    set((state) => ({
      outline: updateItemRecursively(state.outline, id, updates),
    })),
  deleteItem: (id) =>
    set((state) => ({
      outline: deleteItemRecursively(state.outline, id),
    })),
  reorderItems: (items) => set({ outline: items }),
  updateItemStatus: (id, status) =>
    set((state) => ({
      outline: updateItemRecursively(state.outline, id, { status }),
    })),
  isGenerating: false,
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  apiKey: '',
  setApiKey: (key) => set({ apiKey: key }),
  documentTitle: 'Untitled Document',
  setDocumentTitle: (title) => set({ documentTitle: title }),
}));

function updateItemRecursively(
  items: OutlineItem[],
  id: string,
  updates: Partial<OutlineItem>
): OutlineItem[] {
  return items.map((item) => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    if (item.children) {
      return { ...item, children: updateItemRecursively(item.children, id, updates) };
    }
    return item;
  });
}

function deleteItemRecursively(items: OutlineItem[], id: string): OutlineItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      children: item.children ? deleteItemRecursively(item.children, id) : undefined,
    }));
}
