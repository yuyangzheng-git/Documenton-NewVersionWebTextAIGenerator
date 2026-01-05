import { create } from 'zustand';

export interface OutlineItem {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  status: 'idle' | 'generating' | 'completed' | 'pending';
  content?: string;
  number?: string; // Auto-generated numbering like "1", "1.1", "2", "2.1"
}

interface DocumentStore {
  // Outline state - flat array structure
  outline: OutlineItem[];
  setOutline: (outline: OutlineItem[]) => void;
  addItem: (item: OutlineItem) => void;
  addItemAfter: (afterId: string, item: OutlineItem) => void;
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

// Generate numbering for outline items (1, 1.1, 1.1.1, 2, 2.1, 2.1.1, etc.)
function generateNumbers(items: OutlineItem[]): OutlineItem[] {
  let level1Counter = 0;
  let level2Counter = 0;

  return items.map(item => {
    if (item.level === 1) {
      level1Counter += 1;
      level2Counter = 0;
      return {
        ...item,
        number: level1Counter.toString()
      };
    } else if (item.level === 2) {
      level2Counter += 1;
      return {
        ...item,
        number: `${level1Counter}.${level2Counter}`
      };
    } else if (item.level === 3) {
      return {
        ...item,
        number: `${level1Counter}.${level2Counter}.1`
      };
    }
    return item;
  });
}

export const useStore = create<DocumentStore>((set) => ({
  outline: [],
  setOutline: (outline) => set({ outline: generateNumbers(outline) }),
  addItem: (item) =>
    set((state) => {
      const newOutline = [...state.outline, item];
      return { outline: generateNumbers(newOutline) };
    }),
  addItemAfter: (afterId, item) =>
    set((state) => {
      const index = state.outline.findIndex((i) => i.id === afterId);
      const newOutline = [...state.outline];
      if (index === -1) {
        newOutline.push(item);
      } else {
        newOutline.splice(index + 1, 0, item);
      }
      return { outline: generateNumbers(newOutline) };
    }),
  updateItem: (id, updates) =>
    set((state) => {
      const newOutline = state.outline.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      return { outline: generateNumbers(newOutline) };
    }),
  deleteItem: (id) =>
    set((state) => {
      const newOutline = state.outline.filter((item) => item.id !== id);
      return { outline: generateNumbers(newOutline) };
    }),
  reorderItems: (items) => set({ outline: generateNumbers(items) }),
  updateItemStatus: (id, status) =>
    set((state) => {
      const newOutline = state.outline.map((item) =>
        item.id === id ? { ...item, status } : item
      );
      return { outline: newOutline };
    }),
  isGenerating: false,
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  apiKey: '',
  setApiKey: (key) => set({ apiKey: key }),
  documentTitle: 'Untitled Document',
  setDocumentTitle: (title) => set({ documentTitle: title }),
}));
