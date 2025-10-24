import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImagePreference {
  imageId: string;
  imageName: string;
  imageUrl: string;
  selectedCount: number;
  rejectedCount: number;
  lastSelected: Date;
  tags: string[];
  userContext: string;
}

export interface LearningInsights {
  preferredStyles: string[];
  preferredColors: string[];
  preferredThemes: string[];
  emotionalTriggers: string[];
  recommendationScore: number;
}

export class ImageLearningSystem {
  private preferences: Map<string, ImagePreference> = new Map();
  private userContext: string = '';

  constructor() {
    this.loadPreferences();
  }

  async recordImageInteraction(
    imageId: string, 
    imageName: string, 
    imageUrl: string, 
    isSelected: boolean,
    userContext: string = ''
  ): Promise<void> {
    const existing = this.preferences.get(imageId) || {
      imageId,
      imageName,
      imageUrl,
      selectedCount: 0,
      rejectedCount: 0,
      lastSelected: new Date(),
      tags: [],
      userContext: ''
    };

    if (isSelected) {
      existing.selectedCount++;
      existing.lastSelected = new Date();
    } else {
      existing.rejectedCount++;
    }

    existing.userContext = userContext;
    this.preferences.set(imageId, existing);

    // Analyze image to extract tags
    await this.analyzeImageTags(existing);

    // Save preferences
    this.savePreferences();

    // Update user context for better recommendations
    this.userContext = userContext;
  }

  private async analyzeImageTags(preference: ImagePreference): Promise<void> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and extract relevant tags for manifestation preferences. Focus on:
                - Visual style (minimalist, luxurious, natural, modern, etc.)
                - Color palette (warm, cool, neutral, vibrant, etc.)
                - Themes (success, peace, adventure, creativity, etc.)
                - Emotional tone (inspiring, calming, exciting, etc.)
                - Objects and symbols that might relate to manifestation goals
                
                Return as a JSON array of strings.`
              },
              {
                type: "image_url",
                image_url: {
                  url: preference.imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content?.trim();
      try {
        const tags = JSON.parse(response || '[]');
        preference.tags = tags;
      } catch (error) {
        console.error('Error parsing image tags:', error);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    }
  }

  async generatePersonalizedRecommendations(
    userManifestationGoals: string[],
    emotionalState: string,
    limit: number = 8
  ): Promise<ImagePreference[]> {
    // Get all preferences
    const allPreferences = Array.from(this.preferences.values());
    
    if (allPreferences.length === 0) {
      return [];
    }

    // Calculate recommendation scores
    const scoredPreferences = allPreferences.map(pref => ({
      ...pref,
      recommendationScore: this.calculateRecommendationScore(
        pref, 
        userManifestationGoals, 
        emotionalState
      )
    }));

    // Sort by recommendation score and return top recommendations
    return scoredPreferences
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
  }

  private calculateRecommendationScore(
    preference: ImagePreference,
    manifestationGoals: string[],
    emotionalState: string
  ): number {
    let score = 0;

    // Base score from selection history
    const totalInteractions = preference.selectedCount + preference.rejectedCount;
    if (totalInteractions > 0) {
      score += (preference.selectedCount / totalInteractions) * 50;
    }

    // Boost for recently selected images
    const daysSinceLastSelected = (Date.now() - preference.lastSelected.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSelected < 7) {
      score += 20;
    }

    // Boost for tags that match manifestation goals
    const goalMatches = preference.tags.filter(tag => 
      manifestationGoals.some(goal => 
        goal.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(goal.toLowerCase())
      )
    ).length;
    score += goalMatches * 10;

    // Boost for emotional alignment
    const emotionalTags = ['inspiring', 'calming', 'exciting', 'peaceful', 'energetic'];
    const emotionalMatches = preference.tags.filter(tag => 
      emotionalTags.some(emotion => 
        tag.toLowerCase().includes(emotion.toLowerCase())
      )
    ).length;
    score += emotionalMatches * 5;

    return Math.min(score, 100); // Cap at 100
  }

  async generateCustomImagePrompt(
    userManifestationGoals: string[],
    emotionalState: string,
    userPreferences: string[]
  ): Promise<string> {
    const prompt = `Create a detailed image prompt for a manifestation visualization based on:

User Goals: ${userManifestationGoals.join(', ')}
Emotional State: ${emotionalState}
User Preferences: ${userPreferences.join(', ')}

Generate a prompt that creates an inspiring, personalized visualization that will help with manifestation. Include:
- Specific visual elements
- Color palette
- Mood and atmosphere
- Symbolic elements
- Style preferences

Make it detailed and specific for image generation.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      });

      return completion.choices[0]?.message?.content?.trim() || 
        "A beautiful, inspiring visualization representing personal growth and manifestation goals";
    } catch (error) {
      console.error('Error generating custom image prompt:', error);
      return "A beautiful, inspiring visualization representing personal growth and manifestation goals";
    }
  }

  getLearningInsights(): LearningInsights {
    const allPreferences = Array.from(this.preferences.values());
    const selectedImages = allPreferences.filter(p => p.selectedCount > 0);
    
    // Extract preferred styles, colors, and themes
    const allTags = selectedImages.flatMap(p => p.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredStyles = Object.entries(tagCounts)
      .filter(([tag]) => ['minimalist', 'luxurious', 'natural', 'modern', 'vintage'].includes(tag))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);

    const preferredColors = Object.entries(tagCounts)
      .filter(([tag]) => ['warm', 'cool', 'neutral', 'vibrant', 'pastel'].includes(tag))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);

    const preferredThemes = Object.entries(tagCounts)
      .filter(([tag]) => ['success', 'peace', 'adventure', 'creativity', 'love'].includes(tag))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);

    return {
      preferredStyles,
      preferredColors,
      preferredThemes,
      emotionalTriggers: Object.keys(tagCounts).filter(tag => 
        ['inspiring', 'calming', 'exciting', 'peaceful'].includes(tag)
      ),
      recommendationScore: selectedImages.length > 0 ? 
        selectedImages.reduce((sum, img) => sum + img.selectedCount, 0) / selectedImages.length : 0
    };
  }

  private savePreferences(): void {
    try {
      const data = Array.from(this.preferences.entries());
      localStorage.setItem('imagePreferences', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  private loadPreferences(): void {
    try {
      const data = localStorage.getItem('imagePreferences');
      if (data) {
        const entries = JSON.parse(data);
        this.preferences = new Map(entries);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }
}
