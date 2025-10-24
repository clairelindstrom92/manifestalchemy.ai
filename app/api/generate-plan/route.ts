import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  
  return new OpenAI({
    apiKey,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json();

    const prompt = `Based on this conversation context, create a personalized manifestation plan with 5-7 actionable steps:

Context: ${JSON.stringify(context, null, 2)}

Generate specific, actionable steps that will help this person manifest their goals. Each step should be:
1. Specific and actionable
2. Aligned with their emotional state
3. Building toward their main focus
4. Practical and achievable

Return as a JSON array of strings.`;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content?.trim();
    try {
      const steps = JSON.parse(response || '[]');
      return NextResponse.json({ steps });
    } catch {
      return NextResponse.json({
        steps: [
          "Set a clear intention for your manifestation",
          "Create a daily practice that aligns with your goal",
          "Visualize your desired outcome daily",
          "Take one small action toward your goal each day",
          "Release any limiting beliefs holding you back"
        ]
      });
    }
  } catch (error) {
    console.error('Error generating manifestation plan:', error);
    return NextResponse.json({
      steps: [
        "Set a clear intention for your manifestation",
        "Create a daily practice that aligns with your goal",
        "Visualize your desired outcome daily",
        "Take one small action toward your goal each day",
        "Release any limiting beliefs holding you back"
      ]
    });
  }
}
