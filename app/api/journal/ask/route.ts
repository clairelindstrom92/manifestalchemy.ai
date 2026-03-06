import { NextRequest, NextResponse } from "next/server";
import { chatComplete } from "@/lib/ai/router";
import { queryChunks } from "@/lib/rag/embed";

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      manifestationId,
      question,
      manifestationTitle,
      manifestationSummary,
    } = await request.json();

    if (!userId || !question?.trim()) {
      return NextResponse.json(
        { error: "userId and question required" },
        { status: 400 }
      );
    }

    // Retrieve relevant memories from this user's journal + chat history
    const chunks = await queryChunks({
      userId,
      query: question,
      matchCount: 8,
      minSimilarity: 0.6,
    });

    const memoryContext = chunks.length
      ? chunks.map((c, i) => `[Memory ${i + 1}] (${c.source_type}): ${c.content}`).join("\n\n")
      : "No specific memories found yet — answer based on the manifestation description.";

    const systemPrompt = `You are Manifest Alchemy AI — a mystical yet precise manifestation coach.
The user is asking about their manifestation journey.

Manifestation: "${manifestationTitle ?? "Untitled"}"
Summary: "${manifestationSummary ?? "No summary yet."}"

Here are the user's relevant memories from their journal and past conversations:
---
${memoryContext}
---

Answer the user's question with wisdom, specificity, and encouragement. Reference their actual memories where relevant. Be concise (2-4 sentences unless detail is needed). Stay in the mystical-yet-methodical voice.`;

    const answer = await chatComplete(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      { temperature: 0.6 }
    );

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("journal/ask error:", err);
    return NextResponse.json({ error: "Failed to get AI answer" }, { status: 500 });
  }
}
