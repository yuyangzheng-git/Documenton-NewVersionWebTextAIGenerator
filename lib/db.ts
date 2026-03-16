import Dexie, { Table } from 'dexie';

export interface BlockData {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'bullet' | 'numbered' | 'todo' | 'code' | 'quote' | 'divider' | 'callout' | 'image' | 'table' | 'guide';
  content: string;
  props: {
    level?: 1 | 2 | 3 | 4;
    guidance?: string;
    guidanceVisible?: boolean;
    src?: string;
    caption?: string;
    width?: number;
    listType?: 'bullet' | 'ordered';
    checked?: boolean;
    loading?: boolean;
  };
  order: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface Metadata {
  key: string;
  value: any;
  updatedAt?: number;
}

export class DocumentEditorDB extends Dexie {
  blocks!: Table<BlockData>;
  metadata!: Table<Metadata>;

  constructor() {
    super('DocumentEditorDB');

    // Version 1: Initial schema
    this.version(1).stores({
      blocks: 'id, type, order',
      metadata: 'key'
    });

    // Version 2: Add composite index and timestamps
    this.version(2).stores({
      blocks: 'id, type, order, [type+order], createdAt, updatedAt',
      metadata: 'key, updatedAt'
    }).upgrade(trans => {
      const now = Date.now();
      return trans.table('blocks').toCollection().modify(block => {
        if (!block.order && block.order !== 0) {
          block.order = 0;
        }
        if (!block.createdAt) {
          block.createdAt = now;
        }
        if (!block.updatedAt) {
          block.updatedAt = now;
        }
      });
    });
  }
}

export const db = new DocumentEditorDB();

// Auto-save with error recovery
export async function saveBlocks(blocks: BlockData[]): Promise<void> {
  const maxRetries = 3;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const now = Date.now();
      const blocksWithTimestamps = blocks.map(block => ({
        ...block,
        updatedAt: now,
        createdAt: block.createdAt || now,
      }));

      await db.transaction('rw', db.blocks, async () => {
        await db.blocks.clear();
        await db.blocks.bulkAdd(blocksWithTimestamps);
      });

      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Save failed');

      if (attempt < maxRetries - 1) {
        console.warn(`[DB] Save attempt ${attempt + 1} failed, retrying...`, lastError);
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to save blocks after retries');
}

// Load with caching
let cachedBlocks: BlockData[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000; // 1 second

export async function loadBlocks(useCache = true): Promise<BlockData[]> {
  try {
    // Check cache
    if (useCache && cachedBlocks && Date.now() - cacheTime < CACHE_TTL) {
      return cachedBlocks;
    }

    const blocks = await db.blocks.orderBy('order').toArray();

    // Update cache
    cachedBlocks = blocks;
    cacheTime = Date.now();

    return blocks;
  } catch (error) {
    console.error('[DB] Failed to load blocks:', error);

    // Return cached data if available
    if (cachedBlocks) {
      console.warn('[DB] Returning cached data due to load error');
      return cachedBlocks;
    }

    return [];
  }
}

// Query blocks by type with composite index
export async function loadBlocksByType(type: BlockData['type']): Promise<BlockData[]> {
  try {
    return await db.blocks
      .where('[type+order]')
      .between([type, Dexie.minKey], [type, Dexie.maxKey])
      .toArray();
  } catch (error) {
    console.error('[DB] Failed to load blocks by type:', error);
    return [];
  }
}

// Save metadata with timestamp
export async function saveMetadata(key: string, value: any): Promise<void> {
  try {
    await db.metadata.put({
      key,
      value,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('[DB] Failed to save metadata:', error);
  }
}

// Load metadata
export async function loadMetadata<T>(key: string): Promise<T | undefined> {
  try {
    const result = await db.metadata.get(key);
    return result?.value;
  } catch (error) {
    console.error('[DB] Failed to load metadata:', error);
    return undefined;
  }
}

// Clear database with confirmation
export async function clearDatabase(): Promise<void> {
  try {
    await db.transaction('rw', db.blocks, db.metadata, async () => {
      await db.blocks.clear();
      await db.metadata.clear();
    });

    // Clear cache
    cachedBlocks = null;
    cacheTime = 0;

    console.log('[DB] Database cleared successfully');
  } catch (error) {
    console.error('[DB] Failed to clear database:', error);
    throw error;
  }
}

// Export database to JSON
export async function exportDatabase(): Promise<string> {
  try {
    const blocks = await loadBlocks(false);
    const metadata = await db.metadata.toArray();

    return JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      blocks,
      metadata,
    }, null, 2);
  } catch (error) {
    console.error('[DB] Failed to export database:', error);
    throw error;
  }
}

// Import database from JSON
export async function importDatabase(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);

    await db.transaction('rw', db.blocks, db.metadata, async () => {
      await db.blocks.clear();
      await db.metadata.clear();

      if (data.blocks) {
        await db.blocks.bulkAdd(data.blocks);
      }

      if (data.metadata) {
        await db.metadata.bulkAdd(data.metadata);
      }
    });

    // Clear cache
    cachedBlocks = null;
    cacheTime = 0;

    console.log('[DB] Database imported successfully');
  } catch (error) {
    console.error('[DB] Failed to import database:', error);
    throw error;
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.blocks.limit(1).toArray();
    return true;
  } catch (error) {
    console.error('[DB] Database health check failed:', error);
    return false;
  }
}

// Get database statistics
export async function getDatabaseStats(): Promise<{
  blockCount: number;
  metadataCount: number;
  dbSize?: number;
}> {
  try {
    const blockCount = await db.blocks.count();
    const metadataCount = await db.metadata.count();

    // Estimate size (IndexedDB doesn't provide exact size)
    let dbSize: number | undefined;
    if ('estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      dbSize = estimate.usage;
    }

    return { blockCount, metadataCount, dbSize };
  } catch (error) {
    console.error('[DB] Failed to get database stats:', error);
    return { blockCount: 0, metadataCount: 0 };
  }
}
