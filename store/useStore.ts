import { create } from 'zustand';
import { AIPlatform } from '@/lib/ai/types';

export interface OutlineItem {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  status: 'idle' | 'generating' | 'completed' | 'pending';
  content?: string;
  requirements?: string; // 章节要求/内容要点
  number?: string; // Auto-generated numbering like "1", "1.1", "2", "2.1"
  paragraphs?: string[]; // 分段后的段落列表
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

  // Gemini Config
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  geminiBaseUrl: string;
  setGeminiBaseUrl: (url: string) => void;

  // Kimi Config
  kimiApiKey: string;
  setKimiApiKey: (key: string) => void;
  kimiModel: string;
  setKimiModel: (model: string) => void;
  kimiBaseUrl: string;
  setKimiBaseUrl: (url: string) => void;

  // Qwen Config
  qwenApiKey: string;
  setQwenApiKey: (key: string) => void;
  qwenModel: string;
  setQwenModel: (model: string) => void;
  qwenBaseUrl: string;
  setQwenBaseUrl: (url: string) => void;

  // DeepSeek Config
  deepseekApiKey: string;
  setDeepseekApiKey: (key: string) => void;
  deepseekModel: string;
  setDeepseekModel: (model: string) => void;
  deepseekBaseUrl: string;
  setDeepseekBaseUrl: (url: string) => void;

  // Claude Config
  claudeApiKey: string;
  setClaudeApiKey: (key: string) => void;
  claudeModel: string;
  setClaudeModel: (model: string) => void;
  claudeBaseUrl: string;
  setClaudeBaseUrl: (url: string) => void;

  // Groq Config
  groqApiKey: string;
  setGroqApiKey: (key: string) => void;
  groqModel: string;
  setGroqModel: (model: string) => void;
  groqBaseUrl: string;
  setGroqBaseUrl: (url: string) => void;

  // Cohere Config
  cohereApiKey: string;
  setCohereApiKey: (key: string) => void;
  cohereModel: string;
  setCohereModel: (model: string) => void;
  cohereBaseUrl: string;
  setCohereBaseUrl: (url: string) => void;

  // Wenxin Config
  wenxinApiKey: string;
  setWenxinApiKey: (key: string) => void;
  wenxinModel: string;
  setWenxinModel: (model: string) => void;
  wenxinBaseUrl: string;
  setWenxinBaseUrl: (url: string) => void;

  // Zhipu Config
  zhipuApiKey: string;
  setZhipuApiKey: (key: string) => void;
  zhipuModel: string;
  setZhipuModel: (model: string) => void;
  zhipuBaseUrl: string;
  setZhipuBaseUrl: (url: string) => void;

  // LangChain Config
  langchainApiKey: string;
  setLangchainApiKey: (key: string) => void;
  langchainModel: string;
  setLangchainModel: (model: string) => void;

  // Export
  documentTitle: string;
  setDocumentTitle: (title: string) => void;
}

// Extract numbering from titles or convert from ID field
// Dify returns structured data with both ID (e.g., "4-2-1") and title (e.g., "4.2.1 AI XDR")
// Priority: 1) Extract from title, 2) Convert from ID, 3) Keep existing number
function generateNumbers(items: OutlineItem[]): OutlineItem[] {
  // Deduplicate items by id first to avoid React key conflicts
  const seenIds = new Set<string>();
  const uniqueItems: OutlineItem[] = [];
  items.forEach((item) => {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  });

  return uniqueItems.map(item => {
    let extractedNumber = '';
    let cleanTitle = item.title;

    // Strategy 1: Extract numbering from title based on level
    if (item.level === 1) {
      // Match patterns like "1. " or "1 " or "第一章：" etc.
      const match = item.title.match(/^(\d+)[.、\s]+/);
      if (match) {
        extractedNumber = match[1];
        cleanTitle = item.title.substring(match[0].length).trim();
      }
    } else if (item.level === 2) {
      // Match patterns like "4.1 " or "4.1. "
      const match = item.title.match(/^(\d+\.\d+)[.、\s]+/);
      if (match) {
        extractedNumber = match[1];
        cleanTitle = item.title.substring(match[0].length).trim();
      }
    } else if (item.level === 3) {
      // Match patterns like "4.2.1 " or "4.2.1. "
      const match = item.title.match(/^(\d+\.\d+\.\d+)[.、\s]+/);
      if (match) {
        extractedNumber = match[1];
        cleanTitle = item.title.substring(match[0].length).trim();
      }
    }

    // Strategy 2: If no number extracted from title, try converting from ID
    // ID format: "1", "4-1", "4-2-1" → "1", "4.1", "4.2.1"
    if (!extractedNumber && item.id) {
      const idParts = item.id.split('-');
      if (idParts.length > 0 && idParts.every(part => /^\d+$/.test(part))) {
        extractedNumber = idParts.join('.');
      }
    }

    return {
      ...item,
      title: cleanTitle,
      number: extractedNumber || item.number || ''
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
  apiKey: process.env.NEXT_PUBLIC_DIFY_OUTLINE_KEY || '',
  setApiKey: (key) => set({ apiKey: key }),
  apiUrl: process.env.NEXT_PUBLIC_DIFY_BASE_URL || '',
  setApiUrl: (url) => set({ apiUrl: url }),
  chapterApiKey: process.env.NEXT_PUBLIC_DIFY_CHAPTER_KEY || '',
  setChapterApiKey: (key) => set({ chapterApiKey: key }),
  chatApiKey: process.env.NEXT_PUBLIC_DIFY_LLM_KEY || '',
  setChatApiKey: (key) => set({ chatApiKey: key }),

  // OpenAI Config
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
  openaiModel: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o',
  setOpenaiModel: (model) => set({ openaiModel: model }),
  openaiBaseUrl: process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  setOpenaiBaseUrl: (url) => set({ openaiBaseUrl: url }),

  // Gemini Config
  geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  setGeminiApiKey: (key) => set({ geminiApiKey: key }),
  geminiModel: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-pro',
  setGeminiModel: (model) => set({ geminiModel: model }),
  geminiBaseUrl: process.env.NEXT_PUBLIC_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  setGeminiBaseUrl: (url) => set({ geminiBaseUrl: url }),

  // Kimi Config
  kimiApiKey: process.env.NEXT_PUBLIC_KIMI_API_KEY || '',
  setKimiApiKey: (key) => set({ kimiApiKey: key }),
  kimiModel: process.env.NEXT_PUBLIC_KIMI_MODEL || 'moonshot-v1-128k',
  setKimiModel: (model) => set({ kimiModel: model }),
  kimiBaseUrl: process.env.NEXT_PUBLIC_KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
  setKimiBaseUrl: (url) => set({ kimiBaseUrl: url }),

  // Qwen Config
  qwenApiKey: process.env.NEXT_PUBLIC_QWEN_API_KEY || '',
  setQwenApiKey: (key) => set({ qwenApiKey: key }),
  qwenModel: process.env.NEXT_PUBLIC_QWEN_MODEL || 'qwen-plus',
  setQwenModel: (model) => set({ qwenModel: model }),
  qwenBaseUrl: process.env.NEXT_PUBLIC_QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  setQwenBaseUrl: (url) => set({ qwenBaseUrl: url }),

  // DeepSeek Config
  deepseekApiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
  setDeepseekApiKey: (key) => set({ deepseekApiKey: key }),
  deepseekModel: process.env.NEXT_PUBLIC_DEEPSEEK_MODEL || 'deepseek-chat',
  setDeepseekModel: (model) => set({ deepseekModel: model }),
  deepseekBaseUrl: process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  setDeepseekBaseUrl: (url) => set({ deepseekBaseUrl: url }),

  // Claude Config
  claudeApiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '',
  setClaudeApiKey: (key) => set({ claudeApiKey: key }),
  claudeModel: process.env.NEXT_PUBLIC_CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  setClaudeModel: (model) => set({ claudeModel: model }),
  claudeBaseUrl: process.env.NEXT_PUBLIC_CLAUDE_BASE_URL || 'https://api.anthropic.com',
  setClaudeBaseUrl: (url) => set({ claudeBaseUrl: url }),

  // Groq Config
  groqApiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
  setGroqApiKey: (key) => set({ groqApiKey: key }),
  groqModel: process.env.NEXT_PUBLIC_GROQ_MODEL || 'llama-3.3-70b-versatile',
  setGroqModel: (model) => set({ groqModel: model }),
  groqBaseUrl: process.env.NEXT_PUBLIC_GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  setGroqBaseUrl: (url) => set({ groqBaseUrl: url }),

  // Cohere Config
  cohereApiKey: process.env.NEXT_PUBLIC_COHERE_API_KEY || '',
  setCohereApiKey: (key) => set({ cohereApiKey: key }),
  cohereModel: process.env.NEXT_PUBLIC_COHERE_MODEL || 'command-a-03-2025',
  setCohereModel: (model) => set({ cohereModel: model }),
  cohereBaseUrl: process.env.NEXT_PUBLIC_COHERE_BASE_URL || 'https://api.cohere.ai/v1',
  setCohereBaseUrl: (url) => set({ cohereBaseUrl: url }),

  // Wenxin Config
  wenxinApiKey: process.env.NEXT_PUBLIC_WENXIN_API_KEY || '',
  setWenxinApiKey: (key) => set({ wenxinApiKey: key }),
  wenxinModel: process.env.NEXT_PUBLIC_WENXIN_MODEL || 'ernie-4.0-8k',
  setWenxinModel: (model) => set({ wenxinModel: model }),
  wenxinBaseUrl: process.env.NEXT_PUBLIC_WENXIN_BASE_URL || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
  setWenxinBaseUrl: (url) => set({ wenxinBaseUrl: url }),

  // Zhipu Config
  zhipuApiKey: process.env.NEXT_PUBLIC_ZHIPU_API_KEY || '',
  setZhipuApiKey: (key) => set({ zhipuApiKey: key }),
  zhipuModel: process.env.NEXT_PUBLIC_ZHIPU_MODEL || 'glm-4-plus',
  setZhipuModel: (model) => set({ zhipuModel: model }),
  zhipuBaseUrl: process.env.NEXT_PUBLIC_ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
  setZhipuBaseUrl: (url) => set({ zhipuBaseUrl: url }),

  // LangChain Config
  langchainApiKey: process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY || '',
  setLangchainApiKey: (key) => set({ langchainApiKey: key }),
  langchainModel: process.env.NEXT_PUBLIC_LANGCHAIN_MODEL || 'gpt-4',
  setLangchainModel: (model) => set({ langchainModel: model }),

  // Export
  documentTitle: 'Untitled Document',
  setDocumentTitle: (title) => set({ documentTitle: title }),
}));
