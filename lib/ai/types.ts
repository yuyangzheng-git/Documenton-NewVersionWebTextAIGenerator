/**
 * AI Platform Type Definitions
 */

export type AIPlatform = 'dify' | 'openai' | 'langchain' | 'custom';

export interface AIConfig {
  platform: AIPlatform;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OutlineItem {
  id: string;
  title: string;
  level: number;
  children?: OutlineItem[];
}

export interface GenerateOutlineOptions {
  prompt: string;
  maxSections?: number;
  depth?: number;
}

export interface GenerateContentOptions {
  sectionTitle: string;
  documentTopic: string;
  fullOutline: string;
  requirements?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface AIProvider {
  generateOutline(
    options: GenerateOutlineOptions,
    config: AIConfig
  ): Promise<OutlineItem[]>;

  generateContent(
    options: GenerateContentOptions,
    config: AIConfig,
    onChunk?: (chunk: StreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void>;

  chat(
    messages: { role: string; content: string }[],
    config: AIConfig,
    onChunk?: (chunk: StreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void>;
}
