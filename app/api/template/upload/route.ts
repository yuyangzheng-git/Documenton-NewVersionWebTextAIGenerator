import { NextRequest, NextResponse } from 'next/server';

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

    // Check if it's a Word document
    if (!file.name.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Template must be a .docx file' },
        { status: 400 }
      );
    }

    // Convert file to base64 for storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Return template info
    return NextResponse.json({
      success: true,
      templateName: file.name,
      templateBase64: base64,
    });
  } catch (error) {
    console.error('Template upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload template' },
      { status: 500 }
    );
  }
}
