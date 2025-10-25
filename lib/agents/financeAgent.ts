import { BaseAgent, AgentContext, MicroAction, RealityPath, AgentResult, CausalNode, ManifestationState } from './baseAgent';

export class FinanceAgent extends BaseAgent {
  constructor() {
    super('finance', ['money', 'wealth', 'financial', 'income', 'abundance', 'prosperity', 'rich', 'financial freedom']);
  }

  analyzeDependencies(context: AgentContext): CausalNode[] {
    const nodes: CausalNode[] = [];

    // Core financial alignment
    nodes.push(this.createCausalNode(
      'financial-mindset',
      'Align daily mindset with abundance consciousness',
      'cognitive',
      '1 week',
      []
    ));

    // Income optimization
    nodes.push(this.createCausalNode(
      'income-optimization',
      'Identify and optimize income streams',
      'behavioral',
      '2 weeks',
      ['financial-mindset']
    ));

    // Expense management
    nodes.push(this.createCausalNode(
      'expense-management',
      'Implement intelligent expense tracking and reduction',
      'behavioral',
      '1 week',
      ['financial-mindset']
    ));

    // Investment strategy
    nodes.push(this.createCausalNode(
      'investment-strategy',
      'Develop and execute investment strategy',
      'behavioral',
      '1 month',
      ['income-optimization', 'expense-management']
    ));

    // Environmental alignment
    nodes.push(this.createCausalNode(
      'financial-environment',
      'Create environment that supports financial growth',
      'environmental',
      '1 week',
      ['financial-mindset']
    ));

    // Calculate probabilities and resistance
    return nodes.map(node => ({
      ...node,
      probability: this.calculateProbability(node, context),
      resistance: this.calculateResistance(node, context)
    }));
  }

  generateMicroActions(context: AgentContext, causalMap: CausalNode[]): MicroAction[] {
    const actions: MicroAction[] = [];

    // Morning abundance ritual
    actions.push(this.createMicroAction(
      'morning-abundance-ritual',
      'Start each day with 5 minutes of abundance visualization',
      'cognitive',
      'immediate',
      []
    ));

    // Income tracking
    actions.push(this.createMicroAction(
      'income-tracking',
      'Track all income sources daily for 1 week',
      'behavioral',
      '1 week',
      []
    ));

    // Expense audit
    actions.push(this.createMicroAction(
      'expense-audit',
      'Audit last 30 days of expenses and categorize',
      'behavioral',
      '1 day',
      []
    ));

    // Abundance environment
    actions.push(this.createMicroAction(
      'abundance-environment',
      'Create a dedicated space for financial planning and visualization',
      'environmental',
      '1 day',
      []
    ));

    // Money mindset shift
    actions.push(this.createMicroAction(
      'money-mindset-shift',
      'Replace limiting money beliefs with empowering ones',
      'cognitive',
      '1 week',
      ['morning-abundance-ritual']
    ));

    // Income optimization
    actions.push(this.createMicroAction(
      'income-optimization',
      'Identify one new income stream to explore',
      'behavioral',
      '1 week',
      ['income-tracking']
    ));

    // Investment research
    actions.push(this.createMicroAction(
      'investment-research',
      'Research and select one investment option to start with',
      'behavioral',
      '2 weeks',
      ['expense-audit']
    ));

    // Calculate probabilities and resistance
    return actions.map(action => ({
      ...action,
      probability: this.calculateProbability(action, context),
      resistance: this.calculateResistance(action, context)
    }));
  }

  simulatePaths(context: AgentContext, microActions: MicroAction[]): RealityPath[] {
    const paths: RealityPath[] = [];

    // Conservative path
    paths.push({
      id: 'conservative-financial-path',
      description: 'Steady, methodical approach to financial growth',
      steps: microActions.filter(action => 
        action.id.includes('tracking') || 
        action.id.includes('audit') || 
        action.id.includes('mindset')
      ),
      totalProbability: 0.8,
      totalResistance: 0.4,
      estimatedTimeframe: '3 months',
      synchronicityTriggers: [
        'Notice unexpected financial opportunities',
        'Pay attention to money-related conversations and insights',
        'Be open to financial advice from unexpected sources'
      ]
    });

    // Aggressive path
    paths.push({
      id: 'aggressive-financial-path',
      description: 'Rapid implementation of multiple financial strategies',
      steps: microActions.filter(action => 
        action.id.includes('optimization') || 
        action.id.includes('investment') || 
        action.id.includes('environment')
      ),
      totalProbability: 0.6,
      totalResistance: 0.7,
      estimatedTimeframe: '1 month',
      synchronicityTriggers: [
        'Watch for high-impact financial opportunities',
        'Be alert to networking opportunities in finance',
        'Notice synchronicities related to wealth creation'
      ]
    });

    // Balanced path
    paths.push({
      id: 'balanced-financial-path',
      description: 'Harmonious blend of steady growth and strategic opportunities',
      steps: microActions.slice(0, 5), // First 5 actions
      totalProbability: 0.75,
      totalResistance: 0.5,
      estimatedTimeframe: '2 months',
      synchronicityTriggers: [
        'Stay open to both steady and unexpected financial opportunities',
        'Balance methodical planning with intuitive financial decisions',
        'Notice synchronicities that support sustainable wealth building'
      ]
    });

    return paths;
  }

  selectOptimalPath(paths: RealityPath[]): RealityPath {
    // Select path with best probability/resistance ratio
    return paths.reduce((best, current) => {
      const bestScore = best.totalProbability / (best.totalResistance + 0.1);
      const currentScore = current.totalProbability / (current.totalResistance + 0.1);
      return currentScore > bestScore ? current : best;
    });
  }

  deployActionPlan(optimalPath: RealityPath): AgentResult {
    const causalMap: CausalNode[] = optimalPath.steps.map(step => ({
      id: step.id,
      action: step.description,
      dependencies: step.dependencies,
      probability: step.probability || 0.7,
      resistance: step.resistance || 0.3,
      timeframe: step.timeframe,
      category: step.category
    }));

    const environmentalDirectives = [
      'Create a dedicated financial planning space in your home',
      'Set up visual reminders of your financial goals',
      'Organize your financial documents and accounts',
      'Create an abundance altar or visualization board'
    ];

    const progressIndicators = [
      'Track daily income and expense patterns',
      'Monitor mindset shifts around money',
      'Notice increased financial opportunities',
      'Observe improved money management habits'
    ];

    return {
      causalMap,
      optimalPath,
      microActions: optimalPath.steps,
      synchronicityTriggers: optimalPath.synchronicityTriggers,
      environmentalDirectives,
      progressIndicators
    };
  }

  evaluateResults(context: AgentContext, results: any): {
    progressVelocity: number;
    adjustments: CausalNode[];
    nextActions: MicroAction[];
  } {
    // Calculate progress velocity based on results
    let progressVelocity = 0.5; // Base velocity

    if (results.incomeIncrease) {
      progressVelocity += 0.2;
    }
    if (results.expenseReduction) {
      progressVelocity += 0.15;
    }
    if (results.mindsetShift) {
      progressVelocity += 0.1;
    }
    if (results.investmentStarted) {
      progressVelocity += 0.15;
    }

    // Generate adjustments based on what's working
    const adjustments: CausalNode[] = [];
    if (progressVelocity > 0.7) {
      adjustments.push(this.createCausalNode(
        'accelerate-financial-growth',
        'Increase intensity of successful financial strategies',
        'behavioral',
        '1 week',
        []
      ));
    }

    // Generate next actions
    const nextActions: MicroAction[] = [];
    if (progressVelocity < 0.5) {
      nextActions.push(this.createMicroAction(
        'financial-momentum-boost',
        'Implement additional financial momentum strategies',
        'behavioral',
        '1 week',
        []
      ));
    }

    return {
      progressVelocity: Math.min(1.0, progressVelocity),
      adjustments,
      nextActions
    };
  }

  private calculateProbability(node: CausalNode, context: AgentContext): number {
    let probability = 0.7; // Base probability for financial actions

    // Adjust based on user's financial capacity
    if (context.userProfile?.inferredPreferences?.financialCapacity === 'high') {
      probability += 0.2;
    } else if (context.userProfile?.inferredPreferences?.financialCapacity === 'low') {
      probability -= 0.1;
    }

    // Adjust based on timeframe
    if (node.timeframe === 'immediate' || node.timeframe === '1 day') {
      probability += 0.1;
    }

    return Math.max(0.3, Math.min(1.0, probability));
  }

  private calculateResistance(node: CausalNode, context: AgentContext): number {
    let resistance = 0.4; // Base resistance for financial actions

    // Financial actions can be emotionally charged
    if (context.extractedData.emotionalCharge === 'high') {
      resistance += 0.2;
    }

    // Adjust based on constraints
    if (context.extractedData.constraints?.includes('resources')) {
      resistance += 0.3;
    }

    return Math.max(0.1, Math.min(1.0, resistance));
  }
}
