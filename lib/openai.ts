import OpenAI from 'openai';
import { UserData, ManifestationStep, OpenAIResponse } from '../types';

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export async function generateManifestationPlan(userData: UserData): Promise<ManifestationStep[]> {
  try {
    const prompt = `User named ${userData.userName} wants to manifest: ${userData.manifestation_title}. 
Their core emotion is ${userData.core_emotion} and they envision ${userData.environment_description}.
They connect with ${userData.symbolic_elements} in the ${userData.manifestation_category} category.
Create 3 practical steps they can take today to move towards their manifestation.

Please respond with a JSON object containing:
{
  "steps": [
    {
      "id": "step1",
      "title": "Step Title",
      "description": "Detailed description of what to do",
      "actionable": true,
      "timeframe": "Today/This week/This month"
    }
  ]
}`;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are Manifestation Alchemy AI, a manifestation coach. Create practical, actionable steps that help users move towards their manifestations. Focus on immediate actions they can take today."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsedResponse: { steps: ManifestationStep[] } = JSON.parse(response);
    return parsedResponse.steps;

  } catch (error) {
    console.error('Error generating manifestation plan:', error);
    // Return fallback steps if API fails
    return [
      {
        id: 'step1',
        title: 'Reflect and Clarify',
        description: `Take 10 minutes to write down exactly what ${userData.manifestation_title} means to you and why it's important.`,
        actionable: true,
        timeframe: 'Today'
      },
      {
        id: 'step2',
        title: 'Identify One Small Action',
        description: 'Choose one small, concrete action you can take today that moves you closer to your manifestation.',
        actionable: true,
        timeframe: 'Today'
      },
      {
        id: 'step3',
        title: 'Set Up Your Environment',
        description: 'Create a physical or digital space that supports your manifestation journey.',
        actionable: true,
        timeframe: 'This week'
      }
    ];
  }
}
