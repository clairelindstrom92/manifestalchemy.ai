import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { upsertChunk, deleteChunk } from "@/lib/rag/embed";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/journal?manifestation_id=xxx&user_id=xxx
export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const manifestationId = searchParams.get("manifestation_id");
  const userId = searchParams.get("user_id");

  if (!manifestationId || !userId) {
    return NextResponse.json(
      { error: "manifestation_id and user_id required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("manifestation_id", manifestationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}

// POST /api/journal — create a new entry
export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  try {
    const { userId, manifestationId, content, mood } = await request.json();

    if (!userId || !manifestationId || !content?.trim()) {
      return NextResponse.json(
        { error: "userId, manifestationId, content required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: userId,
        manifestation_id: manifestationId,
        content: content.trim(),
        mood: mood || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fire-and-forget: embed this entry for RAG
    upsertChunk({
      userId,
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

// DELETE /api/journal?id=xxx&user_id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const userId = searchParams.get("user_id");

  if (!id || !userId) {
    return NextResponse.json({ error: "id and user_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Clean up the embedding too
  deleteChunk({ userId, sourceId: id, sourceType: "journal" }).catch(() => {});

  return NextResponse.json({ ok: true });
}
