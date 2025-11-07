export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'context';
  oldLine: number | null;
  newLine: number | null;
  content: string;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export function generateDiff(oldContent: string, newContent: string): DiffHunk[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  const hunks: DiffHunk[] = [];
  const contextLines = 3;
  
  const changes = computeLCS(oldLines, newLines);
  const diffLines: DiffLine[] = [];
  
  let oldLineNum = 1;
  let newLineNum = 1;
  
  for (const change of changes) {
    if (change.type === 'unchanged') {
      diffLines.push({
        type: 'unchanged',
        oldLine: oldLineNum,
        newLine: newLineNum,
        content: change.content
      });
      oldLineNum++;
      newLineNum++;
    } else if (change.type === 'removed') {
      diffLines.push({
        type: 'removed',
        oldLine: oldLineNum,
        newLine: null,
        content: change.content
      });
      oldLineNum++;
    } else if (change.type === 'added') {
      diffLines.push({
        type: 'added',
        oldLine: null,
        newLine: newLineNum,
        content: change.content
      });
      newLineNum++;
    }
  }
  
  const groupedHunks = groupDiffLines(diffLines, contextLines);
  
  return groupedHunks;
}

interface Change {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

function computeLCS(oldLines: string[], newLines: string[]): Change[] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const changes: Change[] = [];
  let i = m;
  let j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      changes.unshift({
        type: 'unchanged',
        content: oldLines[i - 1]
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      changes.unshift({
        type: 'added',
        content: newLines[j - 1]
      });
      j--;
    } else if (i > 0) {
      changes.unshift({
        type: 'removed',
        content: oldLines[i - 1]
      });
      i--;
    }
  }
  
  return changes;
}

function groupDiffLines(diffLines: DiffLine[], contextLines: number): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffLine[] = [];
  let lastChangeIndex = -1;
  
  for (let i = 0; i < diffLines.length; i++) {
    const line = diffLines[i];
    
    if (line.type !== 'unchanged') {
      if (lastChangeIndex >= 0 && i - lastChangeIndex > contextLines * 2) {
        if (currentHunk.length > 0) {
          hunks.push(createHunk(currentHunk));
          currentHunk = [];
        }
      }
      
      const start = Math.max(0, i - contextLines);
      const end = Math.min(diffLines.length, i + contextLines + 1);
      
      for (let j = start; j < end; j++) {
        if (!currentHunk.includes(diffLines[j])) {
          currentHunk.push(diffLines[j]);
        }
      }
      
      lastChangeIndex = i;
    }
  }
  
  if (currentHunk.length > 0) {
    hunks.push(createHunk(currentHunk));
  }
  
  return hunks;
}

function createHunk(lines: DiffLine[]): DiffHunk {
  const oldStart = lines.find(l => l.oldLine !== null)?.oldLine || 1;
  const newStart = lines.find(l => l.newLine !== null)?.newLine || 1;
  const oldLines = lines.filter(l => l.oldLine !== null).length;
  const newLines = lines.filter(l => l.newLine !== null).length;
  
  return {
    oldStart,
    oldLines,
    newStart,
    newLines,
    lines: lines.sort((a, b) => {
      const aNum = a.oldLine || a.newLine || 0;
      const bNum = b.oldLine || b.newLine || 0;
      return aNum - bNum;
    })
  };
}

export function formatDiffStats(added: number, removed: number): string {
  const total = added + removed;
  const addedPercent = total > 0 ? Math.round((added / total) * 100) : 0;
  const removedPercent = total > 0 ? Math.round((removed / total) * 100) : 0;
  
  return `+${added} -${removed} (${addedPercent}% added, ${removedPercent}% removed)`;
}

export function getChangeSummary(hunks: DiffHunk[]): { added: number; removed: number; changed: number } {
  let added = 0;
  let removed = 0;
  let changed = 0;
  
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.type === 'added') added++;
      else if (line.type === 'removed') removed++;
      else if (line.type === 'unchanged') changed++;
    }
  }
  
  return { added, removed, changed };
}
