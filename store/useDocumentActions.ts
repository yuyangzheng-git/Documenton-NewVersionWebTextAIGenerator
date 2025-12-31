import { generateOutline as generateOutlineAPI } from '@/lib/dify-api';
import { useStore } from './useStore';
import { OutlineItem } from './useStore';

export const generateOutline = async (prompt: string) => {
  try {
    const apiKey = useStore.getState().apiKey;
    if (!apiKey) {
      throw new Error('Please set your Dify API key');
    }

    const outline = await generateOutlineAPI(apiKey, prompt);
    const outlineWithStatus: OutlineItem[] = outline.map((item: any) => ({
      ...item,
      status: 'pending' as const,
    }));

    useStore.getState().setOutline(outlineWithStatus);
    return outlineWithStatus;
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
  const { generateContent: generateContentAPI } = await import('@/lib/dify-api');
  const apiKey = useStore.getState().apiKey;

  await generateContentAPI(apiKey, item.title, onChunk, onComplete);
};
