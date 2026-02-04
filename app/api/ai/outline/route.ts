import { NextRequest, NextResponse } from 'next/server';

/**
 * 大纲生成 API (后端代理)
 * 保护 API Key 不暴露给前端
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, style } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Missing topic parameter' },
        { status: 400 }
      );
    }

    // 从环境变量获取 API 配置
    const apiKey = process.env.NEXT_PUBLIC_DIFY_OUTLINE_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'http://localhost:8000/v1';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Dify API key not configured on server' },
        { status: 500 }
      );
    }

    // 调用 Dify Workflow API
    const response = await fetch(`${baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          topic,
          style: style || '专业严肃',
        },
        response_mode: 'blocking',
        user: 'web-user-' + Date.now(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Dify API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    // 调试：打印完整响应结构
    console.log('[Dify Outline] Full response:', JSON.stringify(result, null, 2));

    // 尝试从 outputs 中提取文本
    const outputs = result.data?.outputs;
    let outputText = '';

    if (outputs) {
      // 尝试所有可能的字段名
      const possibleFields = [
        'text', 'output', 'result', 'Construction', 'Constructure',
        'outline', 'data', 'content', 'answer', 'response'
      ];

      for (const field of possibleFields) {
        if (outputs[field]) {
          outputText = String(outputs[field]);
          console.log(`[Dify Outline] Found field '${field}':`, outputText.substring(0, 200));
          break;
        }
      }
    }

    // 如果 outputs 没有字段，尝试从整个 result 中找 JSON
    if (!outputText) {
      const resultStr = JSON.stringify(result);
      // 查找 JSON 数组模式
      const jsonMatch = resultStr.match(/\[\s*\{[^}]+\}\s*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('[Dify Outline] Found inline JSON array');
            return NextResponse.json({ outline: parsed });
          }
        } catch {
          // 不是有效的 JSON
        }
      }
    }

    // 如果还是没有，尝试直接返回 result.data 作为 outline
    if (Array.isArray(result.data)) {
      console.log('[Dify Outline] Using result.data as outline array');
      return NextResponse.json({ outline: result.data });
    }

    // 如果 result.data.outputs 是数组
    if (Array.isArray(result.data?.outputs)) {
      console.log('[Dify Outline] Using result.data.outputs as outline array');
      return NextResponse.json({ outline: result.data.outputs });
    }

    // 如果还是没有有效输出，返回详细错误信息
    if (!outputText) {
      return NextResponse.json(
        { error: 'Dify API returned empty output', debug: { result } },
        { status: 500 }
      );
    }

    // 提取 JSON 数组
    const jsonMatch = outputText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse outline from Dify response', debug: { outputText } },
        { status: 500 }
      );
    }

    const outline = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ outline });
  } catch (error) {
    console.error('[Dify Outline] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
