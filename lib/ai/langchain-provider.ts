/**
 * LangChain Provider Implementation
 * Note: This is a simplified implementation. For production use, install @langchain/core and @langchain/openai
 */

import {
  AIConfig,
  AIProvider,
  GenerateContentOptions,
  GenerateOutlineOptions,
  OutlineItem,
  StreamChunk
} from './types';

export class LangChainProvider implements AIProvider {
  /**
   * Generate document outline using LangChain
   */
  async generateOutline(
    options: GenerateOutlineOptions,
    config: AIConfig
  ): Promise<OutlineItem[]> {
    const { prompt, maxSections = 10, depth = 2 } = options;

    const systemPrompt = `你是一位专业的文档大纲生成专家。你的任务是根据用户的主题，创建结构完整、逻辑清晰的专业文档大纲。

## 核心要求

1. **结构清晰**
   - 采用标准章节编号（1、1.1、1.1.1等）
   - 每层子节不超过 ${depth} 层
   - 主要章节数量不超过 ${maxSections} 个
   - 平衡各章节内容量，避免头重脚轻

2. **内容完整**
   - 确保覆盖主题的所有核心方面
   - 章节之间要有明确的边界，避免内容重复
   - 父节与子节要体现出包含与被包含关系
   - 保持逻辑递进关系

3. **输出格式**
   - 严格输出 JSON 数组格式
   - 不要包含 Markdown 代码块（如 \`\`\`json）
   - 不要包含任何解释性文字

## JSON 格式规范

输出扁平的 JSON 数组，每个对象包含：
- \`id\`: 唯一标识符，一级标题用数字（1, 2, 3），二级标题用连字符（1-1, 1-2, 2-1）
- \`title\`: 章节标题，建议使用标准编号（1、1.1、2、2.1）
- \`level\`: 层级，1 代表一级标题，2 代表二级标题
- \`content\`: 空字符串，内容由后续章节生成阶段填充
- \`requirements\`: 章节内容规划，用段落形式写出，明确说明本章要写哪些内容

## requirements 写作规范
- 用段落形式写出，不要用数字列表
- 明确说明本章要写哪些内容，按顺序组织
- 指出需要避免与其他章节重复的内容
- 说明需要引用的数据、标准或案例
- 用自然的段落式表述，便于阅读和编辑

用户主题：${prompt}

请直接输出 JSON 数组，不要包含任何其他文字。`;

    try {
      // Use OpenAI API directly (LangChain abstracts this, but we'll use direct API for simplicity)
      const response = await fetch(`${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
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
        throw new Error(`LangChain/OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';

      // Parse JSON response
      const result = JSON.parse(content);

      if (!result.outline || !Array.isArray(result.outline)) {
        throw new Error('Invalid response format');
      }

      return result.outline;
    } catch (error) {
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
    const { sectionTitle, documentTopic, fullOutline, requirements } = options;

    const systemPrompt = `你是一位专业的文档写作专家。你的任务是为特定章节撰写高质量的内容。

## ⚠️ 最重要原则
必须严格按照提供的 requirements 撰写内容！

## 核心写作原则
1. **严禁内容重复** - 不要重复章节标题，不要与章节规划重复
2. **内容聚焦** - 紧扣本章节主题，不要偏离到其他章节的内容
3. **深浅适宜** - 如果有子章节，本章只做概括；如果没有，则深入展开
4. **逻辑连贯** - 段落之间要有合理的逻辑连接

## 格式要求 ⚠️ 严格遵守
- **禁止 Markdown**：不要使用 \`#\`、\`**\`、\`*\`、\`-\` 等符号
- **使用中文标点**：中文全角标点（，。；：！）
- **段落分明**：每段之间空一行
- **段落长度**：每段 150-300 字，便于阅读

## 上下文信息
- 文档主题：${documentTopic}
- 完整大纲：
${fullOutline}

${requirements ? `
## 章节写作要求
${requirements}
` : ''}

请为以下章节撰写内容：${sectionTitle}

开始撰写内容：`;

    try {
      const response = await fetch(`${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
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
        throw new Error(`LangChain API error: ${response.status} - ${error}`);
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
    const systemPrompt = `你是一位专业的文档写作助手和智能问答专家。

## 核心能力
1. **章节重写**：根据要求提供更专业、更详实的内容
2. **内容建议**：提供关于文档结构、内容组织的专业建议
3. **问题解答**：回答用户关于文档写作、AI 功能使用的问题

## 写作规范 ⚠️ 严格遵守
- **禁止 Markdown**：不要使用 \`#\`、\`**\`、\`*\`、\`-\` 等符号
- **使用中文标点**：中文全角标点（，。；：！）
- **段落分明**：每段之间空一行
- **禁止开场白**：不要说"好的"、"我来帮您"等

## 禁止事项 ❌
- 不要包含思考过程
- 不要使用 Markdown 格式
- 不要包含"好的"等开场白
- 不要重复章节标题
- 不要使用英文标点`;

    try {
      const response = await fetch(`${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LangChain API error: ${response.status} - ${error}`);
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
      onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}
