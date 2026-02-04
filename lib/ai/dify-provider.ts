/**
 * Dify Provider Implementation
 * Wraps existing Dify API functions to match AIProvider interface
 */

import {
  AIConfig,
  AIProvider,
  GenerateContentOptions,
  GenerateOutlineOptions,
  OutlineItem,
  StreamChunk
} from './types';
import {
  generateOutlineWithPlanner,
  generateSectionWithWorker,
  DifyOutlineItem
} from '../dify-api';

export class DifyProvider implements AIProvider {
  constructor(private baseURL: string) {}

  /**
   * Generate document outline using Dify Workflow API
   */
  async generateOutline(
    options: GenerateOutlineOptions,
    config: AIConfig
  ): Promise<OutlineItem[]> {
    const outline = await generateOutlineWithPlanner(config.apiKey, options.prompt);
    return outline;
  }

  /**
   * Generate section content using Dify Worker API with streaming
   */
  async generateContent(
    options: GenerateContentOptions,
    config: AIConfig,
    onChunk?: (chunk: StreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    await generateSectionWithWorker(
      config.apiKey,
      options.sectionTitle,
      options.documentTopic,
      options.fullOutline,
      (text: string) => {
        onChunk?.({ text, done: false });
      },
      () => {
        onChunk?.({ text: '', done: true });
        onComplete?.();
      },
      options.requirements,
      (error: Error) => {
        onError?.(error);
      }
    );
  }

  /**
   * Chat completion using Dify Chat API
   */
  async chat(
    messages: { role: string; content: string }[],
    config: AIConfig,
    onChunk?: (chunk: StreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          query: messages[messages.length - 1].content,
          response_mode: 'streaming',
          conversation_id: '',
          user: '',
          inputs: {},
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Dify API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onChunk?.({ text: '', done: true });
          onComplete?.();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);

            try {
              const parsed = JSON.parse(data);
              const event = parsed.event;

              if (event === 'conversation.message.delta') {
                const content = parsed.answer || parsed.data?.content;
                if (content) {
                  onChunk?.({ text: content, done: false });
                }
              } else if (event === 'conversation.message.end') {
                onChunk?.({ text: '', done: true });
                onComplete?.();
                return;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}
