'use client';

export interface TableCell {
  content: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableColumn {
  id: string;  // UUID for stable identification
  width?: number;  // Default: 150px
}

export interface TableRow {
  id: string;
  cells: TableCell[];
}

export interface TableBlockData {
  id: string;
  type: 'table';
  columns: TableColumn[];
  rows: TableRow[];
  enableHeaderRow?: boolean;
  defaultColumnWidth?: number;
}

export interface TableBlockProps {
  block: any;  // NotionBlock type
  editable?: boolean;
  onUpdate?: (id: string, updates: Partial<any>) => void;
  onDelete?: (id: string) => void;
}
