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

export interface ConversationContext {
  userName?: string;
  previousResponses: string[];
  currentFocus: string;
  manifestationGoals: string[];
  emotionalState: string;
  imagePreferences: string[];
  conversationStage: 'initial' | 'exploration' | 'deepening' | 'specifics' | 'completion';
  previousQuestions: string[];
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

export interface AIResponse {
  question: string;
  context: ConversationContext;
  shouldShowImages: boolean;
  isComplete: boolean;
  nextAction: 'continue' | 'generate_manifestation' | 'show_images';
  relevantImages: string[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('AI Agent API called');
    const { userResponse, context, manifestationId, project } = await request.json();
    console.log('Request data:', { userResponse, manifestationId });

    // Analyze user response for insights
    const emotionalAnalysis = await analyzeEmotion(userResponse);
    const themes = await extractThemes(userResponse);
    
    // Select relevant images based on user response
    const relevantImages = selectRelevantImages(userResponse, themes);

    // Update context
    const updatedContext: ConversationContext = {
      ...context,
      previousResponses: [...(context.previousResponses || []), userResponse],
      emotionalState: emotionalAnalysis,
      manifestationGoals: [...(context.manifestationGoals || []), ...themes],
      currentFocus: themes[0] || context.currentFocus || '',
      conversationStage: determineConversationStage(context, themes),
      previousQuestions: context.previousQuestions || [],
      conversationHistory: [
        ...(context.conversationHistory || []),
        {
          role: 'user',
          content: userResponse,
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Generate manifestation-specific system prompt
    let systemPrompt = `You are Aurelia, a Manifest Alchemist who uses a precise algorithm to bring manifestations into fruition. You inspire, engage, and help users think deeply about their desires.

Your role as a Manifest Alchemist:
- Never use the word "goal" - only use "manifestation"
- Ask profound, thought-provoking questions that unlock deep insights
- Inspire imagination and help users visualize their manifestations clearly
- Analyze personal data and manifestations to create precise algorithms
- Guide users through a deep dive into their specific manifestations
- Use mystical, alchemical language that sparks wonder and possibility
- Ask questions that reveal the deeper layers of their desires
- Help them connect with the feeling and essence of their manifestations

Key principles:
- Ask ONE deep, penetrating question at a time
- Build on previous responses with increasing depth
- Adapt your tone to the user's emotional state
- Focus on uncovering the essence and feeling of their manifestations
- Guide toward specific, vivid manifestations
- Use warm, mystical, alchemical language
- Keep questions open-ended but deeply focused on manifestation

CRITICAL: Avoid repetitive questions. Each question must be unique and build upon previous responses. Never ask the same question twice.

Previous questions asked: ${(context.previousQuestions || []).join(', ') || 'None yet'}`;

    // Add manifestation-specific context if provided
    if (manifestationId && project) {
      const manifestationData = getManifestationData(manifestationId, project);
      systemPrompt += `

Current Manifestation Focus: ${manifestationData.name}
Manifestation Context: ${manifestationData.description}
User's Project Data: ${JSON.stringify(project.userData, null, 2)}

Generate your next question specifically about this manifestation. Consider:
1. What deeper layer of this manifestation needs to be revealed?
2. How can you help them feel into the essence of this specific desire?
3. What alchemical transformation are they seeking in this area?
4. How can you inspire them to think more deeply about this manifestation?`;
    } else {
      systemPrompt += `

Current conversation context:
${JSON.stringify(updatedContext, null, 2)}

Conversation Progress:
- Number of exchanges: ${updatedContext.previousResponses.length}
- Manifestation themes identified: ${updatedContext.manifestationGoals.length}
- Current focus: ${updatedContext.currentFocus}
- Emotional state: ${updatedContext.emotionalState}
- Conversation stage: ${updatedContext.conversationStage}

Generate your next question as a Manifest Alchemist. Consider:
1. What deeper layer of their manifestation needs to be revealed?
2. How can you help them feel into the essence of their desire?
3. What alchemical transformation are they seeking?
4. How can you inspire them to think more deeply about their manifestation?
5. What specific aspect haven't we explored yet?

IMPORTANT: Based on the conversation progress, ask a question that moves the conversation forward. If we've covered basic desires, ask about specific details. If we have details, ask about feelings and emotions. If we have feelings, ask about obstacles or next steps.

CONVERSATION STAGE GUIDANCE:
- Initial (0 exchanges): Ask engaging, specific questions about their deepest desires
- Exploration (1-2 exchanges): Explore different areas of their life and what they want to manifest
- Deepening (3-5 exchanges): Go deeper into their specific manifestations and feelings
- Specifics (6-7 exchanges): Ask about specific details, obstacles, and next steps
- Completion (8+ exchanges): Summarize and prepare for manifestation plan generation

QUESTION EXAMPLES BY STAGE:
- Initial: "Close your eyes for a moment... What vision of your ideal life makes your heart skip a beat?"
- Exploration: "I sense something powerful stirring in you. What area of your life feels most ready for transformation right now?"
- Deepening: "Feel into that vision... What emotions arise when you imagine this manifestation as your reality?"
- Specifics: "What's the first step that would make this manifestation feel tangibly closer to you?"
- Completion: "What would it feel like to wake up tomorrow with this manifestation already flowing into your life?"`;
    }

    systemPrompt += `

Respond with ONLY the question text, nothing else.`;

    // Generate next question using AI
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userResponse
        }
      ],
      max_tokens: 200,
      temperature: 0.8
    });

    const question = completion.choices[0]?.message?.content || "Close your eyes for a moment... What vision of your ideal life makes your heart skip a beat?";

    // Add AI response to context
    updatedContext.conversationHistory.push({
      role: 'assistant',
      content: question,
      timestamp: new Date().toISOString()
    });

    // Track the question to avoid repetition
    updatedContext.previousQuestions.push(question);

    // Determine if conversation should continue or move to manifestation generation
    const shouldContinue = shouldContinueConversation(updatedContext);
    const shouldShowImages = shouldDisplayImages(updatedContext);

    const response: AIResponse = {
      question,
      context: updatedContext,
      shouldShowImages,
      isComplete: !shouldContinue,
      nextAction: shouldContinue ? 'continue' : 'generate_manifestation',
      relevantImages
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating AI question:', error);
    return NextResponse.json({
      question: "Close your eyes for a moment... What vision of your ideal life makes your heart skip a beat?",
      context: {
        previousResponses: [],
        currentFocus: '',
        manifestationGoals: [],
        emotionalState: '',
        imagePreferences: [],
        conversationStage: 'initial' as const,
        previousQuestions: [],
        conversationHistory: []
      },
      shouldShowImages: false,
      isComplete: false,
      nextAction: 'continue',
      relevantImages: []
    });
  }
}

async function analyzeEmotion(text: string): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Analyze the emotional tone of this text. Respond with a single emotion: excited, hopeful, uncertain, frustrated, peaceful, determined, anxious, or inspired."
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 10,
      temperature: 0.3
    });

    return completion.choices[0]?.message?.content?.trim() || 'neutral';
  } catch (error) {
    return 'neutral';
  }
}

async function extractThemes(text: string): Promise<string[]> {
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Extract specific manifestation themes from this text. Return as a JSON array of strings. Focus on specific areas like: career advancement, romantic relationships, financial abundance, health transformation, creative expression, spiritual growth, home environment, travel experiences, personal development, business success, family harmony, physical fitness, artistic pursuits, educational goals, lifestyle changes. Be specific and avoid generic terms."
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    });

    const response = completion.choices[0]?.message?.content?.trim();
    try {
      return JSON.parse(response || '[]');
    } catch (error) {
      console.error('Error extracting themes:', error);
      return [];
    }
  } catch (error) {
    return [];
  }
}

function shouldContinueConversation(context: ConversationContext): boolean {
  // Continue if we have less than 5 meaningful exchanges
  if (context.previousResponses.length < 5) {
    return true;
  }
  
  // Continue if we don't have enough manifestation themes
  if (context.manifestationGoals.length < 3) {
    return true;
  }
  
  // Continue if we don't have a clear focus
  if (!context.currentFocus) {
    return true;
  }
  
  // Continue if the conversation is too short (less than 10 exchanges total)
  if (context.conversationHistory.length < 10) {
    return true;
  }
  
  return false;
}

function shouldDisplayImages(context: ConversationContext): boolean {
  // Show images after just 1 exchange to engage users early
  return context.previousResponses.length >= 1;
}

function getManifestationData(manifestationId: string, project: any) {
  const manifestationData = {
    'primary': {
      name: 'Primary Manifestation',
      description: project.userData.manifestation_title || 'Your main manifestation focus'
    },
    'environment': {
      name: 'Environment',
      description: project.userData.environment_description || 'Your ideal environment'
    },
    'emotion': {
      name: 'Emotional State',
      description: `Feeling: ${project.userData.core_emotion || 'Your desired emotional state'}`
    },
    'symbols': {
      name: 'Symbolic Elements',
      description: project.userData.symbolic_elements || 'Your symbolic representations'
    }
  };
  
  return manifestationData[manifestationId as keyof typeof manifestationData] || manifestationData['primary'];
}

function determineConversationStage(context: ConversationContext, newThemes: string[]): 'initial' | 'exploration' | 'deepening' | 'specifics' | 'completion' {
  const responseCount = context.previousResponses.length;
  const themeCount = context.manifestationGoals.length + newThemes.length;
  
  if (responseCount === 0) return 'initial';
  if (responseCount < 3) return 'exploration';
  if (responseCount < 6 && themeCount < 3) return 'deepening';
  if (responseCount < 8) return 'specifics';
  return 'completion';
}

function selectRelevantImages(userResponse: string, themes: string[]): string[] {
  const imageMapping = {
    'career': ['business', 'success'],
    'business': ['business', 'success'],
    'relationships': ['love', 'marriage'],
    'love': ['love', 'marriage'],
    'romance': ['love', 'marriage'],
    'health': ['fitness', 'manworkout'],
    'fitness': ['fitness', 'manworkout'],
    'wealth': ['money', 'luxury'],
    'money': ['money', 'luxury'],
    'financial': ['money', 'luxury'],
    'travel': ['privatejet', 'terrace'],
    'luxury': ['luxury', 'privatejet', 'mansion'],
    'home': ['mansion', 'terrace'],
    'spirituality': ['spirituality', 'meditation'],
    'spiritual': ['spirituality', 'meditation'],
    'education': ['college'],
    'fame': ['fame'],
    'recognition': ['fame'],
    'shopping': ['shopping'],
    'rest': ['sleep'],
    'wellness': ['sleep', 'meditation']
  };
  
  const relevantImages: string[] = [];
  
  // Add images based on themes
  themes.forEach(theme => {
    const lowerTheme = theme.toLowerCase();
    Object.entries(imageMapping).forEach(([keyword, images]) => {
      if (lowerTheme.includes(keyword)) {
        relevantImages.push(...images);
      }
    });
  });
  
  // Add images based on user response keywords
  const lowerResponse = userResponse.toLowerCase();
  Object.entries(imageMapping).forEach(([keyword, images]) => {
    if (lowerResponse.includes(keyword)) {
      relevantImages.push(...images);
    }
  });
  
  // Remove duplicates and return unique images
  return [...new Set(relevantImages)];
}
