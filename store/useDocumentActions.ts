import { generateOutlineWithPlanner as generateDifyOutline, DifyOutlineItem } from '@/lib/dify-api';
import { createAIProvider } from '@/lib/ai/provider-factory';
import { useStore } from './useStore';
import { OutlineItem } from './useStore';

export const generateOutline = async (prompt: string) => {
  try {
    const state = useStore.getState();
    const { aiPlatform } = state;

    if (aiPlatform === 'dify') {
      const apiKey = state.apiKey;
      if (!apiKey) {
        throw new Error('Please set your Dify API key');
      }

      const outline = await generateDifyOutline(apiKey, prompt);

      // Deduplicate outline items by id to avoid React key conflicts
      const seenIds = new Set<string>();
      const deduplicatedOutline: DifyOutlineItem[] = [];
      outline.forEach((item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          deduplicatedOutline.push(item);
        } else {
          console.warn('Removing duplicate outline item from API response:', item.id, item.title);
        }
      });

      const outlineWithStatus: OutlineItem[] = deduplicatedOutline.map((item: DifyOutlineItem) => ({
        id: item.id,
        title: item.title,
        level: item.level as 1 | 2,
        status: 'pending' as const,
        requirements: item.requirements,
      }));

      useStore.getState().setOutline(outlineWithStatus);
      return outlineWithStatus;
    } else {
      // Use unified AI Provider for other platforms
      let config: any;

      switch (aiPlatform) {
        case 'openai':
          config = {
            apiKey: state.openaiApiKey,
            model: state.openaiModel,
            baseUrl: state.openaiBaseUrl,
          };
          break;
        case 'gemini':
          config = {
            apiKey: state.geminiApiKey,
            model: state.geminiModel,
            baseUrl: state.geminiBaseUrl,
          };
          break;
        case 'kimi':
          config = {
            apiKey: state.kimiApiKey,
            model: state.kimiModel,
            baseUrl: state.kimiBaseUrl,
          };
          break;
        case 'qwen':
          config = {
            apiKey: state.qwenApiKey,
            model: state.qwenModel,
            baseUrl: state.qwenBaseUrl,
          };
          break;
        default:
          throw new Error(`Unsupported AI platform: ${aiPlatform}`);
      }

      if (!config.apiKey) {
        throw new Error(`Please set your ${aiPlatform} API key`);
      }

      const provider = createAIProvider(aiPlatform, config.baseUrl);
      const outline = await provider.generateOutline({ prompt }, config);

      // Convert to OutlineItem format
      const outlineWithStatus: OutlineItem[] = outline.map((item: any) => ({
        id: item.id,
        title: item.title,
        level: item.level as 1 | 2,
        status: 'pending' as const,
        requirements: item.requirements || '',
      }));

      useStore.getState().setOutline(outlineWithStatus);
      return outlineWithStatus;
    }
  } catch (error) {
    console.error('Error generating outline:', error);
    throw error;
  }
};

export const generateContent = async (
  item: OutlineItem,
  onChunk: (text: string) => void,
  onComplete: () => void
) => {
  const state = useStore.getState();
  const { aiPlatform } = state;

  if (aiPlatform === 'dify') {
    const { generateSectionWithWorker } = await import('@/lib/dify-api');
    const apiKey = state.apiKey;
    const documentTitle = state.documentTitle;
    const outline = state.outline;
    const fullOutline = outline.map((block) => `${'  '.repeat(block.level - 1)}- ${block.title}`).join('\n');

    await generateSectionWithWorker(apiKey, item.title, documentTitle, fullOutline, onChunk, onComplete, item.requirements);
  } else {
    // Use unified AI Provider for other platforms
    let config: any;

    switch (aiPlatform) {
      case 'openai':
        config = {
          apiKey: state.openaiApiKey,
          model: state.openaiModel,
          baseUrl: state.openaiBaseUrl,
        };
        break;
      case 'gemini':
        config = {
          apiKey: state.geminiApiKey,
          model: state.geminiModel,
          baseUrl: state.geminiBaseUrl,
        };
        break;
      case 'kimi':
        config = {
          apiKey: state.kimiApiKey,
          model: state.kimiModel,
          baseUrl: state.kimiBaseUrl,
        };
        break;
      case 'qwen':
        config = {
          apiKey: state.qwenApiKey,
          model: state.qwenModel,
          baseUrl: state.qwenBaseUrl,
        };
        break;
      default:
        throw new Error(`Unsupported AI platform: ${aiPlatform}`);
    }

    const provider = createAIProvider(aiPlatform, config.baseUrl);
    const documentTitle = state.documentTitle;
    const outline = state.outline;
    const fullOutline = outline.map((block) => `${'  '.repeat(block.level - 1)}- ${block.title}`).join('\n');

    await provider.generateContent(
      {
        sectionTitle: item.title,
        documentTopic: documentTitle,
        fullOutline: fullOutline,
        requirements: item.requirements,
      },
      config,
      (chunk) => {
        onChunk(chunk.text);
      },
      onComplete
    );
  }
};
