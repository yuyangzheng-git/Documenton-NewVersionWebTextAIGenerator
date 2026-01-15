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

    default:
      return {
        apiKey: '',
      };
  }
}
