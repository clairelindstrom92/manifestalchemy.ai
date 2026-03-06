/**
 * /api/profile/avatar
 * GET  ?userId=  — fetch user profile (avatar_url, display_name)
 * POST — upload a new avatar image
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url, display_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const userId = formData.get('userId') as string;

  if (!file || !userId) {
    return NextResponse.json({ error: 'file and userId required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const ext = file.name.split('.').pop() ?? 'jpg';
  // Overwrite previous avatar with same path
  const storagePath = `${userId}/avatar.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  // Bust cache with timestamp
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  await supabase
    .from('profiles')
    .upsert({ id: userId, avatar_url: avatarUrl, updated_at: new Date().toISOString() });

  return NextResponse.json({ avatarUrl });
}
