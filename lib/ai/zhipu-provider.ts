/**
 * Zhipu GLM Provider
 * Supports Zhipu AI's ChatGLM series models
 * Docs: https://open.bigmodel.cn/dev/api#model
 */

import { AIProvider, AIConfig, GenerateOutlineOptions, GenerateContentOptions, StreamChunk } from './types';

export class ZhipuProvider implements AIProvider {
  private baseURL: string;
  private jwtToken: string | null = null;

  constructor(baseURL: string = 'https://open.bigmodel.cn/api/paas/v4') {
    this.baseURL = baseURL;
  }

  private async generateJWT(apiKey: string): Promise<string> {
    // API Key format: {id}.{secret}
    const parts = apiKey.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid Zhipu API Key format. Expected format: {id}.{secret}');
    }

    const [id, secret] = parts;
    const timestamp = Date.now();

    const header = {
      alg: 'HS256',
      sign_type: 'SIGN',
    };

    const payload = {
      api_key: id,
      exp: timestamp + 3600 * 1000, // 1 hour
      timestamp: timestamp,
    };

    // Simple JWT encoding (in production, use a proper JWT library)
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const data = `${encodedHeader}.${encodedPayload}`;

    // This is a simplified signature - in production use crypto.subtle or a JWT library
    const signature = await this.signData(data, secret);

    return `${data}.${signature}`;
  }

  private async signData(data: string, secret: string): Promise<string> {
    // In production, use proper HMAC-SHA256 signing
    // This is a placeholder - you'll need to implement proper JWT signing
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    return hmac.digest('base64url');
  }

  private async getAuthToken(config: AIConfig): Promise<string> {
    if (this.jwtToken) {
      return this.jwtToken;
    }

    this.jwtToken = await this.generateJWT(config.apiKey);
    return this.jwtToken;
  }

  private getHeaders(authToken: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
  }

  async generateOutline(options: GenerateOutlineOptions, config: AIConfig): Promise<any[]> {
    const authToken = await this.getAuthToken(config);
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
      headers: this.getHeaders(authToken),
      body: JSON.stringify({
        model: config.model || 'glm-4-plus',
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
      throw new Error(`Zhipu API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse outline JSON from Zhipu response');
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
    const authToken = await this.getAuthToken(config);
    const prompt = this.buildContentPrompt(options);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(authToken),
        body: JSON.stringify({
          model: config.model || 'glm-4-plus',
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
        throw new Error(`Zhipu API error: ${response.status} - ${error}`);
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
    const authToken = await this.getAuthToken(config);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(authToken),
        body: JSON.stringify({
          model: config.model || 'glm-4-plus',
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Zhipu API error: ${response.status} - ${error}`);
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
