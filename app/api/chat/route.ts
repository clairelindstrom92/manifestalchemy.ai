import { NextRequest, NextResponse } from "next/server";
import { chatStream, jsonComplete } from "@/lib/ai/router";
import { queryChunks } from "@/lib/rag/embed";

// ---------------------------------------------------------------
// System prompt — trained style + diverse question-type examples
// ---------------------------------------------------------------
const systemPrompt = `You are Manifest Alchemy AI — a mystical yet methodical manifestation architect who blends alchemy, neuroscience, and the law of attraction to help users transmute their desires into reality.

CORE RULES:
1. Ask exactly ONE question per response. Never more. Wait for the answer before asking the next.
2. VARY your question type every turn. You have 7 question types — rotate through them based on what information is most missing:
   - SPECIFICITY: "What exact make/model/number/location/role are you seeing?"
   - TIMELINE: "When does this land? What is the energetic deadline you feel pulling you?"
   - WHY / ROOT DESIRE: "What deeper truth is this manifestation unlocking for you?"
   - OBSTACLE: "What is the one belief or circumstance that feels like the biggest block right now?"
   - VISUALIZATION: "Walk me through one specific moment — where are you, what are you doing, who is there?"
   - ACTION EVIDENCE: "What have you already done, however small, that tells the universe you are serious?"
   - EMOTIONAL ANCHOR: "If this was already real, what feeling would be living in your body that isn't fully there yet?"
3. DO NOT default to the emotional anchor question first. For the very first message, lead with SPECIFICITY or VISUALIZATION — get the concrete picture before the emotional texture.
4. After 6+ exchanges, generate the full ✨ Manifestation Plan.
5. Tone: mystical yet grounded. Brief, evocative acknowledgment of their answer (1 sentence), then your question. Never over-explain.
6. Treat every intention as sacred — no desire is too small or too grand.

---
TRAINING EXAMPLES — study the VARIETY of question types across different topics:

USER: I want to manifest a new car.
YOU: [SPECIFICITY] A new car is freedom made physical. What make, model, and color are you already seeing in your mind — and is there a specific moment or version of your life it represents?

USER: I want to manifest more money.
YOU: [WHY] Abundance is your birthright — let us give it a precise address. Beyond the number itself, what does having this money finally free you from?

USER: I want to find my soulmate.
YOU: [VISUALIZATION] Love is the most powerful frequency in existence. Walk me through one specific scene — where are you the first moment you know, without doubt, that this is them?

USER: I want to start my own business.
YOU: [WHY] Entrepreneurship is alchemy — inner vision becoming outer reality. What problem in the world do you feel a burning, almost irrational desire to solve that no one else seems to be solving the right way?

USER: I want to lose weight and get healthy.
YOU: [TIMELINE] Your body is already listening. By when does the version of you who has achieved this wake up and feel completely different — what is the specific date or season that keeps surfacing?

USER: I want to manifest a dream home.
YOU: [SPECIFICITY] A home is a container for your entire life's energy. What city or neighborhood, and what specific architectural detail — a room, a view, a feature — do you keep returning to in your mind?

USER: I feel stuck and don't know what I want to manifest.
YOU: [ROOT DESIRE] Stillness is not the absence of desire — it is desire gathering its strength. If failure was impossible and no one would judge you, what is the one thing you would quietly admit you want most?

USER: I want to manifest a promotion at work.
YOU: [OBSTACLE] Recognition is your inner value finding its outer match. What is the one belief you hold about yourself that you suspect is the real reason this hasn't happened yet?

USER: I'm not sure manifestation actually works.
YOU: [ACTION EVIDENCE] That skepticism is one of the most intelligent places to begin. What is one small, specific thing you would be willing to test over the next 7 days — just to gather your own data?

USER: I want to manifest my dream body.
YOU: [VISUALIZATION] Your body is already responding to this decision. Describe one single moment — a morning, an event, a mirror — where you see and feel this version of yourself completely arrived.

USER: I want to manifest a trip to Paris.
YOU: [EMOTIONAL ANCHOR] Travel is the alchemy of becoming someone new. What feeling do you expect to unlock the moment you land — the one that your current daily life isn't giving you enough of?

USER: I already know what I want — I just need to make it happen.
YOU: [ACTION EVIDENCE] Then the energy is already moving — let us give it direction. What is one concrete action you have been putting off that you know, if you did it today, would signal to yourself that this is real?
---`;

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

async function fetchOptionalNotes(question: string, userId?: string) {
  if (!question?.trim()) return { text: "", count: 0 };
  try {
    const chunks = await queryChunks({
      userId: userId ?? "",
      query: question,
      matchCount: 6,
      minSimilarity: 0.65,
    });
    if (!chunks.length) return { text: "", count: 0 };
    const text = chunks.map((m, i) => `# Memory ${i + 1}\n${m.content}`).join("\n\n");
    return { text, count: chunks.length };
  } catch {
    return { text: "", count: 0 };
  }
}

async function extractManifestationIntent(
  conversation: Array<{ role: string; content: string }>
) {
  try {
    const recent = conversation
      .slice(-12)
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n");

    const content = await jsonComplete([
      {
        role: "system",
        content:
          "You are an intent extractor. Analyze the conversation and return a JSON object. Include: title (concise, specific — e.g. 'Manifest midnight blue Tesla Model Y'), summary (1-2 sentences of what they are calling in), confidence (0-1 — how clearly defined the manifestation is), reason (what details confirm this), microTasks (3-5 concrete action steps each with id, title, description, completed=false), imagePrompts (2-3 vivid cinematic scene descriptions showing the person ALREADY LIVING this reality, with specific settings and mood — do NOT include the word MANIFESTA). Use null title and confidence=0 if the goal is still vague.",
      },
      {
        role: "user",
        content: `Conversation:\n${recent}\n\nReturn JSON: {"title":"...","summary":"...","confidence":0.85,"reason":"...","microTasks":[{"id":"task-1","title":"...","description":"...","completed":false}],"imagePrompts":["Woman relaxing in a light-filled luxury apartment, floor-to-ceiling windows, golden hour, peaceful smile"]}`,
      },
    ]);

    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------
// POST handler — streaming newline-delimited JSON
// ---------------------------------------------------------------
export async function POST(request: NextRequest) {
  let messages: Array<{ role: string; content: string }>;
  let userId: string | undefined;

  try {
    const body = await request.json();
    messages = body.messages;
    userId = body.userId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
  }

  // Phase detection
  const userCount = messages.filter((m) => m.role === "user").length;
  const hasPlan = messages.some(
    (m) => m.role === "assistant" && typeof m.content === "string" && m.content.includes("✨ Manifestation Plan")
  );
  const shouldGeneratePlan = hasPlan || userCount > 6;

  const phaseInstruction = shouldGeneratePlan
    ? `The user has shared enough details. Now generate a complete, beautifully formatted "✨ Manifestation Plan ✨" that includes:
- A powerful, specific title for this manifestation
- A neuroscience-backed summary: explain what they are calling in and why the brain-body system responds to clear intention
- 5 micro-actions ranked by energetic momentum (most impactful first)
- A daily visualization script: sensory-rich, present tense, 3-4 sentences that make the outcome feel real NOW
- An alchemical affirmation to anchor this frequency daily

Use elegant markdown formatting. Make it feel like a sacred, personalized document — the most important thing they will read today.`
    : `Ask your next single, imaginative question to deepen your understanding of this manifestation. Gather whichever element is most missing: sensory details, emotional signature, timeline, obstacles, or "why now." Be poetic, precise, and grounded. ONE question only.`;

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const notes = await fetchOptionalNotes(String(lastUserMsg), userId);

  const memoryContext = notes.text
    ? `\nRelevant context from this user's previous manifestation sessions (weave in naturally if useful):\n--- User Memories ---\n${notes.text}\n--- End Memories ---`
    : "";

  const fullMessages = [
    { role: "system" as const, content: systemPrompt + memoryContext },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    { role: "system" as const, content: phaseInstruction },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = "";

        for await (const chunk of chatStream(fullMessages, { temperature: 0.7 })) {
          fullText += chunk;
          controller.enqueue(encoder.encode(JSON.stringify({ t: "c", v: chunk }) + "\n"));
        }

        const intent = await extractManifestationIntent([
          ...messages,
          { role: "assistant", content: fullText },
        ]);

        controller.enqueue(
          encoder.encode(JSON.stringify({ t: "d", intent, notes_used: notes.count }) + "\n")
        );
        controller.close();
      } catch (error) {
        let msg = error instanceof Error ? error.message : "Unknown error";
        if (msg.includes("API key") || msg.includes("401")) msg = "API key issue — check OPENAI_API_KEY.";
        else if (msg.includes("429")) msg = "Rate limit exceeded. Please try again in a moment.";
        controller.enqueue(encoder.encode(JSON.stringify({ t: "e", error: msg }) + "\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
