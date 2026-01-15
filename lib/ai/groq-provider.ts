/**
 * Groq Provider
 * Supports ultra-fast inference with Groq's LPU inference engine
 * Docs: https://console.groq.com/docs/quickstart
 */

import { AIProvider, AIConfig, GenerateOutlineOptions, GenerateContentOptions, StreamChunk } from './types';

export class GroqProvider implements AIProvider {
  private baseURL: string;

  constructor(baseURL: string = 'https://api.groq.com/openai/v1') {
    this.baseURL = baseURL;
  }

  private getHeaders(apiKey: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
  }

  async generateOutline(options: GenerateOutlineOptions, config: AIConfig): Promise<any[]> {
    const prompt = `You are a professional document outline generator. Generate a structured outline for the following topic.

Topic: ${options.prompt}

Requirements:
- Generate ${options.maxSections || 8} main sections
- Each section should have a clear title and brief description
- Use hierarchical structure (1, 1.1, 2, 2.1, etc.)
- Be comprehensive and logically organized
- Output in valid JSON array format with fields: id, title, level, requirements

Response format:
[
  {
    "id": "1",
    "title": "Section Title",
    "level": 1,
    "requirements": "What this section should cover..."
  }
]`;

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(config.apiKey),
      body: JSON.stringify({
        model: config.model || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates structured document outlines in JSON format.' },
          { role: 'user', content: prompt },
        ],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse outline JSON from Groq response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  async generateContent(
    options: GenerateContentOptions,
    config: AIConfig,
    onChunk?: (chunk: StreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const prompt = this.buildContentPrompt(options);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(config.apiKey),
        body: JSON.stringify({
          model: config.model || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a professional writer who creates engaging, well-structured content.' },
            { role: 'user', content: prompt },
          ],
          temperature: config.temperature || 0.8,
          max_tokens: config.maxTokens || 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

        for (const line of lines) {
          const data = line.replace('data:', '').trim();
          if (data === '[DONE]') {
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

      onComplete?.();
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  async chat(
    messages: { role: string; content: string }[],
    config: AIConfig,
    onChunk?: (chunk: StreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(config.apiKey),
        body: JSON.stringify({
          model: config.model || 'llama-3.3-70b-versatile',
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

        for (const line of lines) {
          const data = line.replace('data:', '').trim();
          if (data === '[DONE]') {
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

      onComplete?.();
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  private buildContentPrompt(options: GenerateContentOptions): string {
    let prompt = `Write content for the following section:

Section Title: ${options.sectionTitle}
Document Topic: ${options.documentTopic}

Full Outline Structure:
${options.fullOutline}`;

    if (options.requirements) {
      prompt += `

Section Requirements/Content Planning:
${options.requirements}`;
    }

    prompt += `

Requirements:
- Write in a professional, engaging style
- Use clear paragraphs with proper transitions
- Include relevant examples where appropriate
- Ensure content is comprehensive and well-structured
- Aim for approximately 500-800 words`;

    return prompt;
  }
}
