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
  const level1Counters: { [key: string]: number } = {};
  const level2Counters: { [key: string]: number } = {};
  const level3Counters: { [key: string]: number } = {};
  let lastLevel1Id: string | null = null;
  let lastLevel2Id: string | null = null;

  return items.map(item => {
    if (item.level === 1) {
      lastLevel1Id = item.id;
      lastLevel2Id = null;
      level1Counters[item.id] = (level1Counters[item.id] || 0) + 1;
      return {
        ...item,
        number: level1Counters[item.id].toString()
      };
    } else if (item.level === 2 && lastLevel1Id) {
      lastLevel2Id = item.id;
      level2Counters[item.id] = (level2Counters[item.id] || 0) + 1;
      const level1Num = level1Counters[lastLevel1Id];
      return {
        ...item,
        number: `${level1Num}.${level2Counters[item.id]}`
      };
    } else if (item.level === 3 && lastLevel2Id) {
      level3Counters[item.id] = (level3Counters[item.id] || 0) + 1;
      const level1Num = level1Counters[lastLevel1Id!];
      const level2Num = level2Counters[lastLevel2Id];
      return {
        ...item,
        number: `${level1Num}.${level2Num}.${level3Counters[item.id]}`
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
