import { NextRequest, NextResponse } from 'next/server';
import { upsertChunk } from '@/lib/rag/embed';

export async function POST(request: NextRequest) {
  try {
    const { userId, sourceType, sourceId, content, metadata } = await request.json();

    if (!userId || !sourceType || !sourceId || !content) {
      return NextResponse.json({ error: 'userId, sourceType, sourceId, content required' }, { status: 400 });
    }

    await upsertChunk({ userId, sourceType, sourceId, content, metadata });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('embed route error:', err);
    return NextResponse.json({ error: 'Failed to embed' }, { status: 500 });
  }
}
