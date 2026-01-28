import Dexie, { Table } from 'dexie';

export interface BlockData {
  id: string;        // UUID v4
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'bullet' | 'numbered' | 'todo' | 'code' | 'quote' | 'divider' | 'callout' | 'image' | 'guide';
  content: string;   // 文本内容 或 HTML 表格代码
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
}

export interface Metadata {
  key: string;
  value: any;
}

export class DocumentEditorDB extends Dexie {
  blocks!: Table<BlockData>;
  metadata!: Table<Metadata>;

  constructor() {
    super('DocumentEditorDB');
    this.version(1).stores({
      blocks: 'id, type, order',
      metadata: 'key'
    });
  }
}

export const db = new DocumentEditorDB();

// 自动保存功能
export async function saveBlocks(blocks: BlockData[]): Promise<void> {
  try {
    await db.transaction('rw', db.blocks, async () => {
      await db.blocks.clear();
      await db.blocks.bulkAdd(blocks);
    });
    console.log('Blocks saved to IndexedDB:', blocks.length);
  } catch (error) {
    console.error('Error saving blocks:', error);
    throw error;
  }
}

// 加载功能
export async function loadBlocks(): Promise<BlockData[]> {
  try {
    const blocks = await db.blocks.orderBy('order').toArray();
    console.log('Blocks loaded from IndexedDB:', blocks.length);
    return blocks;
  } catch (error) {
    console.error('Error loading blocks:', error);
    return [];
  }
}

// 保存元数据
export async function saveMetadata(key: string, value: any): Promise<void> {
  try {
    await db.metadata.put({ key, value });
  } catch (error) {
    console.error('Error saving metadata:', error);
  }
}

// 加载元数据
export async function loadMetadata<T>(key: string): Promise<T | undefined> {
  try {
    const result = await db.metadata.get(key);
    return result?.value;
  } catch (error) {
    console.error('Error loading metadata:', error);
    return undefined;
  }
}

// 清空数据库
export async function clearDatabase(): Promise<void> {
  try {
    await db.transaction('rw', db.blocks, db.metadata, async () => {
      await db.blocks.clear();
      await db.metadata.clear();
    });
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}
