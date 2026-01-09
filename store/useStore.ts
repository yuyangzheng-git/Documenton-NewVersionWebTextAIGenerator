import { create } from 'zustand';
import { AIPlatform } from '@/lib/ai/types';

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

  // AI Platform Configuration
  aiPlatform: AIPlatform;
  setAIPlatform: (platform: AIPlatform) => void;

  // Dify Config
  apiKey: string;
  setApiKey: (key: string) => void;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  chapterApiKey: string;
  setChapterApiKey: (key: string) => void;
  chatApiKey: string;
  setChatApiKey: (key: string) => void;

  // OpenAI Config
  openaiApiKey: string;
  setOpenaiApiKey: (key: string) => void;
  openaiModel: string;
  setOpenaiModel: (model: string) => void;
  openaiBaseUrl: string;
  setOpenaiBaseUrl: (url: string) => void;

  // LangChain Config
  langchainApiKey: string;
  setLangchainApiKey: (key: string) => void;
  langchainModel: string;
  setLangchainModel: (model: string) => void;

  // Export
  documentTitle: string;
  setDocumentTitle: (title: string) => void;
}

// Generate numbering for outline items (1, 1.1, 1.1.1, 2, 2.1, 2.1.1, etc.)
// Also removes any existing numbering prefixes from titles
function generateNumbers(items: OutlineItem[]): OutlineItem[] {
  let level1Counter = 0;
  let level2Counter = 0;

  return items.map(item => {
    // Remove existing numbering prefix from title (e.g., "1. Introduction" -> "Introduction")
    let cleanTitle = item.title;
    if (item.level === 1) {
      cleanTitle = item.title.replace(/^\d+\.\s*/, '').replace(/^\d+\s*/, '');
    } else if (item.level === 2) {
      cleanTitle = item.title.replace(/^\d+\.\d+\.\s*/, '').replace(/^\d+\.\d+\s*/, '');
    } else if (item.level === 3) {
      cleanTitle = item.title.replace(/^\d+\.\d+\.\d+\.\s*/, '').replace(/^\d+\.\d+\.\d+\s*/, '');
    }

    if (item.level === 1) {
      level1Counter += 1;
      level2Counter = 0;
      return {
        ...item,
        title: cleanTitle,
        number: level1Counter.toString()
      };
    } else if (item.level === 2) {
      level2Counter += 1;
      return {
        ...item,
        title: cleanTitle,
        number: `${level1Counter}.${level2Counter}`
      };
    } else if (item.level === 3) {
      return {
        ...item,
        title: cleanTitle,
        number: `${level1Counter}.${level2Counter}.1`
      };
    }
    return {
      ...item,
      title: cleanTitle
    };
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

  // AI Platform Configuration
  aiPlatform: 'dify',
  setAIPlatform: (platform) => set({ aiPlatform: platform }),

  // Dify Config
  apiKey: process.env.NEXT_PUBLIC_DIFY_PLANNER_API_KEY || '',
  setApiKey: (key) => set({ apiKey: key }),
  apiUrl: process.env.NEXT_PUBLIC_DIFY_API_URL || '',
  setApiUrl: (url) => set({ apiUrl: url }),
  chapterApiKey: process.env.NEXT_PUBLIC_DIFY_CHAPTER_API_KEY || '',
  setChapterApiKey: (key) => set({ chapterApiKey: key }),
  chatApiKey: process.env.NEXT_PUBLIC_DIFY_CHAT_API_KEY || '',
  setChatApiKey: (key) => set({ chatApiKey: key }),

  // OpenAI Config
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
  openaiModel: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4',
  setOpenaiModel: (model) => set({ openaiModel: model }),
  openaiBaseUrl: process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  setOpenaiBaseUrl: (url) => set({ openaiBaseUrl: url }),

  // LangChain Config
  langchainApiKey: process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY || '',
  setLangchainApiKey: (key) => set({ langchainApiKey: key }),
  langchainModel: process.env.NEXT_PUBLIC_LANGCHAIN_MODEL || 'gpt-4',
  setLangchainModel: (model) => set({ langchainModel: model }),

  // Export
  documentTitle: 'Untitled Document',
  setDocumentTitle: (title) => set({ documentTitle: title }),
}));
