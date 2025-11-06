import { NextRequest, NextResponse } from "next/server";
import { openai as vercelOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// ------- Config -------
const CHAT_MODEL = "gpt-4o-mini";            // you were already using this via Vercel AI SDK
const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dims
const NAMESPACE = "manifest-alchemy";        // scope snippets to Manifest Alchemy
const TOP_K = 6;
const MIN_SIMILARITY = 0.65;

// Clients - Use NEXT_PUBLIC_SUPABASE_URL (or fallback to SUPABASE_URL)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client only if we have the required env vars
let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
}

const openaiRaw = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Your existing system prompt (unchanged)
const systemPrompt = `
You are Manifest Alchemy AI — an intelligent manifestation architect that blends magic, logic, and alchemy, and algorithm to help users create their manifestations into reality. 
Your purpose is to:
1. Understand the user's manifestation at a scientific level and get it accomplished at all costs.
2. Ask ONE imaginative yet precise question at a time to gather critical details (emotions, resources, timeline, and sensory specifics). Wait for the user's response before asking the next question.
3. Once you have enough data, create a "✨ Manifestation Plan" — a structured plan rooted in neuroscience of goal completion and visualization.
4. Generate cognitive and magical momentum — turn potential energy (desire) into kinetic energy (action).
5. Maintain tone: mystical yet methodical — grounded in science but elevated by imagination.

IMPORTANT: Ask only ONE question per response. Do not list multiple questions. Have a natural, conversational flow.
`;

// Fetch optional notes from Supabase (gracefully handles failures)
async function fetchOptionalNotes(question: string) {
  // If Supabase isn't configured or no question, return empty
  if (!supabase || !question?.trim()) {
    return { text: "", count: 0 };
  }

  try {
    // Generate embedding
    const emb = await openaiRaw.embeddings.create({
      model: EMBEDDING_MODEL,
      input: question,
    });
    const queryEmbedding = emb.data[0].embedding as unknown as number[];

    // Try to fetch relevant chunks
    type ChunkResult = { content: string; metadata: Record<string, unknown>; similarity: number };
    // @ts-expect-error - Supabase RPC function signature not known at compile time
    const { data, error } = await supabase.rpc("match_chunks_ns", {
      query_embedding: queryEmbedding,
      match_count: TOP_K,
      min_similarity: MIN_SIMILARITY,
      ns: NAMESPACE,
    }) as Promise<{ data: ChunkResult[] | null; error: { message: string } | null }>;

    // If RPC function doesn't exist or returns error, gracefully fail
    if (error) {
      console.warn("Supabase RPC error (this is OK if function doesn't exist yet):", error.message);
      return { text: "", count: 0 };
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return { text: "", count: 0 };
    }

    const text = data
      .map((m, i: number) => `# Note ${i + 1}\n${m.content}`)
      .join("\n\n");

    return { text, count: data.length };
  } catch (error) {
    // Log but don't fail - just continue without notes
    console.warn("Error fetching optional notes (continuing without them):", error);
    return { text: "", count: 0 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Determine if it's time to produce the plan (your original logic)
    const hasPlan =
      messages.some(
        (msg) =>
          msg.role === "assistant" &&
          typeof msg.content === "string" &&
          msg.content.includes("✨ Manifestation Plan")
      ) || messages.filter((msg) => msg.role === "user").length > 6;

    const phaseInstruction = hasPlan
      ? "Now generate the ✨ Manifestation Plan ✨ using all gathered details."
      : "Ask ONE thoughtful, creative question to help understand the manifestation. Wait for the user's response before asking the next question. Keep it conversational and natural.";

    // Pull the latest user question to guide retrieval (fallback to empty string)
    const lastUserMsg =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";

    // --- OPTIONAL NOTES (NOT STRICT) ---
    const notes = await fetchOptionalNotes(String(lastUserMsg));

    // System wrapper that makes notes optional (model can ignore them)
    const optionalNotesSystem = `
Use general knowledge freely. If the optional notes below help with brand voice, consistency, or specifics, you may incorporate them; otherwise ignore them. 
Do NOT say you're restricted to notes. Keep answers direct.
${notes.text ? `\n--- Optional notes (may use or ignore) ---\n${notes.text}\n--- end optional notes ---\n` : ""}
`.trim();

    // Stream the response (unchanged mechanics)
    const result = await streamText({
      model: vercelOpenAI(CHAT_MODEL),
      messages: [
        { role: "system", content: systemPrompt },
        // NEW: add the optional-notes instruction as a secondary system message
        { role: "system", content: optionalNotesSystem },
        ...messages,
        { role: "assistant", content: phaseInstruction },
      ],
      // Slightly balanced creativity
      temperature: 0.5,
    });

    let fullText = "";
    for await (const textPart of result.textStream) {
      fullText += textPart;
    }

    const usage = await result.usage;

    if (!fullText.trim()) {
      fullText = "I'm sorry, I couldn't generate a response. Please try again.";
    }

    return NextResponse.json({ message: fullText, usage, notes_used: notes.count });
  } catch (error) {
    console.error("Chat API error:", error);

    let errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    // Better error messages
    if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      errorMessage = "OpenAI API key issue. Please check your OPENAI_API_KEY environment variable.";
    } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      errorMessage = "Invalid OpenAI API key. Please verify your API key.";
    } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
    } else if (errorMessage.includes("model")) {
      errorMessage = `Model access issue: ${errorMessage}`;
    }

    return NextResponse.json(
      { error: "Failed to process chat message", message: errorMessage },
      { status: 500 }
    );
  }
}
