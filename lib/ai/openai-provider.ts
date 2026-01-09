/**
 * OpenAI Provider Implementation
 */

import {
  AIConfig,
  AIProvider,
  GenerateContentOptions,
  GenerateOutlineOptions,
  OutlineItem,
  StreamChunk
} from './types';

export class OpenAIProvider implements AIProvider {
  private baseURL: string;

  constructor(baseURL: string = 'https://api.openai.com/v1') {
    this.baseURL = baseURL;
  }

  /**
   * Generate document outline using OpenAI
   */
  async generateOutline(
    options: GenerateOutlineOptions,
    config: AIConfig
  ): Promise<OutlineItem[]> {
    const { prompt, maxSections = 10, depth = 2 } = options;

    const systemPrompt = `You are a professional document outline generator. Your task is to create a structured outline based on the user's topic.

Requirements:
1. Create a clear, logical structure
2. Maximum ${maxSections} main sections
3. Maximum depth of ${depth} levels
4. Each section should have a clear, descriptive title
5. Return ONLY valid JSON in the following format:

{
  "outline": [
    {
      "id": "1",
      "title": "Section Title",
      "level": 1,
      "children": [
        {
          "id": "1.1",
          "title": "Subsection Title",
          "level": 2
        }
      ]
    }
  ]
}

Do not include any explanations or text outside the JSON.`;

    try {
      const response = await fetch(`${config.baseUrl || this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create an outline for: ${prompt}` }
          ],
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';

      // Parse JSON response
      const result = JSON.parse(content);

      if (!result.outline || !Array.isArray(result.outline)) {
        throw new Error('Invalid response format from OpenAI');
      }

      return result.outline;
    } catch (error) {
      console.error('OpenAI outline generation error:', error);
      throw error;
    }
  }

  /**
   * Generate section content with streaming support
   */
  async generateContent(
    options: GenerateContentOptions,
    config: AIConfig,
    onChunk?: (chunk: StreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const { sectionTitle, documentTopic, fullOutline } = options;

    const systemPrompt = `You are a professional document writer. Your task is to write high-quality content for a specific section of a document.

Requirements:
1. Write in a professional, engaging style
2. Be thorough and informative
3. Use clear, well-structured paragraphs
4. Do NOT include section titles (the title will be added separately)
5. Do NOT use Markdown formatting (no **bold**, no ## headings, etc.)
6. Use proper punctuation and grammar
7. Write in Chinese

Context:
- Document topic: ${documentTopic}
- Full outline:
${fullOutline}

Write content for section: ${sectionTitle}`;

    try {
      const response = await fetch(`${config.baseUrl || this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt }
          ],
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      // Handle streaming response
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

            if (data === '[DONE]') {
              onChunk?.({ text: '', done: true });
              onComplete?.();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                onChunk?.({ text: content, done: false });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenAI content generation error:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Chat completion with streaming support
   */
  async chat(
    messages: { role: string; content: string }[],
    config: AIConfig,
    onChunk?: (chunk: StreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${config.baseUrl || this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4',
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
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

            if (data === '[DONE]') {
              onChunk?.({ text: '', done: true });
              onComplete?.();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                onChunk?.({ text: content, done: false });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenAI chat error:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}
