import { ManifestationProject, ConversationMessage } from "../types";

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  get length(): number;
}

export class StateMemory {
  private adapter: StorageAdapter;
  private userId: string;

  constructor(adapter: StorageAdapter, userId: string) {
    this.adapter = adapter;
    this.userId = userId;
  }

  private getKey(type: 'project' | 'conversation', id?: string): string {
    return `manifest_alchemy_${this.userId}_${type}${id ? `_${id}` : ''}`;
  }

  public saveProject(project: ManifestationProject): void {
    const key = this.getKey('project', project.id);
    this.adapter.setItem(key, JSON.stringify(project));
  }

  public loadProject(projectId: string): ManifestationProject | null {
    const key = this.getKey('project', projectId);
    const data = this.adapter.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  public loadAllProjects(): ManifestationProject[] {
    const projects: ManifestationProject[] = [];
    const prefix = this.getKey('project');
    
    for (let i = 0; i < this.adapter.length; i++) {
      const key = this.adapter.key(i);
      if (key && key.startsWith(prefix)) {
        const data = this.adapter.getItem(key);
        if (data) {
          try {
            projects.push(JSON.parse(data));
          } catch (error) {
            console.error('Error parsing project data:', error);
          }
        }
      }
    }
    return projects;
  }

  public saveConversationHistory(manifestationId: string, history: ConversationMessage[]): void {
    const key = this.getKey('conversation', manifestationId);
    this.adapter.setItem(key, JSON.stringify(history));
  }

  public loadConversationHistory(manifestationId: string): ConversationMessage[] | null {
    const key = this.getKey('conversation', manifestationId);
    const data = this.adapter.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  public clearAllData(): void {
    const prefix = `manifest_alchemy_${this.userId}_`;
    for (let i = this.adapter.length - 1; i >= 0; i--) {
      const key = this.adapter.key(i);
      if (key && key.startsWith(prefix)) {
        this.adapter.removeItem(key);
      }
    }
  }
}