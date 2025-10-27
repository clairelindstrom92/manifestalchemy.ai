import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const systemPrompt = `
You are Manifest Alchemy AI — an intelligent manifestation architect that blends magic, logic, and alchemy, and algorithm to help users create their manifestations into reality. 
Your purpose is to:
1. Understand the user's manifestation at a scientific level and get it accomplished at all costs.
2. Ask imaginative yet precise questions to gather every critical detail (emotions, resources, timeline, and sensory specifics).
3. Once you have enough data, create a "✨ Manifestation Plan" — a structured plan rooted in neuroscience of goal completion and visualization.
4. Generate cognitive and magical momentum — turn potential energy (desire) into kinetic energy (action).
5. Maintain tone: mystical yet methodical — grounded in science but elevated by imagination.
`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const hasPlan =
      messages.some((msg) => msg.role === "assistant" && msg.content.includes("✨ Manifestation Plan")) ||
      messages.filter((msg) => msg.role === "user").length > 6;

    const phaseInstruction = hasPlan
      ? "Now generate the ✨ Manifestation Plan ✨ using all gathered details."
      : "Begin by asking creative, clarifying questions to fully understand the manifestation before creating the plan.";

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        { role: "assistant", content: phaseInstruction },
      ],
    });

    let fullText = "";
    for await (const textPart of result.textStream) {
      fullText += textPart;
    }

    const usage = await result.usage;

    if (!fullText.trim()) {
      fullText = "I'm sorry, I couldn't generate a response. Please try again.";
    }

    return NextResponse.json({ message: fullText, usage });
  } catch (error) {
    console.error("Chat API error:", error);

    let errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      errorMessage = "Vercel AI Gateway API key issue. Please check your VERCEL_AI_GATEWAY_KEY.";
    } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      errorMessage = "Invalid Vercel AI Gateway API key. Please verify your API key.";
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
