import { NextRequest, NextResponse } from "next/server";

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
    
    // Use Vercel AI Gateway
    const response = await fetch('https://api.vercel.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_AI_GATEWAY_KEY || 'vck_6wE9cCfu8Otqlxh8h15debMS1CI38AJzE6JxujrhlaOfAvv5LF4MwzWD'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-5-haiku',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Vercel AI Gateway error:', errorData);
      throw new Error(`Vercel AI Gateway error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Vercel AI Gateway completion received');

    const message = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

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


