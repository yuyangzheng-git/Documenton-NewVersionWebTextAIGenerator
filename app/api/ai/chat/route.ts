import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, appKey } = body;

    console.log('=== AI Chat Debug ===');
    console.log('Message:', message);
    console.log('App Key:', appKey ? appKey.substring(0, 10) + '...' : '(empty)');
    console.log('API URL:', process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'http://your-dify-instance/v1');
    console.log('=====================');

    const requestBody = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
      conversation_id: '',
      user: 'web-user',
    };

    // 如果Dify应用配置了userinput参数，添加到inputs
    requestBody.inputs = {
      'userinput.query': message,
      'userinput.files': [],
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // 调用 Dify API (流式响应)
    const difyResponse = await fetch(`${process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'http://your-dify-instance/v1'}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      console.error('Dify API error:', difyResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI 服务请求失败' }), {
        status: difyResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 创建可读流
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = difyResponse.body?.getReader();
          if (!reader) {
            throw new Error('无法读取响应流');
          }

          const buffer = new Uint8Array();
          let accumulatedContent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  try {
                    const parsed = JSON.parse(data);
                    const answer = parsed.answer;
                    if (answer) {
                      accumulatedContent += answer;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: answer, fullContent: accumulatedContent })}\n\n`));
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
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
    console.error('AI chat API error:', error);
    return new Response(JSON.stringify({ error: '服务器内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
