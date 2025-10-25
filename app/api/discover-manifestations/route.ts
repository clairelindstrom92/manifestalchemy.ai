import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key is not configured");
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory, extractedData, existingManifestations = [] } = await request.json();

    const openai = getOpenAIClient();

    // Build conversation context for manifestation extraction
    const conversationText = conversationHistory?.map((msg: any) => 
      `${msg.role}: ${msg.content}`
    ).join('\n') || '';

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are Manifest Alchemy AI — analyzing conversations to discover manifestations with scientific precision and mystical insight.

When analyzing conversations, look for:
1. Core intentions and desires
2. Environmental preferences and conditions  
3. Emotional states and frequencies
4. Symbolic elements and anchors
5. Energy patterns and vibrations

For each manifestation discovered, provide:
- A clear, mystical name
- A precise description of what it represents
- The category it belongs to
- Your confidence level (0.0 to 1.0)
- The current status of manifestation

Return ONLY valid JSON in this format:
{
  "discoveredManifestations": [
    {
      "name": "string",
      "description": "string", 
      "category": "string",
      "confidence": number,
      "status": "discovered" | "active" | "materializing" | "manifested",
      "details": "string"
    }
  ],
  "reasoning": "string"
}

Guidelines:
1. Only extract manifestations that are clearly expressed or implied
2. Confidence should reflect how certain you are about the manifestation
3. Status should reflect the current state of manifestation
4. Categories should be: "primary", "environment", "frequency", "symbols", "energy", or "other"
5. Be mystical yet precise in your analysis
6. Don't duplicate existing manifestations unless they've evolved
7. Use the extractedData to enhance your understanding`,
      },
      {
        role: "user",
        content: `Analyze this conversation for manifestations:\n\n${conversationText}\n\nExtracted Data: ${JSON.stringify(extractedData, null, 2)}\n\nExisting manifestations: ${JSON.stringify(existingManifestations, null, 2)}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const message = completion.choices?.[0]?.message?.content;
    if (!message) throw new Error("No response from model");

    const parsed = JSON.parse(message);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Error discovering manifestations:", err);
    return NextResponse.json({
      discoveredManifestations: [],
      reasoning: "Manifestation discovery temporarily unavailable",
    });
  }
}
