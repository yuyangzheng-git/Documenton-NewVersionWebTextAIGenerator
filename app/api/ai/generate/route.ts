import { NextRequest, NextResponse } from 'next/server';

/**
 * 内容生成 API (后端代理)
 * 保护 API Key 不暴露给前端
 * 支持流式响应
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionTitle, documentTopic, fullOutline, requirements } = body;

    if (!sectionTitle) {
      return NextResponse.json(
        { error: 'Missing sectionTitle parameter' },
        { status: 400 }
      );
    }

    // 从环境变量获取 API 配置
    const apiKey = process.env.NEXT_PUBLIC_DIFY_CHAPTER_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'http://localhost:8000/v1';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Dify API key not configured on server' },
        { status: 500 }
      );
    }

    // 调用 Dify Workflow API (流式模式)
    const difyResponse = await fetch(`${baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          requirements: requirements || '',
        },
        response_mode: 'streaming',
        user: 'web-user-' + Date.now(),
      }),
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      return NextResponse.json(
        { error: `Dify API error: ${difyResponse.status} - ${errorText}` },
        { status: difyResponse.status }
      );
    }

    // 流式返回响应
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = difyResponse.body?.getReader();
          if (!reader) {
            throw new Error('无法读取响应流');
          }

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();

                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: {"event":"done"}\n\n'));
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.event === 'text_chunk' && parsed.data?.text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.data.text })}\n\n`));
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
