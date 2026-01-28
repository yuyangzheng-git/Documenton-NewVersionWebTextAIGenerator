import { useEffect, useRef } from 'react';
import { saveBlocks } from '@/lib/db';
import { NotionBlock } from '@/components/NotionEditor';

interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoSave(
  blocks: NotionBlock[],
  options: UseAutoSaveOptions = {}
) {
  const { enabled = true, debounceMs = 1000 } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const saveInProgressRef = useRef(false);

  useEffect(() => {
    if (!enabled || saveInProgressRef.current) return;

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(async () => {
      try {
        saveInProgressRef.current = true;

        // 转换 NotionBlock 为 BlockData
        const blocksData = blocks.map((block, index) => ({
          id: block.id,
          type: block.type,
          content: block.content,
          props: block.properties as BlockData['props'],
          order: index,
        }));

        await saveBlocks(blocksData);
        console.log('Auto-saved', blocks.length, 'blocks');
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        saveInProgressRef.current = false;
      }
    }, debounceMs);

    // 清理定时器
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [blocks, enabled, debounceMs]);
}
