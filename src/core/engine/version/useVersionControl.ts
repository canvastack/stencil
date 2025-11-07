import { useState, useCallback, useEffect } from 'react';
import { versionControl, type Commit, type FileChange } from './VersionControl';
import { useTheme } from '../ThemeContext';

export function useVersionControl() {
  const { currentThemeName } = useTheme();
  const [stagedChanges, setStagedChanges] = useState<FileChange[]>([]);
  const [history, setHistory] = useState<Commit[]>([]);
  const [currentCommit, setCurrentCommit] = useState<string | null>(null);

  const refreshState = useCallback(() => {
    if (!currentThemeName) return;
    
    setStagedChanges(versionControl.getStagedChanges(currentThemeName));
    setHistory(versionControl.getCommitHistory(currentThemeName));
    
    const stats = versionControl.getStats(currentThemeName);
    setCurrentCommit(stats.currentCommit);
  }, [currentThemeName]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const stageChange = useCallback((change: FileChange) => {
    if (!currentThemeName) return;
    
    versionControl.stageChange(currentThemeName, change);
    refreshState();
  }, [currentThemeName, refreshState]);

  const unstageChange = useCallback((filePath: string) => {
    if (!currentThemeName) return;
    
    versionControl.unstageChange(currentThemeName, filePath);
    refreshState();
  }, [currentThemeName, refreshState]);

  const commit = useCallback((message: string, author: string = 'User') => {
    if (!currentThemeName) throw new Error('No theme selected');
    
    const newCommit = versionControl.commit(currentThemeName, message, author);
    refreshState();
    
    return newCommit;
  }, [currentThemeName, refreshState]);

  const rollback = useCallback((commitId: string) => {
    if (!currentThemeName) throw new Error('No theme selected');
    
    const commit = versionControl.rollback(currentThemeName, commitId);
    refreshState();
    
    return commit;
  }, [currentThemeName, refreshState]);

  const getDiff = useCallback((commitId1: string, commitId2: string) => {
    if (!currentThemeName) throw new Error('No theme selected');
    
    return versionControl.getDiff(currentThemeName, commitId1, commitId2);
  }, [currentThemeName]);

  const createBranch = useCallback((branchName: string) => {
    if (!currentThemeName) throw new Error('No theme selected');
    
    versionControl.createBranch(currentThemeName, branchName);
    refreshState();
  }, [currentThemeName, refreshState]);

  const switchBranch = useCallback((branchName: string) => {
    if (!currentThemeName) throw new Error('No theme selected');
    
    versionControl.switchBranch(currentThemeName, branchName);
    refreshState();
  }, [currentThemeName, refreshState]);

  const getBranches = useCallback(() => {
    if (!currentThemeName) return [];
    
    return versionControl.getBranches(currentThemeName);
  }, [currentThemeName]);

  const getCurrentBranch = useCallback(() => {
    if (!currentThemeName) return 'main';
    
    return versionControl.getCurrentBranch(currentThemeName);
  }, [currentThemeName]);

  const exportHistory = useCallback(() => {
    if (!currentThemeName) throw new Error('No theme selected');
    
    return versionControl.exportHistory(currentThemeName);
  }, [currentThemeName]);

  const importHistory = useCallback((data: string) => {
    if (!currentThemeName) throw new Error('No theme selected');
    
    versionControl.importHistory(currentThemeName, data);
    refreshState();
  }, [currentThemeName, refreshState]);

  const getStats = useCallback(() => {
    if (!currentThemeName) {
      return {
        totalCommits: 0,
        totalBranches: 0,
        currentCommit: null,
        stagedChanges: 0
      };
    }
    
    return versionControl.getStats(currentThemeName);
  }, [currentThemeName]);

  return {
    stagedChanges,
    history,
    currentCommit,
    stageChange,
    unstageChange,
    commit,
    rollback,
    getDiff,
    createBranch,
    switchBranch,
    getBranches,
    getCurrentBranch,
    exportHistory,
    importHistory,
    getStats,
    refreshState
  };
}
