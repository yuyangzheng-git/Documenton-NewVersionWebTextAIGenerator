/**
 * Unified AI Platform API Route
 * Supports multiple AI platforms: Dify, OpenAI, LangChain
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAIProvider } from '@/lib/ai/provider-factory';
import { AIPlatform, AIConfig } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      platform = 'dify',
      action,
      apiKey,
      ...rest
    } = body;

    const config: AIConfig = {
      platform: platform as AIPlatform,
      apiKey,
      baseUrl: body.baseUrl,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    };

    const provider = createAIProvider(platform as AIPlatform);

    switch (action) {
      case 'generateOutline':
        const outline = await provider.generateOutline(rest, config);
        return NextResponse.json({ outline });

      case 'generateContent':
        await provider.generateContent(
          rest,
          config,
          () => {},
          () => {},
          () => {}
        );
        return NextResponse.json({ success: true });

      case 'chat':
        await provider.chat(
          rest.messages || [],
          config,
          () => {},
          () => {},
          () => {}
        );
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
