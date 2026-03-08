import { NextRequest, NextResponse } from 'next/server';
import { upsertChunk } from '@/lib/rag/embed';
import { getAuthUser } from '@/lib/supabase/auth';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sourceType, sourceId, content, metadata } = await request.json();

    if (!sourceType || !sourceId || !content) {
      return NextResponse.json({ error: 'sourceType, sourceId, content required' }, { status: 400 });
    }

    await upsertChunk({ userId: user.id, sourceType, sourceId, content, metadata });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('embed route error:', err);
    return NextResponse.json({ error: 'Failed to embed' }, { status: 500 });
  }
}
