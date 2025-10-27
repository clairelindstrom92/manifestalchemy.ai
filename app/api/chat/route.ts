import { NextRequest, NextResponse } from "next/server";
import { streamText } from 'ai';
import { createGatewayClient } from 'ai';

const gateway = createGatewayClient({
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY || 'vck_6wE9cCfu8Otqlxh8h15debMS1CI38AJzE6JxujrhlaOfAvv5LF4MwzWD',
});

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
    
    // Use Vercel AI Gateway with AI SDK
    const result = await streamText({
      model: 'anthropic/claude-3-5-haiku',
      messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      maxTokens: 250,
      gateway,
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


