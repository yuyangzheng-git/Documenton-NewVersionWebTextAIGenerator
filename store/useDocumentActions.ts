import { generateOutlineWithPlanner as generateOutlineAPI, DifyOutlineItem } from '@/lib/dify-api';
import { useStore } from './useStore';
import { OutlineItem } from './useStore';

export const generateOutline = async (prompt: string) => {
  try {
    const apiKey = useStore.getState().apiKey;
    if (!apiKey) {
      throw new Error('Please set your Dify API key');
    }

    const outline = await generateOutlineAPI(apiKey, prompt);
    const outlineWithStatus: OutlineItem[] = outline.map((item: DifyOutlineItem) => ({
      id: item.id,
      title: item.title,
      level: item.level as 1 | 2,
      status: 'pending' as const,
      requirements: item.requirements,
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
  const { generateSectionWithWorker } = await import('@/lib/dify-api');
  const apiKey = useStore.getState().apiKey;
  const documentTitle = useStore.getState().documentTitle;
  const outline = useStore.getState().outline;
  const fullOutline = outline.map((block) => `${'  '.repeat(block.level - 1)}- ${block.title}`).join('\n');

  await generateSectionWithWorker(apiKey, item.title, documentTitle, fullOutline, item.requirements, onChunk, onComplete);
};
