import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const runtime = "edge"; // optional but ideal for Vercel Edge Functions

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // 🧩 Validate incoming messages
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    console.log(`Received ${messages.length} messages from client`);

    // ⚡ Stream the AI response using the Vercel AI SDK
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages,
      max_tokens: 250, // ✅ correct property name
    });
    

    // 🧠 Collect streamed response
    let fullText = "";
    for await (const textPart of result.textStream) {
      fullText += textPart;
    }

    console.log("AI response complete, returning to client");
    const usage = await result.usage;

    return NextResponse.json({
      message: fullText,
      usage,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);

    // 🩹 Graceful error handling with clear feedback
    let errorMessage = error.message || "Unknown error occurred";

    if (
      errorMessage.includes("API key") ||
      errorMessage.includes("authentication")
    ) {
      errorMessage =
        "Vercel AI Gateway API key issue. Please check your VERCEL_AI_GATEWAY_KEY environment variable.";
    } else if (
      errorMessage.includes("401") ||
      errorMessage.includes("Unauthorized")
    ) {
      errorMessage =
        "Invalid Vercel AI Gateway API key. Please verify your API key.";
    } else if (
      errorMessage.includes("429") ||
      errorMessage.includes("rate limit")
    ) {
      errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
    } else if (errorMessage.includes("model")) {
      errorMessage = `Model access issue: ${errorMessage}`;
    }

    return NextResponse.json(
      {
        error: "Failed to process chat message",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
