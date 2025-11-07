import React, { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

interface FileTreeExplorerProps {
  files: FileNode[];
  selectedFile?: string | null;
  onFileSelect?: (file: FileNode) => void;
  onFileUpload?: (files: FileList, targetPath?: string) => void;
  onFileMove?: (sourcePath: string, targetPath: string) => void;
  className?: string;
}

export interface FileTreeExplorerRef {
  expandAll: () => void;
  collapseAll: () => void;
  refresh: () => void;
}

export const FileTreeExplorer = forwardRef<FileTreeExplorerRef, FileTreeExplorerProps>(({ 
  files, 
  selectedFile, 
  onFileSelect,
  onFileUpload,
  onFileMove,
  className 
}, ref) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(files.filter(f => f.type === 'folder' && f.isOpen).map(f => f.path))
  );

  const [draggedItem, setDraggedItem] = useState<FileNode | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const getAllFolderPaths = useCallback((nodes: FileNode[]): string[] => {
    const paths: string[] = [];
    const traverse = (nodeList: FileNode[]) => {
      nodeList.forEach(node => {
        if (node.type === 'folder') {
          paths.push(node.path);
          if (node.children) {
            traverse(node.children);
          }
        }
      });
    };
    traverse(nodes);
    return paths;
  }, []);

  const expandAll = useCallback(() => {
    const allFolderPaths = getAllFolderPaths(files);
    setExpandedFolders(new Set(allFolderPaths));
  }, [files, getAllFolderPaths]);

  const collapseAll = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  const refresh = useCallback(() => {
    const currentExpanded = getAllFolderPaths(files).filter(path => 
      expandedFolders.has(path)
    );
    setExpandedFolders(new Set(currentExpanded));
  }, [files, expandedFolders, getAllFolderPaths]);

  useImperativeHandle(ref, () => ({
    expandAll,
    collapseAll,
    refresh
  }), [expandAll, collapseAll, refresh]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'folder') {
      toggleFolder(file.path);
    } else if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDragStart = (e: React.DragEvent, node: FileNode) => {
    setDraggedItem(node);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.path);
  };

  const handleDragOver = (e: React.DragEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (node.type === 'folder' && draggedItem?.path !== node.path) {
      setDragOverItem(node.path);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetNode: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItem(null);

    if (e.dataTransfer.files.length > 0) {
      if (onFileUpload) {
        const targetPath = targetNode.type === 'folder' ? targetNode.path : undefined;
        onFileUpload(e.dataTransfer.files, targetPath);
      }
    } else if (draggedItem && onFileMove && targetNode.type === 'folder') {
      if (draggedItem.path !== targetNode.path) {
        onFileMove(draggedItem.path, targetNode.path);
      }
    }

    setDraggedItem(null);
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDraggingFile(false);
    }
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    if (e.dataTransfer.files.length > 0 && onFileUpload) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;
    const isDragOver = dragOverItem === node.path;
    const paddingLeft = depth * 16 + 8;

    return (
      <div key={node.path}>
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-sm hover:bg-accent/50 transition-colors',
            isSelected && 'bg-accent text-accent-foreground font-medium',
            isDragOver && 'bg-blue-100 border-2 border-blue-500',
            'text-sm'
          )}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => handleFileClick(node)}
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
              )}
            </>
          ) : (
            <>
              <div className="w-4" />
              <File className="h-4 w-4 flex-shrink-0 text-gray-500" />
            </>
          )}
          <span className="truncate">{node.name}</span>
          {node.type === 'file' && node.language && (
            <span className="ml-auto text-xs text-muted-foreground">
              {getLanguageLabel(node.language)}
            </span>
          )}
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={cn(
        'min-h-[200px] overflow-auto relative',
        isDraggingFile && 'border-2 border-dashed border-blue-500 bg-blue-50',
        className
      )}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
    >
      {isDraggingFile && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 z-10 pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-700">Drop files here to upload</p>
          </div>
        </div>
      )}
      <div className="space-y-0.5">
        {files.map(file => renderNode(file))}
      </div>
    </div>
  );
});

FileTreeExplorer.displayName = 'FileTreeExplorer';

function getLanguageLabel(language: string): string {
  const labels: Record<string, string> = {
    'typescript': 'TS',
    'javascript': 'JS',
    'css': 'CSS',
    'json': 'JSON',
    'markdown': 'MD',
    'html': 'HTML'
  };
  return labels[language] || language.toUpperCase();
}
