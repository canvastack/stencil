type HookCallback = (...args: any[]) => any;

interface HookEntry {
  callback: HookCallback;
  priority: number;
  id: string;
}

interface HookRegistry {
  actions: Map<string, HookEntry[]>;
  filters: Map<string, HookEntry[]>;
}

class HookSystem {
  private registry: HookRegistry = {
    actions: new Map(),
    filters: new Map()
  };

  private nextId = 0;

  private generateId(): string {
    return `hook_${this.nextId++}_${Date.now()}`;
  }

  addAction(hookName: string, callback: HookCallback, priority: number = 10): string {
    if (!this.registry.actions.has(hookName)) {
      this.registry.actions.set(hookName, []);
    }

    const id = this.generateId();
    const hooks = this.registry.actions.get(hookName)!;
    
    hooks.push({ callback, priority, id });
    hooks.sort((a, b) => a.priority - b.priority);

    return id;
  }

  addFilter(hookName: string, callback: HookCallback, priority: number = 10): string {
    if (!this.registry.filters.has(hookName)) {
      this.registry.filters.set(hookName, []);
    }

    const id = this.generateId();
    const hooks = this.registry.filters.get(hookName)!;
    
    hooks.push({ callback, priority, id });
    hooks.sort((a, b) => a.priority - b.priority);

    return id;
  }

  removeAction(hookName: string, idOrCallback: string | HookCallback): boolean {
    const hooks = this.registry.actions.get(hookName);
    if (!hooks) return false;

    const initialLength = hooks.length;
    
    if (typeof idOrCallback === 'string') {
      const filtered = hooks.filter(h => h.id !== idOrCallback);
      this.registry.actions.set(hookName, filtered);
    } else {
      const filtered = hooks.filter(h => h.callback !== idOrCallback);
      this.registry.actions.set(hookName, filtered);
    }

    return hooks.length !== initialLength;
  }

  removeFilter(hookName: string, idOrCallback: string | HookCallback): boolean {
    const hooks = this.registry.filters.get(hookName);
    if (!hooks) return false;

    const initialLength = hooks.length;
    
    if (typeof idOrCallback === 'string') {
      const filtered = hooks.filter(h => h.id !== idOrCallback);
      this.registry.filters.set(hookName, filtered);
    } else {
      const filtered = hooks.filter(h => h.callback !== idOrCallback);
      this.registry.filters.set(hookName, filtered);
    }

    return hooks.length !== initialLength;
  }

  doAction(hookName: string, ...args: any[]): void {
    const hooks = this.registry.actions.get(hookName);
    if (!hooks || hooks.length === 0) return;

    for (const hook of hooks) {
      try {
        hook.callback(...args);
      } catch (error) {
        console.error(`Error executing action hook '${hookName}':`, error);
      }
    }
  }

  applyFilters<T = any>(hookName: string, value: T, ...args: any[]): T {
    const hooks = this.registry.filters.get(hookName);
    if (!hooks || hooks.length === 0) return value;

    let filteredValue = value;

    for (const hook of hooks) {
      try {
        filteredValue = hook.callback(filteredValue, ...args);
      } catch (error) {
        console.error(`Error executing filter hook '${hookName}':`, error);
      }
    }

    return filteredValue;
  }

  hasAction(hookName: string): boolean {
    return this.registry.actions.has(hookName) && 
           this.registry.actions.get(hookName)!.length > 0;
  }

  hasFilter(hookName: string): boolean {
    return this.registry.filters.has(hookName) && 
           this.registry.filters.get(hookName)!.length > 0;
  }

  removeAllActions(hookName?: string): void {
    if (hookName) {
      this.registry.actions.delete(hookName);
    } else {
      this.registry.actions.clear();
    }
  }

  removeAllFilters(hookName?: string): void {
    if (hookName) {
      this.registry.filters.delete(hookName);
    } else {
      this.registry.filters.clear();
    }
  }

  getActionCount(hookName: string): number {
    return this.registry.actions.get(hookName)?.length || 0;
  }

  getFilterCount(hookName: string): number {
    return this.registry.filters.get(hookName)?.length || 0;
  }

  getRegisteredActions(): string[] {
    return Array.from(this.registry.actions.keys());
  }

  getRegisteredFilters(): string[] {
    return Array.from(this.registry.filters.keys());
  }

  debugHooks(): void {
    console.group('Hook System Debug');
    console.log('Registered Actions:', this.getRegisteredActions());
    console.log('Registered Filters:', this.getRegisteredFilters());
    
    this.registry.actions.forEach((hooks, name) => {
      console.log(`Action '${name}':`, hooks.length, 'callbacks');
    });
    
    this.registry.filters.forEach((hooks, name) => {
      console.log(`Filter '${name}':`, hooks.length, 'callbacks');
    });
    console.groupEnd();
  }
}

export const hookSystem = new HookSystem();

export const addAction = hookSystem.addAction.bind(hookSystem);
export const addFilter = hookSystem.addFilter.bind(hookSystem);
export const removeAction = hookSystem.removeAction.bind(hookSystem);
export const removeFilter = hookSystem.removeFilter.bind(hookSystem);
export const doAction = hookSystem.doAction.bind(hookSystem);
export const applyFilters = hookSystem.applyFilters.bind(hookSystem);
export const hasAction = hookSystem.hasAction.bind(hookSystem);
export const hasFilter = hookSystem.hasFilter.bind(hookSystem);
export const removeAllActions = hookSystem.removeAllActions.bind(hookSystem);
export const removeAllFilters = hookSystem.removeAllFilters.bind(hookSystem);

export default hookSystem;
