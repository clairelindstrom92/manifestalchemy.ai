import { CausalNode } from './manifestationEngine';
import { MicroAction } from './agents/baseAgent';

export interface ActionSequence {
  id: string;
  title: string;
  description: string;
  actions: ExecutableAction[];
  estimatedDuration: string;
  priority: 'high' | 'medium' | 'low';
  category: 'environmental' | 'behavioral' | 'cognitive' | 'energetic';
}

export interface ExecutableAction {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  timeframe: string;
  category: 'environmental' | 'behavioral' | 'cognitive' | 'energetic';
  dependencies: string[];
  dopamineTrigger: string;
  synchronicityTrigger: string;
  progressIndicator: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
}

export interface EnvironmentalDirective {
  id: string;
  description: string;
  category: 'physical' | 'digital' | 'social' | 'energetic';
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
}

export interface ProgressTracker {
  actionId: string;
  milestones: {
    id: string;
    description: string;
    completed: boolean;
    completedAt?: Date;
  }[];
  velocity: number;
  lastUpdated: Date;
}

export class ActionDeployer {
  private readonly dopamineTriggers = [
    'Feel the immediate satisfaction of taking this action',
    'Notice the positive shift in your energy after completing this step',
    'Celebrate this small win and build momentum',
    'Experience the alignment as you take this action',
    'Feel the satisfaction of progress toward your manifestation',
    'Notice how this action brings you closer to your goal',
    'Experience the joy of taking aligned action',
    'Feel the power of moving forward with intention'
  ];

  private readonly synchronicityTriggers = [
    'Notice unexpected opportunities related to this action',
    'Pay attention to signs and signals in your environment',
    'Be open to serendipitous encounters and connections',
    'Watch for meaningful coincidences',
    'Stay alert to synchronicities that support this path',
    'Notice how the universe responds to your action',
    'Be open to unexpected support and resources',
    'Pay attention to intuitive guidance'
  ];

  /**
   * Convert causal maps into executable action sequences
   */
  deployActionPlan(causalMap: CausalNode[]): ActionSequence[] {
    const sequences: ActionSequence[] = [];

    // Group causal nodes by category
    const categories = this.groupByCategory(causalMap);

    // Create action sequence for each category
    for (const [category, nodes] of Object.entries(categories)) {
      const sequence = this.createActionSequence(category, nodes);
      sequences.push(sequence);
    }

    // Sort sequences by priority
    return sequences.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate environmental realignment directives
   */
  generateEnvironmentalDirectives(causalMap: CausalNode[]): EnvironmentalDirective[] {
    const directives: EnvironmentalDirective[] = [];

    // Extract environmental nodes
    const environmentalNodes = causalMap.filter(node => node.category === 'environmental');

    for (const node of environmentalNodes) {
      const directive = this.createEnvironmentalDirective(node);
      directives.push(directive);
    }

    // Add general environmental directives
    directives.push({
      id: 'general-environmental-alignment',
      description: 'Create a manifestation-supporting environment',
      category: 'physical',
      priority: 'high',
      timeframe: '1 week'
    });

    return directives;
  }

  /**
   * Create progress tracking system for actions
   */
  createProgressTracker(actionId: string, action: ExecutableAction): ProgressTracker {
    const milestones = this.generateMilestones(action);
    
    return {
      actionId,
      milestones,
      velocity: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Generate dopamine-linked feedback triggers
   */
  generateDopamineTriggers(action: ExecutableAction): string[] {
    const triggers: string[] = [];

    // Add primary dopamine trigger
    triggers.push(this.getRandomDopamineTrigger());

    // Add category-specific triggers
    switch (action.category) {
      case 'environmental':
        triggers.push('Notice how your environment now supports your goals');
        break;
      case 'behavioral':
        triggers.push('Feel the satisfaction of building new positive habits');
        break;
      case 'cognitive':
        triggers.push('Experience the clarity that comes from this mental shift');
        break;
      case 'energetic':
        triggers.push('Feel the alignment and flow in your energy');
        break;
    }

    return triggers;
  }

  /**
   * Generate synchronicity triggers for actions
   */
  generateSynchronicityTriggers(action: ExecutableAction): string[] {
    const triggers: string[] = [];

    // Add primary synchronicity trigger
    triggers.push(this.getRandomSynchronicityTrigger());

    // Add category-specific triggers
    switch (action.category) {
      case 'environmental':
        triggers.push('Notice how your environment begins to reflect your desires');
        break;
      case 'behavioral':
        triggers.push('Be open to opportunities that align with your new behaviors');
        break;
      case 'cognitive':
        triggers.push('Pay attention to insights and realizations that emerge');
        break;
      case 'energetic':
        triggers.push('Notice the energetic shifts and synchronicities around you');
        break;
    }

    return triggers;
  }

  // Private helper methods

  private groupByCategory(causalMap: CausalNode[]): Record<string, CausalNode[]> {
    const categories: Record<string, CausalNode[]> = {};

    for (const node of causalMap) {
      if (!categories[node.category]) {
        categories[node.category] = [];
      }
      categories[node.category].push(node);
    }

    return categories;
  }

  private createActionSequence(category: string, nodes: CausalNode[]): ActionSequence {
    const actions = nodes.map(node => this.convertToExecutableAction(node));
    
    return {
      id: `${category}-sequence`,
      title: this.getCategoryTitle(category),
      description: this.getCategoryDescription(category),
      actions,
      estimatedDuration: this.calculateSequenceDuration(actions),
      priority: this.calculateSequencePriority(actions),
      category: category as 'environmental' | 'behavioral' | 'cognitive' | 'energetic'
    };
  }

  private convertToExecutableAction(node: CausalNode): ExecutableAction {
    return {
      id: node.id,
      title: this.generateActionTitle(node),
      description: node.action,
      instructions: this.generateInstructions(node),
      timeframe: node.timeframe,
      category: node.category,
      dependencies: node.dependencies,
      dopamineTrigger: this.getRandomDopamineTrigger(),
      synchronicityTrigger: this.getRandomSynchronicityTrigger(),
      progressIndicator: this.generateProgressIndicator(node),
      difficulty: this.calculateDifficulty(node),
      estimatedTime: this.estimateActionTime(node)
    };
  }

  private createEnvironmentalDirective(node: CausalNode): EnvironmentalDirective {
    return {
      id: node.id,
      description: node.action,
      category: this.mapToEnvironmentalCategory(node.category),
      priority: this.calculatePriority(node),
      timeframe: node.timeframe
    };
  }

  private generateMilestones(action: ExecutableAction): {
    id: string;
    description: string;
    completed: boolean;
    completedAt?: Date;
  }[] {
    const milestones = [];

    // Start milestone
    milestones.push({
      id: `${action.id}-start`,
      description: `Begin ${action.title}`,
      completed: false
    });

    // Progress milestones based on timeframe
    if (action.timeframe === '1 week' || action.timeframe === '2 weeks') {
      milestones.push({
        id: `${action.id}-midpoint`,
        description: `Complete halfway point of ${action.title}`,
        completed: false
      });
    }

    // Completion milestone
    milestones.push({
      id: `${action.id}-complete`,
      description: `Complete ${action.title}`,
      completed: false
    });

    return milestones;
  }

  private getCategoryTitle(category: string): string {
    const titles = {
      environmental: 'Environmental Alignment',
      behavioral: 'Behavioral Transformation',
      cognitive: 'Cognitive Shifts',
      energetic: 'Energetic Alignment'
    };
    return titles[category as keyof typeof titles] || 'Action Sequence';
  }

  private getCategoryDescription(category: string): string {
    const descriptions = {
      environmental: 'Actions to align your physical and digital environment with your manifestation goals',
      behavioral: 'Actions to transform your daily habits and behaviors',
      cognitive: 'Actions to shift your mindset and thought patterns',
      energetic: 'Actions to align your energy and vibration with your desires'
    };
    return descriptions[category as keyof typeof descriptions] || 'Action sequence for manifestation';
  }

  private calculateSequenceDuration(actions: ExecutableAction[]): string {
    const totalDays = actions.reduce((total, action) => {
      const days = this.parseTimeframeToDays(action.timeframe);
      return total + days;
    }, 0);

    if (totalDays <= 7) return '1 week';
    if (totalDays <= 14) return '2 weeks';
    if (totalDays <= 30) return '1 month';
    return '2 months';
  }

  private calculateSequencePriority(actions: ExecutableAction[]): 'high' | 'medium' | 'low' {
    const highPriorityCount = actions.filter(action => action.difficulty === 'easy').length;
    const totalActions = actions.length;

    if (highPriorityCount / totalActions > 0.7) return 'high';
    if (highPriorityCount / totalActions > 0.4) return 'medium';
    return 'low';
  }

  private generateActionTitle(node: CausalNode): string {
    // Convert action description to a title
    return node.action.charAt(0).toUpperCase() + node.action.slice(1);
  }

  private generateInstructions(node: CausalNode): string[] {
    const instructions = [];

    // Base instruction
    instructions.push(node.action);

    // Add category-specific instructions
    switch (node.category) {
      case 'environmental':
        instructions.push('Set up your environment to support this action');
        instructions.push('Create visual reminders and cues');
        break;
      case 'behavioral':
        instructions.push('Start with small, manageable steps');
        instructions.push('Track your progress daily');
        break;
      case 'cognitive':
        instructions.push('Practice this mindset shift daily');
        instructions.push('Notice when old patterns arise');
        break;
      case 'energetic':
        instructions.push('Connect with the feeling of this action');
        instructions.push('Visualize the desired outcome');
        break;
    }

    return instructions;
  }

  private generateProgressIndicator(node: CausalNode): string {
    const indicators = {
      environmental: 'Notice changes in your environment',
      behavioral: 'Track your daily progress',
      cognitive: 'Monitor your thought patterns',
      energetic: 'Feel the shift in your energy'
    };
    return indicators[node.category] || 'Track your progress';
  }

  private calculateDifficulty(node: CausalNode): 'easy' | 'medium' | 'hard' {
    if (node.resistance < 0.3) return 'easy';
    if (node.resistance < 0.6) return 'medium';
    return 'hard';
  }

  private estimateActionTime(node: CausalNode): string {
    if (node.timeframe === 'immediate' || node.timeframe === '1 day') return '5-15 minutes';
    if (node.timeframe === '1 week') return '10-30 minutes daily';
    if (node.timeframe === '2 weeks') return '15-45 minutes daily';
    if (node.timeframe === '1 month') return '20-60 minutes daily';
    return '30-90 minutes daily';
  }

  private mapToEnvironmentalCategory(category: string): 'physical' | 'digital' | 'social' | 'energetic' {
    const mapping = {
      environmental: 'physical' as const,
      behavioral: 'social' as const,
      cognitive: 'digital' as const,
      energetic: 'energetic' as const
    };
    return mapping[category as keyof typeof mapping] || 'physical';
  }

  private calculatePriority(node: CausalNode): 'high' | 'medium' | 'low' {
    if (node.probability > 0.8 && node.resistance < 0.3) return 'high';
    if (node.probability > 0.6 && node.resistance < 0.5) return 'medium';
    return 'low';
  }

  private parseTimeframeToDays(timeframe: string): number {
    const timeframeMap = {
      'immediate': 0,
      '1 day': 1,
      '1 week': 7,
      '2 weeks': 14,
      '1 month': 30,
      '3 months': 90
    };
    return timeframeMap[timeframe as keyof typeof timeframeMap] || 7;
  }

  private getRandomDopamineTrigger(): string {
    return this.dopamineTriggers[Math.floor(Math.random() * this.dopamineTriggers.length)];
  }

  private getRandomSynchronicityTrigger(): string {
    return this.synchronicityTriggers[Math.floor(Math.random() * this.synchronicityTriggers.length)];
  }
}
