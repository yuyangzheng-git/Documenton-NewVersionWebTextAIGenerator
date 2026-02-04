import { useState, useEffect } from 'react';
import { loadBlocks, loadMetadata, BlockData } from '@/lib/db';
import { NotionBlock } from '@/components/NotionEditor';

export function useLoadFromDB(enabled: boolean = true) {
  const [blocks, setBlocks] = useState<NotionBlock[]>([]);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    async function loadFromDB() {
      setLoading(true);
      setError(null);

      try {
        // 加载 blocks
        const blocksData: BlockData[] = await loadBlocks();

        // 转换 BlockData 为 NotionBlock
        const notionBlocks: NotionBlock[] = blocksData.map(block => ({
          id: block.id,
          type: block.type as any,
          content: block.content,
          properties: block.props,
          children: [],
        }));

        setBlocks(notionBlocks);

        // 加载元数据
        const title = await loadMetadata<string>('documentTitle');
        const topic = await loadMetadata<string>('documentTopic');

        setMetadata({
          documentTitle: title,
          documentTopic: topic,
        });
      } catch {
        setError(new Error('Failed to load'));
      } finally {
        setLoading(false);
      }
    }

    loadFromDB();
  }, [enabled]);

  return { blocks, metadata, loading, error };
}
