/**
 * /api/images/save
 * POST — heart/save a generated image (adds to saved_images for training flywheel)
 * DELETE — unsave (remove heart)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(request: NextRequest) {
  const { userId, manifestationId, sourceUrl, prompt } = await request.json();
  if (!userId || !manifestationId || !sourceUrl) {
    return NextResponse.json({ error: 'userId, manifestationId, sourceUrl required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('saved_images')
    .insert({ user_id: userId, manifestation_id: manifestationId, source_url: sourceUrl, prompt })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: data });
}

export async function DELETE(request: NextRequest) {
  const { userId, sourceUrl } = await request.json();
  if (!userId || !sourceUrl) {
    return NextResponse.json({ error: 'userId, sourceUrl required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('saved_images')
    .delete()
    .eq('user_id', userId)
    .eq('source_url', sourceUrl);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
