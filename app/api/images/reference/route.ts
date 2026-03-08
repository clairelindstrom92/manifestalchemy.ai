/**
 * /api/images/reference
 * GET  ?manifestationId=  — list reference images for a manifestation
 * POST — upload a reference image (stored in Supabase, used by FLUX at generation)
 * DELETE — remove a reference image
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

  const { searchParams } = new URL(request.url);
  const manifestationId = searchParams.get('manifestationId');

  const supabase = getSupabase();
  let query = supabase
    .from('reference_images')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (manifestationId) query = query.eq('manifestation_id', manifestationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const manifestationId = formData.get('manifestationId') as string | null;
  const label = formData.get('label') as string | null;
  const isProfilePicture = formData.get('isProfilePicture') === 'true';

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
  const storagePath = `${user.id}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('reference-images')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('reference-images').getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from('reference_images')
    .insert({
      user_id: user.id,
      manifestation_id: manifestationId || null,
      storage_path: storagePath,
      source_url: urlData.publicUrl,
      label: label || null,
      is_profile_picture: isProfilePicture,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isProfilePicture) {
    await supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() });
  }

  return NextResponse.json({ image: data });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { imageId, storagePath } = await request.json();
  if (!imageId) {
    return NextResponse.json({ error: 'imageId required' }, { status: 400 });
  }

  const supabase = getSupabase();

  if (storagePath) {
    await supabase.storage.from('reference-images').remove([storagePath]);
  }

  const { error } = await supabase
    .from('reference_images')
    .delete()
    .eq('id', imageId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
