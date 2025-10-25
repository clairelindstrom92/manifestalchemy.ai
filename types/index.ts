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

export interface MicroAction {
  id: string;
  description: string;
  category: 'environmental' | 'behavioral' | 'cognitive' | 'energetic';
  timeframe: string;
  dependencies: string[];
  probability: number;
  resistance: number;
  dopamineTrigger?: string;
}

export interface CausalNode {
  id: string;
  action: string;
  dependencies: string[];
  probability: number;
  resistance: number;
  timeframe: string;
  category: 'environmental' | 'behavioral' | 'cognitive' | 'energetic';
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
  agentType?: string;
  causalMap?: CausalNode[];
  microActions?: MicroAction[];
  synchronicityTriggers?: string[];
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

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ExtractedData {
  coreDesire?: string;
  timeframe?: string;
  constraints?: string[];
  emotionalCharge?: string;
  limitingBeliefs?: string[];
}

export interface ConversationResponse {
  aiResponse: string;
  readyToGenerate: boolean;
  confidence: number;
  extractedData: ExtractedData;
}

export interface ConversationRequest {
  conversationHistory: ConversationMessage[];
  userMessage: string;
}

export interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

export interface APIError {
  message: string;
  code?: string;
  status?: number;
}

export interface OpenAIResponse {
  steps: ManifestationStep[];
  reasoning: string;
}
