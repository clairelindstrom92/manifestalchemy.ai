/**
 * /api/profile/avatar
 * GET  — fetch current user's profile (avatar_url, display_name)
 * POST — upload a new avatar image
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/supabase/auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url, display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'file required' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 415 });
  }

  const supabase = getSupabase();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const storagePath = `${user.id}/avatar.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  await supabase
    .from('profiles')
    .upsert({ id: user.id, avatar_url: avatarUrl, updated_at: new Date().toISOString() });

  return NextResponse.json({ avatarUrl });
}
