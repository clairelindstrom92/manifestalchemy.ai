interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  source: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep only last 1000 logs

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private addLog(level: LogEntry['level'], message: string, data?: any, source: string = 'app') {
    const log: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      data,
      source
    };

    this.logs.push(log);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console for development
    console[level === 'debug' ? 'log' : level](`[${source}] ${message}`, data || '');

    // Save to localStorage
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem('manifestalchemy-logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  }

  info(message: string, data?: any, source?: string) {
    this.addLog('info', message, data, source);
  }

  warn(message: string, data?: any, source?: string) {
    this.addLog('warn', message, data, source);
  }

  error(message: string, data?: any, source?: string) {
    this.addLog('error', message, data, source);
  }

  debug(message: string, data?: any, source?: string) {
    this.addLog('debug', message, data, source);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('manifestalchemy-logs');
  }
}

// Create a singleton instance
export const logger = new Logger();

// Export the LogEntry type for use in components
export type { LogEntry };
