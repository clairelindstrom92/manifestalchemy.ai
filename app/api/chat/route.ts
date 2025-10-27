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
    
    console.log('Sending to HuggingFace:', userMessage.substring(0, 50) + '...');
    
    // Create a conversational prompt
    const conversationHistory = messages.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');
    
    const fullPrompt = `You are a helpful AI assistant for Manifest Alchemy, helping users manifest their dreams into reality.

${conversationHistory}
Assistant:`;
    
    // Use HuggingFace text generation API with a publicly available model
    // Try the Inference Endpoints API with a model that definitely works
    const response = await hf.textGeneration({
      model: "gpt2",
      inputs: userMessage,
      parameters: {
        max_new_tokens: 250,
        return_full_text: false,
        temperature: 0.7,
        top_p: 0.9
      }
    });

    console.log('HuggingFace completion received');

    const message = response.generated_text?.trim() || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ 
      message: message,
      usage: null
    });

  } catch (error) {
    console.error("Chat API error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Provide more helpful error messages
    let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('API key')) {
      errorMessage = 'HuggingFace API key is not configured. Please add HUGGINGFACE_API_KEY to your Vercel environment variables.';
    } else if (errorMessage.includes('No Inference Provider') || errorMessage.includes('model is not available') || errorMessage.includes('model')) {
      errorMessage = `Model access issue: ${errorMessage}. This may be due to HuggingFace API limitations. Please check your HuggingFace account has API access enabled.`;
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorMessage = 'Invalid HuggingFace API key. Please verify your API key in Vercel environment variables.';
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      errorMessage = 'HuggingFace API rate limit exceeded. Free accounts have limits. Please try again in a few minutes.';
    }
    
    return NextResponse.json({ 
      error: "Failed to process chat message",
      message: `Error: ${errorMessage}`
    }, { status: 500 });
  }
}


