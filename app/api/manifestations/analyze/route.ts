import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const CHAT_MODEL = "gpt-4o-mini";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

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
  if (!supabase || !openai) {
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

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
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
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
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

