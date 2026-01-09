/**
 * AI Provider Factory
 * Creates appropriate AI provider based on platform configuration
 */

import { AIPlatform, AIProvider } from './types';
import { DifyProvider } from './dify-provider';
import { OpenAIProvider } from './openai-provider';
import { LangChainProvider } from './langchain-provider';
import { getDifyApiBaseUrl } from '../dify-api';

export function createAIProvider(platform: AIPlatform): AIProvider {
  switch (platform) {
    case 'dify':
      return new DifyProvider(getDifyApiBaseUrl());

    case 'openai':
      return new OpenAIProvider('https://api.openai.com/v1');

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
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4',
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
