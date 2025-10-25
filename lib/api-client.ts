'use client';

import { ConversationMessage, ExtractedData, DiscoveredManifestation, ManifestationProject } from '../types';

interface ConversationRequest {
  conversationHistory: ConversationMessage[];
  userMessage: string;
}

interface ConversationResponse {
  aiResponse: string;
  readyToGenerate: boolean;
  confidence: number;
  extractedData: ExtractedData;
}

interface DiscoveryRequest {
  conversationHistory: ConversationMessage[];
  extractedData: ExtractedData;
  existingManifestations: DiscoveredManifestation[];
}

interface DiscoveryResponse {
  discoveredManifestations: DiscoveredManifestation[];
  reasoning: string;
}

interface GeneratePlanRequest {
  context: {
    manifestation: string;
    extractedData: ExtractedData;
  };
}

interface GeneratePlanResponse {
  alchemy_sequences: string[];
  encouragement: string;
  summary: string;
}

class APIClient {
  private baseURL: string;
  private cache: Map<string, any> = new Map();
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' ? '' : '';
  }

  private async makeRequest<T>(
    endpoint: string, 
    data: any, 
    cacheKey?: string,
    ttl: number = 300000 // 5 minutes
  ): Promise<T> {
    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Check if request is already in progress
    if (cacheKey && this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    const requestPromise = fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      return response.json();
    });

    // Cache the request promise
    if (cacheKey) {
      this.requestQueue.set(cacheKey, requestPromise);
    }

    try {
      const result = await requestPromise;
      
      // Cache successful response
      if (cacheKey) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
      
      return result;
    } finally {
      // Remove from queue
      if (cacheKey) {
        this.requestQueue.delete(cacheKey);
      }
    }
  }

  async sendMessage(data: ConversationRequest): Promise<ConversationResponse> {
    const cacheKey = `conversation-${JSON.stringify(data)}`;
    return this.makeRequest<ConversationResponse>('/api/conversation', data, cacheKey);
  }

  async discoverManifestations(data: DiscoveryRequest): Promise<DiscoveryResponse> {
    const cacheKey = `discover-${JSON.stringify(data)}`;
    return this.makeRequest<DiscoveryResponse>('/api/discover-manifestations', data, cacheKey);
  }

  async generatePlan(data: GeneratePlanRequest): Promise<GeneratePlanResponse> {
    const cacheKey = `plan-${JSON.stringify(data)}`;
    return this.makeRequest<GeneratePlanResponse>('/api/generate-plan', data, cacheKey);
  }

  async generateManifestationsComplete(
    conversationHistory: ConversationMessage[],
    extractedData: ExtractedData
  ): Promise<ManifestationProject> {
    // Parallel API calls for better performance
    const [discoveryResult, planResult] = await Promise.all([
      this.discoverManifestations({
        conversationHistory,
        extractedData,
        existingManifestations: []
      }),
      this.generatePlan({
        context: {
          manifestation: conversationHistory.map(msg => msg.content).join(' '),
          extractedData
        }
      })
    ]);

    const discoveredManifestations = discoveryResult.discoveredManifestations?.map((manifestation: any) => ({
      id: `manifestation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: manifestation.name,
      description: manifestation.description,
      category: manifestation.category,
      discoveredAt: new Date(),
      conversationId: `conv-${Date.now()}`,
      confidence: manifestation.confidence,
      status: manifestation.status,
      source: 'ai-conversation' as const,
      details: manifestation.details
    })) || [];

    return {
      id: Date.now().toString(),
      userData: {
        userName: 'Manifestor',
        manifestation_category: 'general',
        environment_description: 'Current reality',
        core_emotion: 'determined',
        symbolic_elements: conversationHistory.map(msg => msg.content).join(' '),
        manifestation_title: extractedData.coreDesire || 'Your manifestation'
      },
      steps: (planResult.alchemy_sequences || planResult.steps || []).map((step: string, index: number) => ({
        id: `step-${index}`,
        title: `Step ${index + 1}`,
        description: step,
        actionable: true,
        timeframe: 'flexible'
      })),
      createdAt: new Date(),
      completedSteps: [],
      discoveredManifestations: discoveredManifestations,
      activeConversations: [`conv-${Date.now()}`]
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.requestQueue.clear();
  }
}

export const apiClient = new APIClient();
