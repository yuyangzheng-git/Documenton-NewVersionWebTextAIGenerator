import { NextRequest, NextResponse } from 'next/server';

const MAX_TITLE_LENGTH = 200;
const MAX_REQUIREMENTS_LENGTH = 1000;
const DANGEROUS_PATTERNS = [
  /ignore\s+(previous|all|above)\s+(instruction|prompt|rule)/i,
  /system\s*prompt/i,
  /api[_\s]?key/i,
  /<script/i,
  /javascript:/i,
];

function sanitizeUserInput(input: string, maxLength: number): string {
  let sanitized = input.slice(0, maxLength).trim();
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new Error('Input contains potentially malicious content');
    }
  }

  return sanitized;
}

/**
 * Content generation API (backend proxy)
 * Protects API Key from frontend exposure
 * Supports streaming response
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

    // Input sanitization
    let sanitizedTitle: string;
    let sanitizedRequirements: string;
    try {
      sanitizedTitle = sanitizeUserInput(sectionTitle, MAX_TITLE_LENGTH);
      sanitizedRequirements = requirements ? sanitizeUserInput(requirements, MAX_REQUIREMENTS_LENGTH) : '';
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      );
    }

    // Get API configuration from environment
    const apiKey = process.env.NEXT_PUBLIC_DIFY_CHAPTER_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'http://localhost:8000/v1';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Dify API key not configured on server' },
        { status: 500 }
      );
    }

    // Call Dify Workflow API (streaming mode) with timeout
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
    }, 120000); // 2 minute timeout

    const difyResponse = await fetch(`${baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          requirements: sanitizedRequirements,
        },
        response_mode: 'streaming',
        user: 'web-user-' + Date.now(),
      }),
      signal: abortController.signal,
    });

    if (!difyResponse.ok) {
      clearTimeout(timeout);
      const errorText = await difyResponse.text();
      return NextResponse.json(
        { error: `Dify API error: ${difyResponse.status} - ${errorText}` },
        { status: difyResponse.status }
      );
    }

    // Stream response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

        try {
          reader = difyResponse.body?.getReader();
          if (!reader) {
            throw new Error('Cannot read response stream');
          }

          let buffer = '';
          let lastActivityTime = Date.now();
          const activityTimeout = 30000; // 30 seconds inactivity timeout

          while (true) {
            // Check for activity timeout
            if (Date.now() - lastActivityTime > activityTimeout) {
              throw new Error('Stream inactive timeout');
            }

            const { done, value } = await reader.read();

            if (done) {
              clearTimeout(timeout);
              break;
            }

            lastActivityTime = Date.now();
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
                  // Ignore parse errors
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error('[Generate Stream] Error:', error);
          controller.error(error);
        } finally {
          // Ensure resource cleanup
          clearTimeout(timeout);
          if (reader) {
            try {
              await reader.cancel();
            } catch (err) {
              console.error('[Generate Stream] Failed to cancel reader:', err);
            }
          }
          abortController.abort();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[Generate API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
