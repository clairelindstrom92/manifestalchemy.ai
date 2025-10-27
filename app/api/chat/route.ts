import { NextRequest, NextResponse } from "next/server";
import { getHFClient } from "../../../lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    console.log('API called with messages:', messages.length);
    
    const hf = getHFClient();
    
    console.log('HuggingFace client created successfully');
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;
    
    // Use HuggingFace chat completion
    const response = await hf.chatCompletion({
      model: "microsoft/DialoGPT-large", // Using a conversational model
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
    });

    console.log('HuggingFace completion received');

    const message = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ 
      message: message,
      usage: response.usage 
    });

  } catch (error) {
    console.error("Chat API error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: "Failed to process chat message",
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
    }, { status: 500 });
  }
}


