import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "../../../lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ 
      message: response,
      usage: completion.usage 
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ 
      error: "Failed to process chat message",
      message: "I'm experiencing technical difficulties. Please try again."
    }, { status: 500 });
  }
}


