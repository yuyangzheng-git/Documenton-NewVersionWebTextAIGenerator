import { NextRequest, NextResponse } from 'next/server';
import { saveTemplate } from '@/lib/template-storage';
import { extractTemplatePlaceholders } from '@/lib/template-parser';

/**
 * 上传自定义模板到本地存储
 * 不依赖外部 API,完全本地化实现
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('template') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No template file provided' },
        { status: 400 }
      );
    }

    // 检查是否为 Word 文档
    if (!file.name.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Template must be a .docx file' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 提取模板占位符
    const placeholders = extractTemplatePlaceholders(buffer);

    // 保存到本地存储
    const savedTemplate = await saveTemplate(buffer, file.name);

    // 返回模板信息
    return NextResponse.json({
      success: true,
      templateId: savedTemplate.id,
      templateName: savedTemplate.name,
      originalName: file.name,
      fileSize: savedTemplate.fileSize,
      placeholders,
      message: 'Template uploaded successfully to local storage',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
