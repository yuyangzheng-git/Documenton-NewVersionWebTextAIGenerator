# AI Platform Integration Guide

This document explains how to integrate and use different AI platforms with Document AI Generator.

## Supported Platforms

- **Dify** - Open-source AI application development platform
- **OpenAI** - Official OpenAI API (GPT-4, GPT-3.5 Turbo, etc.)
- **LangChain** - Framework for developing applications with LLMs
- **Custom** - Implement your own AI provider

## Architecture

The project uses a unified AI provider interface (`AIProvider`) that abstracts away the differences between platforms.

```
┌─────────────────────────────────────┐
│   Application Components            │
│   (Editor, Chat, Outline Panel)  │
└────────────┬──────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Provider Factory                │
│   createAIProvider(platform)       │
└────────────┬──────────────────────┘
             │
      ┌──────┼──────┐
      ▼      ▼      ▼
   ┌────┐ ┌─────┐ ┌──────────┐
   │Dify│ │OpenAI│ │LangChain│
   └────┘ └─────┘ └──────────┘
```

## Setup

### 1. Environment Variables

Create or update your `.env.local` file:

```env
# ============================================
# AI Platform Configuration
# ============================================

# Dify Configuration
NEXT_PUBLIC_DIFY_PLANNER_API_KEY=your_planner_app_key
NEXT_PUBLIC_DIFY_CHAPTER_API_KEY=your_chapter_app_key
NEXT_PUBLIC_DIFY_API_URL=http://your-dify-instance/v1
NEXT_PUBLIC_DIFY_CHAT_API_KEY=your_chat_app_key

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=sk-your_openai_api_key
NEXT_PUBLIC_OPENAI_MODEL=gpt-4
NEXT_PUBLIC_OPENAI_BASE_URL=https://api.openai.com/v1

# LangChain Configuration
NEXT_PUBLIC_LANGCHAIN_API_KEY=sk-your_api_key
NEXT_PUBLIC_LANGCHAIN_MODEL=gpt-4
```

### 2. Using Dify

Dify is a powerful open-source platform for building AI applications.

**Setup:**
1. Go to [Dify](https://cloud.dify.ai/) or self-host Dify
2. Create a Workflow app for outline generation
3. Create a Chat app for chapter writing
4. Get API keys from app settings

**Configuration:**
```typescript
const config = {
  platform: 'dify',
  apiKey: 'app-xxxxxxxxxxxxxx',
  baseUrl: 'http://your-dify-instance/v1',
};
```

### 3. Using OpenAI

Direct integration with OpenAI's official API.

**Setup:**
1. Get API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Configure the model (gpt-4, gpt-3.5-turbo, etc.)
3. Optionally set a custom base URL for proxies

**Configuration:**
```typescript
const config = {
  platform: 'openai',
  apiKey: 'sk-xxxxxxxxxxxxxx',
  model: 'gpt-4',
  baseUrl: 'https://api.openai.com/v1',
};
```

**Supported Models:**
- GPT-4
- GPT-4 Turbo
- GPT-3.5 Turbo
- GPT-3.5 Turbo 16k

### 4. Using LangChain

LangChain provides a framework for building applications with LLMs.

**Setup:**
1. Install required packages:
```bash
npm install @langchain/core @langchain/openai
```

2. Configure API key (typically an OpenAI API key):
```typescript
const config = {
  platform: 'langchain',
  apiKey: 'sk-xxxxxxxxxxxxxx',
  model: 'gpt-4',
};
```

**Advanced Usage:**
LangChain allows you to:
- Chain multiple prompts together
- Add memory to conversations
- Use vector databases for RAG
- Integrate with external tools

### 5. Custom Provider

You can implement your own AI provider by extending the `AIProvider` interface.

```typescript
import { AIProvider, AIConfig, GenerateOutlineOptions, GenerateContentOptions, StreamChunk } from '@/lib/ai/types';

class CustomProvider implements AIProvider {
  async generateOutline(options: GenerateOutlineOptions, config: AIConfig) {
    // Your implementation
  }

  async generateContent(
    options: GenerateContentOptions,
    config: AIConfig,
    onChunk?: (chunk: StreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ) {
    // Your implementation
  }

  async chat(
    messages: { role: string; content: string }[],
    config: AIConfig,
    onChunk?: (chunk: StreamChunk) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ) {
    // Your implementation
  }
}
```

Then register it in the factory:
```typescript
// lib/ai/provider-factory.ts
export function createAIProvider(platform: AIPlatform): AIProvider {
  switch (platform) {
    case 'custom':
      return new CustomProvider();
    // ... other cases
  }
}
```

## API Usage

### Generate Outline

```typescript
import { createAIProvider } from '@/lib/ai/provider-factory';

const provider = createAIProvider('dify');

const outline = await provider.generateOutline({
  prompt: 'Write a document about AI development',
  maxSections: 10,
  depth: 2,
}, config);
```

### Generate Content

```typescript
await provider.generateContent({
  sectionTitle: 'Introduction',
  documentTopic: 'AI Development',
  fullOutline: '1. Introduction\n2. Background\n...',
}, config,
  (chunk) => {
    console.log('Received:', chunk.text);
  },
  () => {
    console.log('Complete!');
  },
  (error) => {
    console.error('Error:', error);
  }
);
```

### Chat

```typescript
await provider.chat([
  { role: 'user', content: 'Hello!' }
], config,
  (chunk) => {
    console.log('Received:', chunk.text);
  },
  () => {
    console.log('Complete!');
  },
  (error) => {
    console.error('Error:', error);
  }
);
```

## Comparison

| Feature | Dify | OpenAI | LangChain |
|---------|-------|--------|-----------|
| Ease of Setup | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Customization | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Streaming | ✅ | ✅ | ✅ |
| Free Tier | ✅ | ❌ | ❌* |
| Self-Hosted | ✅ | ❌ | ✅ |
| Workflow Support | ✅ | ❌ | ✅ |

*Depends on underlying LLM provider

## Switching Platforms

You can switch between platforms at runtime through the settings panel or programmatically:

```typescript
import { useStore } from '@/store/useStore';

const { setAIPlatform, setApiKey, ... } = useStore();

// Switch to OpenAI
setAIPlatform('openai');
setApiKey('sk-xxxxxxxxxxxxxx');
```

## Troubleshooting

### Dify Connection Issues

- Verify the API URL is correct
- Check that the API key is valid
- Ensure the Dify server is accessible

### OpenAI Rate Limits

OpenAI has rate limits. If you encounter errors:
- Reduce the number of concurrent requests
- Implement exponential backoff
- Consider upgrading your plan

### LangChain Version Compatibility

Make sure you're using compatible versions of LangChain packages:
```bash
npm list @langchain/core @langchain/openai
```

## Contributing

To add support for a new AI platform:

1. Create a new provider file in `lib/ai/`
2. Implement the `AIProvider` interface
3. Add the platform to `AIPlatform` type
4. Update `createAIProvider` factory function
5. Update environment variables and documentation
6. Submit a pull request!

## Resources

- [Dify Documentation](https://docs.dify.ai/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [LangChain Documentation](https://js.langchain.com/)
