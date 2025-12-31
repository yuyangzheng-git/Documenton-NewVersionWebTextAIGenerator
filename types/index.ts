export interface OutlineItem {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  status: 'idle' | 'generating' | 'completed' | 'pending';
  content?: string;
}

export interface GenerateConfig {
  apiKey: string;
  apiUrl: string;
}
