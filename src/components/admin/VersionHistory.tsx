import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  GitBranch, 
  GitCommit, 
  RotateCcw, 
  Download, 
  Upload,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useVersionControl } from '@/core/engine/version';
import type { Commit } from '@/core/engine/version';
import { formatDistanceToNow } from 'date-fns';

export function VersionHistory() {
  const {
    history,
    currentCommit,
    stagedChanges,
    rollback,
    exportHistory,
    importHistory,
    getStats
  } = useVersionControl();

  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');
  const [rollbackStatus, setRollbackStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const stats = getStats();

  const handleRollback = async (commitId: string) => {
    try {
      await rollback(commitId);
      setRollbackStatus({
        type: 'success',
        message: `Successfully rolled back to commit ${commitId.slice(0, 8)}`
      });
      setTimeout(() => setRollbackStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      setRollbackStatus({
        type: 'error',
        message: `Failed to rollback: ${(error as Error).message}`
      });
    }
  };

  const handleExport = () => {
    const data = exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-history-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      importHistory(importData);
      setShowImport(false);
      setImportData('');
      setRollbackStatus({
        type: 'success',
        message: 'Version history imported successfully'
      });
    } catch (error) {
      setRollbackStatus({
        type: 'error',
        message: `Failed to import: ${(error as Error).message}`
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </CardTitle>
              <CardDescription>
                Track and manage theme changes with git-like version control
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showImport && (
            <div className="mb-4 p-4 border rounded-md bg-gray-50">
              <label className="block text-sm font-medium mb-2">Import History JSON</label>
              <textarea
                className="w-full h-32 p-2 border rounded font-mono text-sm"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste exported history JSON here..."
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleImport}>Import</Button>
                <Button size="sm" variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {rollbackStatus.type && (
            <Alert variant={rollbackStatus.type === 'error' ? 'destructive' : 'default'} className="mb-4">
              {rollbackStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{rollbackStatus.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 border rounded-md bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCommits}</div>
              <div className="text-sm text-blue-700">Total Commits</div>
            </div>
            <div className="p-4 border rounded-md bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">{stats.totalBranches}</div>
              <div className="text-sm text-purple-700">Branches</div>
            </div>
            <div className="p-4 border rounded-md bg-orange-50">
              <div className="text-2xl font-bold text-orange-600">{stats.stagedChanges}</div>
              <div className="text-sm text-orange-700">Staged Changes</div>
            </div>
            <div className="p-4 border rounded-md bg-green-50">
              <div className="text-2xl font-bold text-green-600">
                {currentCommit ? currentCommit.slice(0, 8) : 'None'}
              </div>
              <div className="text-sm text-green-700">Current Commit</div>
            </div>
          </div>

          <Separator className="my-4" />

          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GitCommit className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No commits yet</p>
                  <p className="text-sm">Make changes and commit to start tracking history</p>
                </div>
              ) : (
                history.map((commit) => (
                  <CommitItem
                    key={commit.id}
                    commit={commit}
                    isActive={commit.id === currentCommit}
                    isSelected={commit.id === selectedCommit}
                    onSelect={() => setSelectedCommit(commit.id)}
                    onRollback={() => handleRollback(commit.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

interface CommitItemProps {
  commit: Commit;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRollback: () => void;
}

function CommitItem({ commit, isActive, isSelected, onSelect, onRollback }: CommitItemProps) {
  const timeAgo = formatDistanceToNow(new Date(commit.timestamp), { addSuffix: true });

  return (
    <div
      className={`p-4 border rounded-md cursor-pointer transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : isActive
          ? 'border-green-500 bg-green-50'
          : 'hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <GitCommit className="h-4 w-4 text-gray-500" />
            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {commit.id.slice(0, 8)}
            </code>
            {isActive && (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                Current
              </Badge>
            )}
          </div>
          
          <p className="font-medium mb-2">{commit.message}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {commit.author}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {timeAgo}
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {commit.changes.length} file{commit.changes.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {!isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onRollback();
            }}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Rollback
          </Button>
        )}
      </div>
      
      {isSelected && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm font-medium mb-2">Changes:</p>
          <div className="space-y-1">
            {commit.changes.map((change, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Badge 
                  variant="outline" 
                  className={`
                    ${change.status === 'added' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    ${change.status === 'modified' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                    ${change.status === 'deleted' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                  `}
                >
                  {change.status}
                </Badge>
                <code className="text-xs">{change.path}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
