/**
 * /api/images/reference
 * GET  ?userId=&manifestationId=  — list reference images for a manifestation
 * POST — upload a reference image (stored in Supabase, used by FLUX at generation)
 * DELETE — remove a reference image
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const manifestationId = searchParams.get('manifestationId');

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const supabase = getSupabase();
  let query = supabase
    .from('reference_images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (manifestationId) query = query.eq('manifestation_id', manifestationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const userId = formData.get('userId') as string;
  const manifestationId = formData.get('manifestationId') as string | null;
  const label = formData.get('label') as string | null;
  const isProfilePicture = formData.get('isProfilePicture') === 'true';

  if (!file || !userId) {
    return NextResponse.json({ error: 'file and userId required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${userId}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('reference-images')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('reference-images').getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from('reference_images')
    .insert({
      user_id: userId,
      manifestation_id: manifestationId || null,
      storage_path: storagePath,
      source_url: urlData.publicUrl,
      label: label || null,
      is_profile_picture: isProfilePicture,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If this is marked as profile picture, also update profiles table
  if (isProfilePicture) {
    await supabase
      .from('profiles')
      .upsert({ id: userId, avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() });
  }

  return NextResponse.json({ image: data });
}

export async function DELETE(request: NextRequest) {
  const { userId, imageId, storagePath } = await request.json();
  if (!userId || !imageId) {
    return NextResponse.json({ error: 'userId and imageId required' }, { status: 400 });
  }

  const supabase = getSupabase();

  if (storagePath) {
    await supabase.storage.from('reference-images').remove([storagePath]);
  }

  const { error } = await supabase
    .from('reference_images')
    .delete()
    .eq('id', imageId)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
