import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { upsertChunk, deleteChunk } from "@/lib/rag/embed";
import { getAuthUser } from "@/lib/supabase/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/journal?manifestation_id=xxx
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const manifestationId = searchParams.get("manifestation_id");

  if (!manifestationId) {
    return NextResponse.json({ error: "manifestation_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("manifestation_id", manifestationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}

// POST /api/journal — create a new entry
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  try {
    const { manifestationId, content, mood } = await request.json();

    if (!manifestationId || !content?.trim()) {
      return NextResponse.json(
        { error: "manifestationId, content required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        manifestation_id: manifestationId,
        content: content.trim(),
        mood: mood || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    upsertChunk({
      userId: user.id,
      sourceType: "journal",
      sourceId: data.id,
      content: content.trim(),
      metadata: { manifestation_id: manifestationId, mood: mood || null },
    }).catch(() => {});

    return NextResponse.json({ entry: data });
  } catch (err) {
    console.error("journal POST error:", err);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}

// DELETE /api/journal?id=xxx
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  deleteChunk({ userId: user.id, sourceId: id, sourceType: "journal" }).catch(() => {});

  return NextResponse.json({ ok: true });
}
