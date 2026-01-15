/**
 * AI Provider Factory
 * Creates appropriate AI provider based on platform configuration
 */

import { AIPlatform, AIProvider } from './types';
import { DifyProvider } from './dify-provider';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';
import { KimiProvider } from './kimi-provider';
import { QwenProvider } from './qwen-provider';
import { LangChainProvider } from './langchain-provider';
import { DeepSeekProvider } from './deepseek-provider';
import { ClaudeProvider } from './claude-provider';
import { GroqProvider } from './groq-provider';
import { CohereProvider } from './cohere-provider';
import { WenxinProvider } from './wenxin-provider';
import { ZhipuProvider } from './zhipu-provider';
import { getDifyApiBaseUrl } from '../dify-api';

export function createAIProvider(platform: AIPlatform, baseURL?: string): AIProvider {
  switch (platform) {
    case 'dify':
      return new DifyProvider(getDifyApiBaseUrl());

    case 'openai':
      return new OpenAIProvider(baseURL || 'https://api.openai.com/v1');

    case 'gemini':
      return new GeminiProvider(baseURL || 'https://generativelanguage.googleapis.com/v1beta');

    case 'kimi':
      return new KimiProvider(baseURL || 'https://api.moonshot.cn/v1');

    case 'qwen':
      return new QwenProvider(baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1');

    case 'langchain':
      return new LangChainProvider();

    case 'deepseek':
      return new DeepSeekProvider(baseURL || 'https://api.deepseek.com');

    case 'claude':
      return new ClaudeProvider(baseURL || 'https://api.anthropic.com');

    case 'groq':
      return new GroqProvider(baseURL || 'https://api.groq.com/openai/v1');

    case 'cohere':
      return new CohereProvider(baseURL || 'https://api.cohere.ai/v1');

    case 'wenxin':
      return new WenxinProvider(baseURL || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop');

    case 'zhipu':
      return new ZhipuProvider(baseURL || 'https://open.bigmodel.cn/api/paas/v4');

    case 'custom':
      // For custom providers, user can extend the base AIProvider interface
      throw new Error('Custom provider requires implementation');

    default:
      throw new Error(`Unsupported AI platform: ${platform}`);
  }
}

export function createDifyProvider(): AIProvider {
  return new DifyProvider(getDifyApiBaseUrl());
}

export function createOpenAIProvider(baseURL?: string): AIProvider {
  return new OpenAIProvider(baseURL);
}

export function createGeminiProvider(baseURL?: string): AIProvider {
  return new GeminiProvider(baseURL);
}

export function createKimiProvider(baseURL?: string): AIProvider {
  return new KimiProvider(baseURL);
}

export function createQwenProvider(baseURL?: string): AIProvider {
  return new QwenProvider(baseURL);
}

export function createLangChainProvider(): AIProvider {
  return new LangChainProvider();
}

export function createDeepSeekProvider(baseURL?: string): AIProvider {
  return new DeepSeekProvider(baseURL);
}

export function createClaudeProvider(baseURL?: string): AIProvider {
  return new ClaudeProvider(baseURL);
}

export function createGroqProvider(baseURL?: string): AIProvider {
  return new GroqProvider(baseURL);
}

export function createCohereProvider(baseURL?: string): AIProvider {
  return new CohereProvider(baseURL);
}

export function createWenxinProvider(baseURL?: string): AIProvider {
  return new WenxinProvider(baseURL);
}

export function createZhipuProvider(baseURL?: string): AIProvider {
  return new ZhipuProvider(baseURL);
}

/**
 * Helper function to get provider configuration from environment
 */
export function getProviderConfig(platform: AIPlatform): {
  apiKey: string;
  baseUrl?: string;
  model?: string;
} {
  switch (platform) {
    case 'dify':
      return {
        apiKey: process.env.NEXT_PUBLIC_DIFY_PLANNER_API_KEY || '',
        baseUrl: process.env.NEXT_PUBLIC_DIFY_API_URL,
      };

    case 'openai':
      return {
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o',
        baseUrl: process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      };

    case 'gemini':
      return {
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
        model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-pro',
        baseUrl: process.env.NEXT_PUBLIC_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
      };

    case 'kimi':
      return {
        apiKey: process.env.NEXT_PUBLIC_KIMI_API_KEY || '',
        model: process.env.NEXT_PUBLIC_KIMI_MODEL || 'moonshot-v1-128k',
        baseUrl: process.env.NEXT_PUBLIC_KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
      };

    case 'qwen':
      return {
        apiKey: process.env.NEXT_PUBLIC_QWEN_API_KEY || '',
        model: process.env.NEXT_PUBLIC_QWEN_MODEL || 'qwen-plus',
        baseUrl: process.env.NEXT_PUBLIC_QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      };

    case 'langchain':
      return {
        apiKey: process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY || '',
        model: process.env.NEXT_PUBLIC_LANGCHAIN_MODEL || 'gpt-4',
      };

    case 'deepseek':
      return {
        apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
        model: process.env.NEXT_PUBLIC_DEEPSEEK_MODEL || 'deepseek-chat',
        baseUrl: process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      };

    case 'claude':
      return {
        apiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '',
        model: process.env.NEXT_PUBLIC_CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        baseUrl: process.env.NEXT_PUBLIC_CLAUDE_BASE_URL || 'https://api.anthropic.com',
      };

    case 'groq':
      return {
        apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
        model: process.env.NEXT_PUBLIC_GROQ_MODEL || 'llama-3.3-70b-versatile',
        baseUrl: process.env.NEXT_PUBLIC_GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
      };

    case 'cohere':
      return {
        apiKey: process.env.NEXT_PUBLIC_COHERE_API_KEY || '',
        model: process.env.NEXT_PUBLIC_COHERE_MODEL || 'command-r-plus',
        baseUrl: process.env.NEXT_PUBLIC_COHERE_BASE_URL || 'https://api.cohere.ai/v1',
      };

    case 'wenxin':
      return {
        apiKey: process.env.NEXT_PUBLIC_WENXIN_API_KEY || '',
        model: process.env.NEXT_PUBLIC_WENXIN_MODEL || 'ernie-4.0-8k',
        baseUrl: process.env.NEXT_PUBLIC_WENXIN_BASE_URL || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
      };

    case 'zhipu':
      return {
        apiKey: process.env.NEXT_PUBLIC_ZHIPU_API_KEY || '',
        model: process.env.NEXT_PUBLIC_ZHIPU_MODEL || 'glm-4-plus',
        baseUrl: process.env.NEXT_PUBLIC_ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
      };

    default:
      return {
        apiKey: '',
      };
  }
}
