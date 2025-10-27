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
    
    // Use HuggingFace text generation API
    const response = await hf.textGeneration({
      model: "google/flan-t5-large", // Simple conversational model
      inputs: userMessage,
      parameters: {
        max_new_tokens: 250,
        return_full_text: false
      }
    });

    console.log('HuggingFace completion received');

    const message = response.generated_text || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ 
      message: message,
      usage: null
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


