import { BaseAgent, AgentContext, AgentResult } from './baseAgent';
import { FinanceAgent } from './financeAgent';
import { HealthAgent } from './healthAgent';
import { CareerAgent } from './careerAgent';
import { RelationshipAgent } from './relationshipAgent';
import { EnvironmentAgent } from './environmentAgent';

export class AgentCoordinator {
  private agents: BaseAgent[];

  constructor() {
    this.agents = [
      new FinanceAgent(),
      new HealthAgent(),
      new CareerAgent(),
      new RelationshipAgent(),
      new EnvironmentAgent()
    ];
  }

  /**
   * Route manifestation to appropriate sub-agents
   */
  async routeManifestation(context: AgentContext): Promise<AgentResult[]> {
    const results: AgentResult[] = [];

    // Find agents that can handle this context
    const applicableAgents = this.agents.filter(agent => agent.canHandle(context));

    if (applicableAgents.length === 0) {
      // If no specific agent matches, use a general approach
      return [this.generateGeneralResult(context)];
    }

    // Sort agents by confidence level
    const sortedAgents = applicableAgents.sort((a, b) => 
      b.getConfidence(context) - a.getConfidence(context)
    );

    // Process with the most confident agent first
    const primaryAgent = sortedAgents[0];
    const primaryResult = await primaryAgent.process(context);
    results.push(primaryResult);

    // If there are other applicable agents with high confidence, include them
    const secondaryAgents = sortedAgents.slice(1).filter(agent => 
      agent.getConfidence(context) > 0.6
    );

    for (const agent of secondaryAgents) {
      const result = await agent.process(context);
      results.push(result);
    }

    return results;
  }

  /**
   * Get the best agent for a specific context
   */
  getBestAgent(context: AgentContext): BaseAgent | null {
    const applicableAgents = this.agents.filter(agent => agent.canHandle(context));
    
    if (applicableAgents.length === 0) {
      return null;
    }

    return applicableAgents.reduce((best, current) => 
      current.getConfidence(context) > best.getConfidence(context) ? current : best
    );
  }

  /**
   * Get all agents that can handle the context
   */
  getApplicableAgents(context: AgentContext): BaseAgent[] {
    return this.agents.filter(agent => agent.canHandle(context));
  }

  /**
   * Get agent confidence scores for all agents
   */
  getAgentConfidences(context: AgentContext): { agent: BaseAgent; confidence: number }[] {
    return this.agents.map(agent => ({
      agent,
      confidence: agent.getConfidence(context)
    })).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Process manifestation with multiple agents and combine results
   */
  async processWithMultipleAgents(context: AgentContext): Promise<{
    primaryResult: AgentResult;
    secondaryResults: AgentResult[];
    combinedCausalMap: any[];
    combinedActions: any[];
  }> {
    const results = await this.routeManifestation(context);
    
    if (results.length === 0) {
      const generalResult = this.generateGeneralResult(context);
      return {
        primaryResult: generalResult,
        secondaryResults: [],
        combinedCausalMap: generalResult.causalMap,
        combinedActions: generalResult.microActions
      };
    }

    const primaryResult = results[0];
    const secondaryResults = results.slice(1);

    // Combine causal maps from all agents
    const combinedCausalMap = results.flatMap(result => result.causalMap);
    
    // Combine micro-actions from all agents
    const combinedActions = results.flatMap(result => result.microActions);

    return {
      primaryResult,
      secondaryResults,
      combinedCausalMap,
      combinedActions
    };
  }

  /**
   * Generate a general result when no specific agent matches
   */
  private generateGeneralResult(context: AgentContext): AgentResult {
    return {
      causalMap: [
        {
          id: 'general-manifestation',
          action: 'Align daily actions with manifestation goals',
          dependencies: [],
          probability: 0.7,
          resistance: 0.4,
          timeframe: '1 week',
          category: 'behavioral' as const
        }
      ],
      optimalPath: {
        id: 'general-path',
        description: 'General manifestation approach',
        steps: [
          {
            id: 'general-action',
            description: 'Take daily actions aligned with your manifestation',
            category: 'behavioral' as const,
            timeframe: '1 week',
            dependencies: [],
            probability: 0.7,
            resistance: 0.4,
            dopamineTrigger: 'Feel the satisfaction of taking aligned action'
          }
        ],
        totalProbability: 0.7,
        totalResistance: 0.4,
        estimatedTimeframe: '1 month',
        synchronicityTriggers: [
          'Notice opportunities that align with your goals',
          'Be open to unexpected synchronicities',
          'Pay attention to signs and signals'
        ]
      },
      microActions: [
        {
          id: 'general-action',
          description: 'Take daily actions aligned with your manifestation',
          category: 'behavioral' as const,
          timeframe: '1 week',
          dependencies: [],
          probability: 0.7,
          resistance: 0.4,
          dopamineTrigger: 'Feel the satisfaction of taking aligned action'
        }
      ],
      synchronicityTriggers: [
        'Notice opportunities that align with your goals',
        'Be open to unexpected synchronicities',
        'Pay attention to signs and signals'
      ],
      environmentalDirectives: [
        'Create an environment that supports your manifestation',
        'Set up visual reminders of your goals',
        'Organize your space to align with your desires'
      ],
      progressIndicators: [
        'Track daily progress toward your goals',
        'Monitor synchronicities and opportunities',
        'Notice improvements in alignment'
      ]
    };
  }

  /**
   * Get agent by type
   */
  getAgentByType(type: string): BaseAgent | null {
    return this.agents.find(agent => agent.type === type) || null;
  }

  /**
   * Get all available agent types
   */
  getAvailableAgentTypes(): string[] {
    return this.agents.map(agent => agent.type);
  }

  /**
   * Add a custom agent
   */
  addAgent(agent: BaseAgent): void {
    this.agents.push(agent);
  }

  /**
   * Remove an agent by type
   */
  removeAgent(type: string): boolean {
    const index = this.agents.findIndex(agent => agent.type === type);
    if (index !== -1) {
      this.agents.splice(index, 1);
      return true;
    }
    return false;
  }
}
