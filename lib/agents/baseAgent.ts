import { ExtractedData } from '../../types';

export type ManifestationState = 'discovered' | 'active' | 'materializing' | 'manifested';

export interface CausalNode {
  id: string;
  action: string;
  dependencies: string[];
  probability: number;
  resistance: number;
  timeframe: string;
  category: 'environmental' | 'behavioral' | 'cognitive' | 'energetic';
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

export interface RealityPath {
  id: string;
  description: string;
  probability: number;
  resistance: number;
  timeframe: string;
  microActions: MicroAction[];
  causalNodes: CausalNode[];
}

export interface AgentContext {
  extractedData: ExtractedData;
  userProfile?: any;
  manifestationState: ManifestationState;
  progressVelocity: number;
}

export interface AgentResult {
  agentType: string;
  causalMap: CausalNode[];
  microActions: MicroAction[];
  synchronicityTriggers: string[];
  confidence: number;
}

export abstract class BaseAgent {
  protected agentType: string;
  protected keywords: string[];

  constructor(agentType: string, keywords: string[]) {
    this.agentType = agentType;
    this.keywords = keywords;
  }

  public abstract analyze(context: AgentContext): Promise<AgentResult>;

  protected generateCausalMap(context: AgentContext, nodes: Partial<CausalNode>[]): CausalNode[] {
    return nodes.map((node, index) => ({
      id: `node-${this.agentType}-${index}`,
      description: node.description || `Default description for ${this.agentType} node`,
      category: node.category || 'cognitive',
      probability: node.probability || 0.7,
      dependencies: node.dependencies || [],
      actionable: node.actionable !== undefined ? node.actionable : true,
    }));
  }

  protected generateMicroActions(causalMap: CausalNode[]): MicroAction[] {
    return causalMap
      .filter(node => node.actionable)
      .map((node, index) => ({
        id: `micro-action-${this.agentType}-${index}`,
        description: `Engage with: ${node.description.toLowerCase()}`,
        targetNodeId: node.id,
        dopamineTrigger: `Visualize completion of ${node.description}`,
        timeEstimate: "15 min",
      }));
  }

  protected generateSynchronicityTriggers(context: AgentContext): string[] {
    return [`Observe for ${this.agentType} related opportunities.`];
  }

  protected calculateConfidence(causalMap: CausalNode[]): number {
    if (causalMap.length === 0) return 0.5;
    const avgProbability = causalMap.reduce((sum, node) => sum + node.probability, 0) / causalMap.length;
    return Math.min(1.0, avgProbability * 0.9 + 0.1);
  }

  // Protected helper methods

  protected calculateProbability(action: MicroAction, context: AgentContext): number {
    let probability = 0.5; // Base probability
    
    // Adjust based on manifestation state
    switch (context.manifestationState) {
      case 'discovered':
        probability = 0.3;
        break;
      case 'active':
        probability = 0.6;
        break;
      case 'materializing':
        probability = 0.8;
        break;
      case 'manifested':
        probability = 1.0;
        break;
    }
    
    // Adjust based on progress velocity
    probability += context.progressVelocity * 0.2;
    
    // Adjust based on action resistance
    probability -= action.resistance * 0.3;
    
    return Math.max(0.1, Math.min(1.0, probability));
  }

  protected calculateResistance(action: MicroAction, context: AgentContext): number {
    let resistance = 0.5; // Base resistance
    
    // Increase resistance for complex actions
    if (action.dependencies.length > 2) {
      resistance += 0.2;
    }
    
    // Decrease resistance for high-probability actions
    resistance -= action.probability * 0.3;
    
    // Adjust based on manifestation state
    switch (context.manifestationState) {
      case 'discovered':
        resistance += 0.3;
        break;
      case 'active':
        resistance += 0.1;
        break;
      case 'materializing':
        resistance -= 0.1;
        break;
      case 'manifested':
        resistance = 0.0;
        break;
    }
    
    return Math.max(0.0, Math.min(1.0, resistance));
  }

  protected generateRealityPaths(context: AgentContext): RealityPath[] {
    const causalMap = this.generateCausalMap(context, []);
    const microActions = this.generateMicroActions(causalMap);
    
    return [
      {
        id: `path-${this.agentType}-primary`,
        description: `Primary ${this.agentType} manifestation path`,
        probability: 0.8,
        resistance: 0.3,
        timeframe: '3-6 months',
        microActions,
        causalNodes: causalMap
      }
    ];
  }
}