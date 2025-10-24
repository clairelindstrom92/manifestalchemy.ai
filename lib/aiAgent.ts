import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    timestamp: Date;
  }>;
}

export interface AIResponse {
  question: string;
  context: ConversationContext;
  shouldShowImages: boolean;
  isComplete: boolean;
  nextAction: 'continue' | 'generate_manifestation' | 'show_images';
}

export class ManifestationAgent {
  private context: ConversationContext;

  constructor(initialContext?: Partial<ConversationContext>) {
    this.context = {
      previousResponses: [],
      currentFocus: '',
      manifestationGoals: [],
      emotionalState: '',
      imagePreferences: [],
      conversationStage: 'initial',
      previousQuestions: [],
      conversationHistory: [],
      ...initialContext
    };
  }

  async getInitialQuestion(): Promise<AIResponse> {
    const initialQuestion = "Close your eyes for a moment... What vision of your ideal life makes your heart skip a beat?";
    
    this.context.conversationHistory.push({
      role: 'assistant',
      content: initialQuestion,
      timestamp: new Date()
    });
    this.context.previousQuestions.push(initialQuestion);

    return {
      question: initialQuestion,
      context: this.context,
      shouldShowImages: false,
      isComplete: false,
      nextAction: 'continue'
    };
  }

  async generateNextQuestion(userResponse: string): Promise<AIResponse> {
    // Validate input
    if (!userResponse || !userResponse.trim()) {
      throw new Error('User response cannot be empty');
    }

    // Add user response to context
    this.context.previousResponses.push(userResponse);
    this.context.conversationHistory.push({
      role: 'user',
      content: userResponse,
      timestamp: new Date()
    });

    // Analyze user response for insights
    await this.analyzeUserResponse(userResponse);
    
    try {
      // Update conversation stage
      this.updateConversationStage();

      const systemPrompt = `You are Aurelia, a Manifest Alchemist who uses a precise algorithm to bring manifestations into fruition. You inspire, engage, and help users think deeply about their desires.

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

Previous questions asked: ${this.context.previousQuestions.join(', ') || 'None yet'}

Current conversation context:
${JSON.stringify(this.context, null, 2)}

Conversation Progress:
- Number of exchanges: ${this.context.previousResponses.length}
- Manifestation themes identified: ${this.context.manifestationGoals.length}
- Current focus: ${this.context.currentFocus}
- Emotional state: ${this.context.emotionalState}
- Conversation stage: ${this.context.conversationStage}

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
- Completion: "What would it feel like to wake up tomorrow with this manifestation already flowing into your life?"

Generate your next question as a Manifest Alchemist. Consider:
1. What deeper layer of their manifestation needs to be revealed?
2. How can you help them feel into the essence of their desire?
3. What alchemical transformation are they seeking?
4. How can you inspire them to think more deeply about their manifestation?
5. What specific aspect haven't we explored yet?

IMPORTANT: Based on the conversation progress, ask a question that moves the conversation forward. If we've covered basic desires, ask about specific details. If we have details, ask about feelings and emotions. If we have feelings, ask about obstacles or next steps.

Respond with ONLY the question text, nothing else.`;

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
      this.context.conversationHistory.push({
        role: 'assistant',
        content: question,
        timestamp: new Date()
      });

      // Track the question to avoid repetition
      this.context.previousQuestions.push(question);

      // Determine if conversation should continue or move to manifestation generation
      const shouldContinue = this.shouldContinueConversation();
      const shouldShowImages = this.shouldShowImages();

      return {
        question,
        context: this.context,
        shouldShowImages,
        isComplete: !shouldContinue,
        nextAction: shouldContinue ? 'continue' : 'generate_manifestation'
      };

    } catch (error) {
      console.error('Error generating AI question:', error);
      const fallbackQuestion = "Close your eyes for a moment... What vision of your ideal life makes your heart skip a beat?";
      
      // Track fallback question too
      this.context.conversationHistory.push({
        role: 'assistant',
        content: fallbackQuestion,
        timestamp: new Date()
      });
      this.context.previousQuestions.push(fallbackQuestion);
      
      return {
        question: fallbackQuestion,
        context: this.context,
        shouldShowImages: false,
        isComplete: false,
        nextAction: 'continue'
      };
    }
  }

  private async analyzeUserResponse(response: string): Promise<void> {
    // Analyze emotional tone
    const emotionalAnalysis = await this.analyzeEmotion(response);
    this.context.emotionalState = emotionalAnalysis;

    // Extract key themes and goals
    const themes = await this.extractThemes(response);
    this.context.manifestationGoals.push(...themes);

    // Update current focus
    if (themes.length > 0) {
      this.context.currentFocus = themes[0];
    }
  }

  private async analyzeEmotion(text: string): Promise<string> {
    try {
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
    } catch {
      return 'neutral';
    }
  }

  private async extractThemes(text: string): Promise<string[]> {
    try {
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
        const themes = JSON.parse(response || '[]');
        // Avoid duplicate themes
        return themes.filter((theme: string) => 
          !this.context.manifestationGoals.includes(theme)
        );
      } catch (parseError) {
        console.error('Error parsing themes:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error extracting themes:', error);
      return [];
    }
  }

  private shouldContinueConversation(): boolean {
    // Continue if we have less than 5 meaningful exchanges
    if (this.context.previousResponses.length < 5) {
      return true;
    }
    
    // Continue if we don't have enough manifestation themes
    if (this.context.manifestationGoals.length < 3) {
      return true;
    }
    
    // Continue if we don't have a clear focus
    if (!this.context.currentFocus) {
      return true;
    }
    
    // Continue if the conversation is too short (less than 10 exchanges total)
    if (this.context.conversationHistory.length < 10) {
      return true;
    }
    
    return false;
  }

  private shouldShowImages(): boolean {
    // Show images after just 1 exchange to engage users early
    return this.context.previousResponses.length >= 1;
  }

  private updateConversationStage(): void {
    const responseCount = this.context.previousResponses.length;
    const themeCount = this.context.manifestationGoals.length;
    
    if (responseCount === 0) {
      this.context.conversationStage = 'initial';
    } else if (responseCount < 3) {
      this.context.conversationStage = 'exploration';
    } else if (responseCount < 6 && themeCount < 3) {
      this.context.conversationStage = 'deepening';
    } else if (responseCount < 8) {
      this.context.conversationStage = 'specifics';
    } else {
      this.context.conversationStage = 'completion';
    }
  }

  async generateManifestationPlan(): Promise<string[]> {
    const prompt = `Based on this conversation context, create a personalized manifestation plan with 5-7 actionable steps:

Context: ${JSON.stringify(this.context, null, 2)}

Generate specific, actionable steps that will help this person manifest their desires. Each step should be:
1. Specific and actionable
2. Aligned with their emotional state
3. Building toward their main manifestation
4. Practical and achievable
5. Focused on manifestation, not goals

Return as a JSON array of strings.`;

    try {
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
        return JSON.parse(response || '[]');
      } catch {
        return [
          "Set a clear intention for your manifestation",
          "Create a daily practice that aligns with your manifestation",
          "Visualize your desired outcome daily",
          "Take one small action toward your manifestation each day",
          "Release any limiting beliefs holding you back"
        ];
      }
    } catch (error) {
      console.error('Error generating manifestation plan:', error);
      return [
        "Set a clear intention for your manifestation",
        "Create a daily practice that aligns with your manifestation",
        "Visualize your desired outcome daily",
        "Take one small action toward your manifestation each day",
        "Release any limiting beliefs holding you back"
      ];
    }
  }

  updateImagePreferences(imageId: string, isSelected: boolean): void {
    if (isSelected) {
      this.context.imagePreferences.push(imageId);
    } else {
      this.context.imagePreferences = this.context.imagePreferences.filter(id => id !== imageId);
    }
  }

  getContext(): ConversationContext {
    return this.context;
  }
}
