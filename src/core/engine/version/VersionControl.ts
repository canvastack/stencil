interface FileChange {
  path: string;
  oldContent: string | null;
  newContent: string | null;
  status: 'added' | 'modified' | 'deleted';
}

interface Commit {
  id: string;
  message: string;
  author: string;
  timestamp: number;
  changes: FileChange[];
  parentId: string | null;
  themeName: string;
}

interface VersionState {
  currentCommitId: string | null;
  commits: Map<string, Commit>;
  branches: Map<string, string>;
  currentBranch: string;
  stagedChanges: FileChange[];
}

class VersionControl {
  private states: Map<string, VersionState> = new Map();

  private generateCommitId(): string {
    return `commit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getState(themeName: string): VersionState {
    if (!this.states.has(themeName)) {
      this.states.set(themeName, {
        currentCommitId: null,
        commits: new Map(),
        branches: new Map([['main', null as any]]),
        currentBranch: 'main',
        stagedChanges: []
      });
    }
    return this.states.get(themeName)!;
  }

  stageChange(themeName: string, change: FileChange): void {
    const state = this.getState(themeName);
    
    const existingIndex = state.stagedChanges.findIndex(c => c.path === change.path);
    if (existingIndex >= 0) {
      state.stagedChanges[existingIndex] = change;
    } else {
      state.stagedChanges.push(change);
    }
  }

  unstageChange(themeName: string, filePath: string): void {
    const state = this.getState(themeName);
    state.stagedChanges = state.stagedChanges.filter(c => c.path !== filePath);
  }

  getStagedChanges(themeName: string): FileChange[] {
    return this.getState(themeName).stagedChanges;
  }

  commit(themeName: string, message: string, author: string = 'System'): Commit {
    const state = this.getState(themeName);
    
    if (state.stagedChanges.length === 0) {
      throw new Error('No changes to commit');
    }

    const commitId = this.generateCommitId();
    const commit: Commit = {
      id: commitId,
      message,
      author,
      timestamp: Date.now(),
      changes: [...state.stagedChanges],
      parentId: state.currentCommitId,
      themeName
    };

    state.commits.set(commitId, commit);
    state.currentCommitId = commitId;
    state.branches.set(state.currentBranch, commitId);
    state.stagedChanges = [];

    return commit;
  }

  getCommit(themeName: string, commitId: string): Commit | undefined {
    const state = this.getState(themeName);
    return state.commits.get(commitId);
  }

  getCommitHistory(themeName: string, limit: number = 50): Commit[] {
    const state = this.getState(themeName);
    const history: Commit[] = [];
    
    let currentId = state.currentCommitId;
    let count = 0;

    while (currentId && count < limit) {
      const commit = state.commits.get(currentId);
      if (!commit) break;
      
      history.push(commit);
      currentId = commit.parentId;
      count++;
    }

    return history;
  }

  rollback(themeName: string, commitId: string): Commit {
    const state = this.getState(themeName);
    const commit = state.commits.get(commitId);
    
    if (!commit) {
      throw new Error(`Commit ${commitId} not found`);
    }

    state.currentCommitId = commitId;
    state.branches.set(state.currentBranch, commitId);
    
    return commit;
  }

  createBranch(themeName: string, branchName: string): void {
    const state = this.getState(themeName);
    
    if (state.branches.has(branchName)) {
      throw new Error(`Branch ${branchName} already exists`);
    }

    state.branches.set(branchName, state.currentCommitId);
  }

  switchBranch(themeName: string, branchName: string): void {
    const state = this.getState(themeName);
    
    if (!state.branches.has(branchName)) {
      throw new Error(`Branch ${branchName} not found`);
    }

    state.currentBranch = branchName;
    state.currentCommitId = state.branches.get(branchName) || null;
  }

  getBranches(themeName: string): string[] {
    return Array.from(this.getState(themeName).branches.keys());
  }

  getCurrentBranch(themeName: string): string {
    return this.getState(themeName).currentBranch;
  }

  getDiff(themeName: string, commitId1: string, commitId2: string): FileChange[] {
    const state = this.getState(themeName);
    const commit1 = state.commits.get(commitId1);
    const commit2 = state.commits.get(commitId2);

    if (!commit1 || !commit2) {
      throw new Error('One or both commits not found');
    }

    const allFiles = new Set([
      ...commit1.changes.map(c => c.path),
      ...commit2.changes.map(c => c.path)
    ]);

    const diffs: FileChange[] = [];

    allFiles.forEach(filePath => {
      const change1 = commit1.changes.find(c => c.path === filePath);
      const change2 = commit2.changes.find(c => c.path === filePath);

      if (!change1 && change2) {
        diffs.push(change2);
      } else if (change1 && !change2) {
        diffs.push({
          path: filePath,
          oldContent: change1.newContent,
          newContent: null,
          status: 'deleted'
        });
      } else if (change1 && change2 && change1.newContent !== change2.newContent) {
        diffs.push({
          path: filePath,
          oldContent: change1.newContent,
          newContent: change2.newContent,
          status: 'modified'
        });
      }
    });

    return diffs;
  }

  exportHistory(themeName: string): string {
    const state = this.getState(themeName);
    const exportData = {
      currentCommitId: state.currentCommitId,
      commits: Array.from(state.commits.entries()),
      branches: Array.from(state.branches.entries()),
      currentBranch: state.currentBranch,
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  importHistory(themeName: string, exportedData: string): void {
    try {
      const data = JSON.parse(exportedData);
      const state = this.getState(themeName);

      state.currentCommitId = data.currentCommitId;
      state.commits = new Map(data.commits);
      state.branches = new Map(data.branches);
      state.currentBranch = data.currentBranch;
    } catch (error) {
      throw new Error('Failed to import version history: ' + (error as Error).message);
    }
  }

  reset(themeName: string): void {
    this.states.delete(themeName);
  }

  getStats(themeName: string): {
    totalCommits: number;
    totalBranches: number;
    currentCommit: string | null;
    stagedChanges: number;
  } {
    const state = this.getState(themeName);
    
    return {
      totalCommits: state.commits.size,
      totalBranches: state.branches.size,
      currentCommit: state.currentCommitId,
      stagedChanges: state.stagedChanges.length
    };
  }
}

export const versionControl = new VersionControl();
export type { Commit, FileChange, VersionState };
export default versionControl;
