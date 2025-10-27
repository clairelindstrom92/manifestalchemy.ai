import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

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
    console.log("Calling streamText with messages:", JSON.stringify(messages));
    
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages,
    });
    
    console.log("StreamText result received");

    // 🧠 Collect streamed response
    let fullText = "";
    let chunkCount = 0;
    for await (const textPart of result.textStream) {
      fullText += textPart;
      chunkCount++;
    }

    console.log("AI response complete, returning to client");
    console.log("Chunks received:", chunkCount);
    console.log("Full text length:", fullText.length);
    console.log("Full text:", fullText);
    const usage = await result.usage;

    // If empty, provide a default response
    if (!fullText || fullText.trim() === "") {
      fullText = "I'm sorry, I couldn't generate a response. Please try again.";
    }

    return NextResponse.json({
      message: fullText,
      usage,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    // 🩹 Graceful error handling with clear feedback
    let errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

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
