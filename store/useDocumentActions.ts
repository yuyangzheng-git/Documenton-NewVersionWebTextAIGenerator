import { useStore } from './useStore';
import { OutlineItem } from './useStore';
import { createAIProvider } from '@/lib/ai/provider-factory';

export const generateOutline = async (prompt: string) => {
  try {
    const state = useStore.getState();
    const { aiPlatform } = state;

    if (aiPlatform === 'dify') {
      // 调用后端代理 API
      const response = await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: prompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate outline');
      }

      const data = await response.json();
      const outline = data.outline;

      // Deduplicate outline items by id to avoid React key conflicts
      const seenIds = new Set<string>();
      const deduplicatedOutline: typeof outline = [];
      outline.forEach((item: any) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          deduplicatedOutline.push(item);
        }
      });

      const outlineWithStatus: OutlineItem[] = deduplicatedOutline.map((item: any) => {
        const parsedLevel = parseInt(String(item.level), 10);
        const level = (parsedLevel === 1 || parsedLevel === 2 || parsedLevel === 3) ? parsedLevel : 1;

        return {
          id: item.id,
          title: item.title,
          level: level as 1 | 2 | 3,
          status: 'pending' as const,
          requirements: item.requirements,
        };
      });

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
    const documentTitle = state.documentTitle;
    const outline = state.outline;
    const fullOutline = outline.map((block) => `${'  '.repeat(block.level - 1)}- ${block.title}`).join('\n');

    // 调用后端代理 API (流式)
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionTitle: item.title,
        documentTopic: documentTitle,
        fullOutline,
        requirements: item.requirements,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate content');
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to read response stream');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              onChunk(parsed.text);
            } else if (parsed.event === 'done') {
              onComplete();
              return;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    onComplete();
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
