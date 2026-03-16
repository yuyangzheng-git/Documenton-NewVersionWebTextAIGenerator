import { NextRequest, NextResponse } from 'next/server';
import { saveTemplate } from '@/lib/template-storage';
import { extractTemplatePlaceholders } from '@/lib/template-parser';
import AdmZip from 'adm-zip';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

function isValidDocxFile(buffer: Buffer): boolean {
  try {
    // Check ZIP file header
    if (buffer.length < 4) return false;
    const header = buffer.readUInt32LE(0);
    if (header !== 0x04034b50) return false;  // ZIP magic number

    // Verify required DOCX files
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const requiredFiles = ['[Content_Types].xml', 'word/document.xml'];

    return requiredFiles.every(file =>
      entries.some(entry => entry.entryName === file)
    );
  } catch {
    return false;
  }
}

/**
 * Upload custom template to local storage with security validations
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

    // File size limit
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds limit (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    // MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .docx files are allowed' },
        { status: 400 }
      );
    }

    // Extension double-check
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Template must be a .docx file' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // DOCX structure validation
    if (!isValidDocxFile(buffer)) {
      return NextResponse.json(
        { error: 'Invalid DOCX file format' },
        { status: 400 }
      );
    }

    // Extract template placeholders
    const placeholders = extractTemplatePlaceholders(buffer);

    // Save to local storage
    const savedTemplate = await saveTemplate(buffer, file.name);

    // Return template info
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
    console.error('[Template Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
