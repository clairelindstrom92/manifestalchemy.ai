import { StorageAdapter } from "../stateMemory";

export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }

  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  removeItem(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  key(index: number): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.key(index);
    }
    return null;
  }

  get length(): number {
    if (typeof window !== 'undefined') {
      return localStorage.length;
    }
    return 0;
  }
}