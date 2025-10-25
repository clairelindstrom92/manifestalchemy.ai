export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatHistory {
  messages: ChatMessage[];
}

export interface UserData {
  userName?: string;
  manifestation_category: string;
  environment_description: string;
  core_emotion: string;
  symbolic_elements: string;
  manifestation_title: string;
}

export interface ManifestationStep {
  id: string;
  title: string;
  description: string;
  actionable: boolean;
  timeframe: string;
}

export interface DiscoveredManifestation {
  id: string;
  name: string;
  description: string;
  category: string;
  discoveredAt: Date;
  conversationId: string;
  confidence: number;
  status: 'discovered' | 'active' | 'materializing' | 'manifested';
  source: 'ai-conversation' | 'user-input';
  details?: string;
}

export interface ManifestationProject {
  id: string;
  userData: UserData;
  steps: ManifestationStep[];
  createdAt: Date;
  completedSteps: string[];
  discoveredManifestations: DiscoveredManifestation[];
  activeConversations: string[];
}

export interface ConversationQuestion {
  id: string;
  question: string;
  field: keyof UserData;
  placeholder: string;
  isLast: boolean;
}

export interface OpenAIResponse {
  steps: ManifestationStep[];
  reasoning: string;
}
