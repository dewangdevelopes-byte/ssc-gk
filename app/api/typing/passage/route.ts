import { NextResponse } from 'next/server';
import { getRandomTypingPassage } from '@/lib/typingContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const passage = await getRandomTypingPassage();
    return NextResponse.json(passage, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (err) {
    console.error('Failed to get typing passage:', err);
    return NextResponse.json(
      { error: 'Failed to generate typing passage' },
      { status: 500 }
    );
  }
}
