import { useEffect, useRef, useCallback } from 'react';
import { saveBlocks, BlockData } from '@/lib/db';
import { NotionBlock } from '@/components/NotionEditor';

interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useAutoSave(
  blocks: NotionBlock[],
  options: UseAutoSaveOptions = {}
) {
  const {
    enabled = true,
    debounceMs = 1000,
    onSaveSuccess,
    onSaveError
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const saveQueueRef = useRef<Promise<void> | null>(null);
  const versionRef = useRef(0);

  const performSave = useCallback(async (blocksToSave: NotionBlock[], version: number) => {
    try {
      const blocksData = blocksToSave.map((block, index) => ({
        id: block.id,
        type: block.type,
        content: block.content,
        props: block.properties as BlockData['props'],
        order: index,
      }));

      await saveBlocks(blocksData);

      onSaveSuccess?.();

      console.log(`[AutoSave] Version ${version} saved successfully`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Save failed');
      console.error('[AutoSave] Save error:', err);

      onSaveError?.(err);

      throw err;
    }
  }, [onSaveSuccess, onSaveError]);

  useEffect(() => {
    if (!enabled) return;

    clearTimeout(timeoutRef.current);

    const currentVersion = ++versionRef.current;

    timeoutRef.current = setTimeout(() => {
      const savePromise = (async () => {
        if (saveQueueRef.current) {
          try {
            await saveQueueRef.current;
          } catch {
            // Ignore previous save errors, continue current save
          }
        }

        await performSave(blocks, currentVersion);
      })();

      saveQueueRef.current = savePromise;
    }, debounceMs);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [blocks, enabled, debounceMs, performSave]);

  const saveNow = useCallback(async () => {
    clearTimeout(timeoutRef.current);
    const version = ++versionRef.current;

    if (saveQueueRef.current) {
      await saveQueueRef.current;
    }

    const savePromise = performSave(blocks, version);
    saveQueueRef.current = savePromise;
    await savePromise;
  }, [blocks, performSave]);

  return { saveNow };
}
