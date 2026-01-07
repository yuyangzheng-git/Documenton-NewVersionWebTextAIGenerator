import { NextRequest, NextResponse } from 'next/server';

// Carbone API configuration
const CARBONE_API_URL = 'https://api.carbone.io';
const CARBONE_API_TOKEN = process.env.CARBONE_API_TOKEN || 'test_YOUR_TOKEN_HERE';

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

    // Check if Carbone API token is configured
    if (!CARBONE_API_TOKEN || CARBONE_API_TOKEN === 'test_YOUR_TOKEN_HERE') {
      return NextResponse.json(
        { 
          error: 'Carbone API token not configured',
          message: 'Please set CARBONE_API_TOKEN in environment variables'
        },
        { status: 500 }
      );
    }

    // Prepare form data for Carbone API
    const carboneFormData = new FormData();
    carboneFormData.append('template', file);

    // Upload template to Carbone API
    const response = await fetch(`${CARBONE_API_URL}/template`, {
      method: 'POST',
      headers: {
        'carbone-version': '4',
        'Authorization': `Bearer ${CARBONE_API_TOKEN}`,
      },
      body: carboneFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Carbone API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to upload template to Carbone API', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json(
        { error: 'Carbone API returned error', details: result },
        { status: 500 }
      );
    }

    // Return template ID from Carbone
    return NextResponse.json({
      success: true,
      templateId: result.data.templateId,
      templateName: file.name,
    });
  } catch (error) {
    console.error('Template upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
