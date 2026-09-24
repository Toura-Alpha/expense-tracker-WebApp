import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    // Authenticated API route pattern: verify session before executing
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to use this service.' },
        { status: 401 }
      );
    }

    const ai = getAIClient();
    if (!ai) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in environment variables' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Parse the following natural language transaction entry into structured JSON.
Extract:
- description (string)
- amount (number, positive)
- type ("expense" or "income")
- category (string, e.g., "Food & Dining", "Groceries", "Transportation", "Utilities", "Salary", "Entertainment", "Healthcare", "Shopping", "Other")
- date (ISO date string YYYY-MM-DD or today's date if unspecified)

Input: "${input}"`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return NextResponse.json({ success: true, data: parsed, user_id: user.id });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Failed to parse transaction via Gemini API:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to parse natural language transaction' },
      { status: 500 }
    );
  }
}
