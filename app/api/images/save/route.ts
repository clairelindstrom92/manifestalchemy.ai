/**
 * /api/images/save
 * POST — heart/save a generated image (adds to saved_images for training flywheel)
 * DELETE — unsave (remove heart)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/supabase/auth';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { manifestationId, sourceUrl, prompt } = await request.json();
  if (!manifestationId || !sourceUrl) {
    return NextResponse.json({ error: 'manifestationId, sourceUrl required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('saved_images')
    .insert({ user_id: user.id, manifestation_id: manifestationId, source_url: sourceUrl, prompt })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: data });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sourceUrl } = await request.json();
  if (!sourceUrl) {
    return NextResponse.json({ error: 'sourceUrl required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('saved_images')
    .delete()
    .eq('user_id', user.id)
    .eq('source_url', sourceUrl);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
