import { NextRequest, NextResponse } from "next/server";
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    console.log('API called with messages:', messages.length);
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;
    
    console.log('Sending to Vercel AI Gateway:', userMessage.substring(0, 50) + '...');
    
    // Use OpenAI with AI SDK
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      maxTokens: 250,
    });

    // Collect all text parts
    let fullText = '';
    for await (const textPart of result.textStream) {
      fullText += textPart;
    }

    console.log('Vercel AI Gateway completion received');
    const usage = await result.usage;

    return NextResponse.json({ 
      message: fullText,
      usage: usage
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
    
    if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      errorMessage = 'Vercel AI Gateway API key issue. Please check your VERCEL_AI_GATEWAY_KEY environment variable.';
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorMessage = 'Invalid Vercel AI Gateway API key. Please verify your API key.';
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
    } else if (errorMessage.includes('model')) {
      errorMessage = `Model access issue: ${errorMessage}`;
    }
    
    return NextResponse.json({ 
      error: "Failed to process chat message",
      message: `Error: ${errorMessage}`
    }, { status: 500 });
  }
}


