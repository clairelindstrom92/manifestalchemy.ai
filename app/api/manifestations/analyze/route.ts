import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jsonComplete } from "@/lib/ai/router";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabaseServerClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseServiceKey);
  } catch {
    return null;
  }
};

const normalizeTasks = (tasks: any[]) =>
  Array.isArray(tasks)
    ? tasks.map((task, index) => ({
        id: task.id || `task-${Date.now()}-${index}`,
        title: task.title || `Task ${index + 1}`,
        description: task.description || "",
        completed: Boolean(task.completed),
      }))
    : [];

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Server not configured for analysis" },
      { status: 500 }
    );
  }

  try {
    const { manifestationId, messages } = await request.json();

    if (!manifestationId) {
      return NextResponse.json(
        { error: "manifestationId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const trimmed = messages
      .slice(-50)
      .map(
        (msg: { role: string; content: string }) =>
          `${msg.role.toUpperCase()}: ${msg.content}`
      )
      .join("\n");

    const content = await jsonComplete(
      [
        {
          role: "system",
          content:
            "You are a manifestation strategist. Given a chat transcript, return JSON with summary, microTasks (3-5), and inspirationPrompts (2-3 image prompts). Micro tasks must include id, title, optional description, completed flag. Keep summary under 100 words.",
        },
        {
          role: "user",
          content: `Transcript:\n${trimmed}\n\nRespond with JSON like {"summary":"...","microTasks":[{"id":"task-1","title":"Research financing","description":"Compare credit unions","completed":false}],"inspirationPrompts":["Hyperreal photo ..."]}`,
        },
      ],
      { temperature: 0.25 }
    );

    if (!content) {
      throw new Error("No content returned from AI");
    }

    const parsed = JSON.parse(content);
    const summary: string | null = parsed.summary || null;
    const microTasks = normalizeTasks(parsed.microTasks || []);
    const inspirationPrompts: string[] = Array.isArray(parsed.inspirationPrompts)
      ? parsed.inspirationPrompts
      : [];

    const { data: existing } = await supabase
      .from("manifestations")
      .select("intent")
      .eq("id", manifestationId)
      .maybeSingle();

    const mergedIntent = {
      ...(existing?.intent || {}),
      summary: summary || existing?.intent?.summary || null,
      microTasks,
      inspirationPrompts,
    };

    await supabase
      .from("manifestations")
      .update({
        summary: summary || existing?.intent?.summary || null,
        intent: mergedIntent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", manifestationId);

    return NextResponse.json({
      summary: summary || existing?.intent?.summary || null,
      microTasks,
      inspirationPrompts,
    });
  } catch (error) {
    console.error("Manifestation analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze manifestation" },
      { status: 500 }
    );
  }
}

