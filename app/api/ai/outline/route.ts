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
    let matchedField = '';

    if (outputs) {
      // 优先检查常见字段（根据实际Dify配置调整顺序）
      const possibleFields = [
        'outline',        // 最常见的标准字段名
        'text',           // Dify默认文本输出
        'output',         // 通用输出字段
        'result',         // 结果字段
        'Construction',   // 历史配置字段
        'Constructure',   // 拼写变体
        'data',           // 数据字段
        'content',        // 内容字段
        'answer',         // 问答字段
        'response'        // 响应字段
      ];

      for (const field of possibleFields) {
        if (outputs[field]) {
          outputText = String(outputs[field]);
          matchedField = field;
          console.log(`[Dify Outline] Found field '${field}':`, outputText.substring(0, 200));
          break;
        }
      }

      if (!matchedField) {
        console.warn('[Dify Outline] No matching field found in outputs. Available fields:', Object.keys(outputs));
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

    // 验证outline结构并记录日志
    if (!Array.isArray(outline)) {
      return NextResponse.json(
        { error: 'Parsed outline is not an array', debug: { outline } },
        { status: 500 }
      );
    }

    console.log(`[Dify Outline] Successfully parsed ${outline.length} items`);

    // 记录每个项目的基本信息用于调试
    outline.forEach((item, idx) => {
      console.log(`  [${idx}] id=${item.id}, level=${item.level}, title="${item.title?.substring(0, 50)}"`);

      // 检测潜在问题
      if (!item.id) {
        console.warn(`    ⚠️  Missing id for item at index ${idx}`);
      }
      if (![1, 2, 3].includes(item.level)) {
        console.warn(`    ⚠️  Invalid level ${item.level} for item ${item.id}`);
      }
    });

    // 检测重复ID
    const ids = outline.map(item => item.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.warn('[Dify Outline] Duplicate IDs detected:', duplicateIds);
    }

    return NextResponse.json({ outline });
  } catch (error) {
    console.error('[Dify Outline] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
