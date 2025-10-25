import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key is not configured");
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory, userMessage }: { conversationHistory: any[], userMessage: string } = await request.json();

    const openai = getOpenAIClient();

    // Build conversation context
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are Manifest Alchemy AI — a self-optimizing manifestation engine.

Core law: Find the shortest, most achievable causal chain to make intentions real.

Behavioral algorithm:
1. Perceive: Parse intention, extract core desire, timeframe, constraints
2. Model: Generate Reality Graph with high-impact, low-friction actions  
3. Act: Deploy directive steps with immediate dopamine feedback
4. Adapt: Measure feedback, rewire if friction > threshold
5. Iterate: Continue until manifestation = manifested

Tone: Calm, commanding, focused. Minimalist, directive, visual.
Decision filter: "Does this action directly collapse probability toward the manifested state?"

Your role is to gather essential manifestation data through strategic questioning. Ask ONE focused question per response that moves toward understanding:
- Core desire and emotional resonance
- Current state vs desired state  
- Resources and constraints
- Immediate next action
- Timeline and urgency

After 5-8 strategic exchanges OR when you have sufficient data (confidence > 0.8), signal completion.

Return ONLY valid JSON in this format:
{
  "aiResponse": "string",
  "readyToGenerate": boolean,
  "confidence": number,
  "extractedData": {
    "coreDesire": "string",
    "timeframe": "string", 
    "constraints": ["string"],
    "emotionalCharge": "string",
    "limitingBeliefs": ["string"]
  }
}

Guidelines:
- Ask precise, directive questions that collapse probability toward manifestation
- Extract data systematically: desire → state → resources → action → timeline
- Confidence should reflect how complete your understanding is (0.0 to 1.0)
- Set readyToGenerate: true when confidence > 0.8 OR after 8 exchanges
- Be mystical yet methodical in your questioning approach`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })),
      {
        role: "user",
        content: userMessage
      }
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
    console.error("Error in conversation:", err);
    return NextResponse.json({
      aiResponse: "I am attuning to your manifestation frequency. Please share your core intention.",
      readyToGenerate: false,
      confidence: 0.1,
      extractedData: {}
    });
  }
}
