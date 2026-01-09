import { NextResponse } from 'next/server';
import { listTemplates } from '@/lib/template-storage';

/**
 * 获取本地存储的所有模板列表
 */
export async function GET() {
  try {
    const templates = await listTemplates();
    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json(
      { error: 'Failed to list templates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
