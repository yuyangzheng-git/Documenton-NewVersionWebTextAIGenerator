/**
 * Wenxin (Baidu Ernie Bot) Provider
 * Supports Baidu's Qianfan Platform models
 * Docs: https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Nlks5zkzu
 */

import { AIProvider, AIConfig, GenerateOutlineOptions, GenerateContentOptions, StreamChunk } from './types';

export class WenxinProvider implements AIProvider {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop') {
    this.baseURL = baseURL;
  }

  private async getAccessToken(apiKey: string, secretKey: string): Promise<string> {
    // API Key format: {API Key}#{Secret Key}
    const parts = apiKey.split('#');
    if (parts.length !== 2) {
      throw new Error('Invalid Baidu API Key format. Expected format: {API Key}#{Secret Key}');
    }

    const [ak, sk] = parts;

    const response = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${ak}&client_secret=${sk}`
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Baidu access token: ${error}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error('No access token in Baidu response');
    }

    return data.access_token;
  }

  private async ensureAccessToken(config: AIConfig): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    this.accessToken = await this.getAccessToken(config.apiKey, '');
    return this.accessToken;
  }

  private getHeaders(accessToken: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  async generateOutline(options: GenerateOutlineOptions, config: AIConfig): Promise<any[]> {
    const accessToken = await this.ensureAccessToken(config);
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

    const response = await fetch(
      `${this.baseURL}/chat/ernie-4.0-8k?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: this.getHeaders(accessToken),
        body: JSON.stringify({
          messages: [
            { role: 'user', content: prompt },
          ],
          temperature: config.temperature || 0.7,
          max_output_tokens: config.maxTokens || 4000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wenxin API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.result;

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse outline JSON from Wenxin response');
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
    const accessToken = await this.ensureAccessToken(config);
    const prompt = this.buildContentPrompt(options);

    try {
      const response = await fetch(
        `${this.baseURL}/chat/ernie-4.0-8k?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            messages: [
              { role: 'user', content: prompt },
            ],
            temperature: config.temperature || 0.8,
            max_output_tokens: config.maxTokens || 4000,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Wenxin API error: ${response.status} - ${error}`);
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
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const text = parsed.result;
            if (text) {
              onChunk?.({ text, done: false });
            }

            if (parsed.is_end) {
              onComplete?.();
              return;
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
    const accessToken = await this.ensureAccessToken(config);

    // Convert role format: assistant -> assistant (Baidu uses same format)
    const baiduMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    try {
      const response = await fetch(
        `${this.baseURL}/chat/ernie-4.0-8k?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            messages: baiduMessages,
            temperature: config.temperature || 0.7,
            max_output_tokens: config.maxTokens || 4000,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Wenxin API error: ${response.status} - ${error}`);
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
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const text = parsed.result;
            if (text) {
              onChunk?.({ text, done: false });
            }

            if (parsed.is_end) {
              onComplete?.();
              return;
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
