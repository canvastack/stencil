import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/core/engine/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileTreeExplorer, type FileNode, type FileTreeExplorerRef } from './FileTreeExplorer';
import { getThemeFileTree, loadThemeFileContent } from '@/core/engine/utils/themeFileScanner';
import { 
  Code, 
  Save, 
  RotateCcw, 
  Play, 
  FileText, 
  Folder, 
  FolderOpen,
  File,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Settings,
  Maximize2,
  Minimize2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  ChevronsDownUp,
  ChevronsUpDown,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  GripVertical
} from 'lucide-react';

interface EditorState {
  activeFile: string | null;
  files: Record<string, string>;
  unsavedChanges: Set<string>;
  isFullscreen: boolean;
}

export function ThemeCodeEditor({ themeName }: { themeName?: string }) {
  const { currentTheme, currentThemeName } = useTheme();
  const editorRef = useRef<any>(null);
  const fileTreeRef = useRef<FileTreeExplorerRef>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  
  const [editorState, setEditorState] = useState<EditorState>({
    activeFile: null,
    files: {},
    unsavedChanges: new Set(),
    isFullscreen: false
  });

  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [panelWidth, setPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  const targetThemeName = themeName || currentThemeName;

  useEffect(() => {
    loadFileTree();
  }, [targetThemeName]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const loadFileTree = async () => {
    setIsLoading(true);
    try {
      const realFileTree = getThemeFileTree(targetThemeName);
      setFileTree(realFileTree);
      
      const initialFiles: Record<string, string> = {};
      const firstFile = findFirstFile(realFileTree);
      
      if (firstFile) {
        const content = await loadThemeFileContent(targetThemeName, firstFile.path);
        initialFiles[firstFile.path] = content;
        
        setEditorState(prev => ({
          ...prev,
          files: initialFiles,
          activeFile: firstFile.path
        }));
      }
    } catch (error) {
      console.error('Failed to load file tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const findFirstFile = (nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
      if (node.type === 'file') return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const handleFileSelect = async (file: FileNode) => {
    if (file.type !== 'file') return;
    
    const filePath = file.path;
    
    if (!editorState.files[filePath]) {
      setIsLoading(true);
      try {
        const content = await loadThemeFileContent(targetThemeName, filePath);
        setEditorState(prev => ({
          ...prev,
          files: {
            ...prev.files,
            [filePath]: content
          },
          activeFile: filePath
        }));
      } catch (error) {
        console.error('Failed to load file:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setEditorState(prev => ({
        ...prev,
        activeFile: filePath
      }));
    }
  };

  const handleEditorChange = (value: string | undefined, filePath: string) => {
    if (value !== undefined) {
      setEditorState(prev => ({
        ...prev,
        files: {
          ...prev.files,
          [filePath]: value
        },
        unsavedChanges: new Set([...prev.unsavedChanges, filePath])
      }));
    }
  };

  const saveFile = async (filePath: string) => {
    setSaveStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEditorState(prev => {
        const newUnsavedChanges = new Set(prev.unsavedChanges);
        newUnsavedChanges.delete(filePath);
        return {
          ...prev,
          unsavedChanges: newUnsavedChanges
        };
      });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const saveAllFiles = async () => {
    for (const filePath of editorState.unsavedChanges) {
      await saveFile(filePath);
    }
  };

  const handleFileUpload = async (files: FileList, targetPath?: string) => {
    console.log('Files uploaded:', files, 'to:', targetPath);
  };

  const handleFileMove = async (sourcePath: string, targetPath: string) => {
    console.log('Move file from:', sourcePath, 'to:', targetPath);
  };

  const getLanguageFromPath = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts': return 'typescript';
      case 'jsx':
      case 'js': return 'javascript';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'json': return 'json';
      case 'html': return 'html';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  const filterFileTree = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    
    return nodes.filter(node => {
      if (node.name.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }
      if (node.children) {
        const filteredChildren = filterFileTree(node.children, query);
        if (filteredChildren.length > 0) {
          return true;
        }
      }
      return false;
    }).map(node => ({
      ...node,
      children: node.children ? filterFileTree(node.children, query) : undefined
    }));
  };

  const handleZoomIn = () => {
    setFontSize(prev => Math.min(prev + 2, 32));
  };

  const handleZoomOut = () => {
    setFontSize(prev => Math.max(prev - 2, 10));
  };

  const handleGoToLine = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.gotoLine').run();
    }
  };

  const handleToggleComment = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.commentLine').run();
    }
  };

  const filteredFileTree = filterFileTree(fileTree, searchQuery);

  return (
    <div className={`flex gap-4 ${editorState.isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
      {/* File Explorer Panel */}
      <div 
        className="flex-shrink-0 space-y-4 w-full lg:w-80"
        style={{ width: editorState.isFullscreen ? `${panelWidth}px` : undefined }}
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="h-5 w-5" />
              File Explorer
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => fileTreeRef.current?.refresh()}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" title="Add File">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => fileTreeRef.current?.expandAll()}
              >
                <ChevronsDownUp className="h-3 w-3 mr-1" />
                Expand All
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => fileTreeRef.current?.collapseAll()}
              >
                <ChevronsUpDown className="h-3 w-3 mr-1" />
                Collapse
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="h-full overflow-y-auto overflow-x-auto">
                <FileTreeExplorer
                  ref={fileTreeRef}
                  files={filteredFileTree}
                  selectedFile={editorState.activeFile}
                  onFileSelect={handleFileSelect}
                  onFileUpload={handleFileUpload}
                  onFileMove={handleFileMove}
                  className="min-h-[400px]"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resizer */}
      {editorState.isFullscreen && (
        <div 
          ref={resizerRef}
          className="w-1 cursor-col-resize hover:bg-blue-500 bg-border transition-colors flex-shrink-0"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="h-full flex items-center justify-center">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1 space-y-4 min-w-0">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Code className="h-5 w-5 flex-shrink-0" />
                <CardTitle className="text-lg">Code Editor</CardTitle>
                {editorState.activeFile && (
                  <Badge variant="secondary" className="text-xs truncate max-w-xs">
                    {editorState.activeFile}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {saveStatus === 'saving' && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Saved
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </div>
                )}

                {editorState.unsavedChanges.size > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {editorState.unsavedChanges.size} unsaved
                  </Badge>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                
                <span className="text-xs text-muted-foreground">{fontSize}px</span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomIn}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditorTheme(prev => prev === 'vs-dark' ? 'vs-light' : 'vs-dark')}
                  title="Toggle Theme"
                >
                  {editorTheme === 'vs-dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editorState.activeFile && saveFile(editorState.activeFile)}
                  disabled={!editorState.activeFile || !editorState.unsavedChanges.has(editorState.activeFile)}
                >
                  <Save className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditorState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }))}
                >
                  {editorState.isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Editor Toolbar */}
            <div className="flex items-center gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleGoToLine}
                title="Go to Line (Ctrl+G)"
              >
                Go to Line
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleToggleComment}
                title="Toggle Comment (Ctrl+/)"
              >
                Toggle Comment
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {editorState.activeFile ? (
              <div className={`border rounded-md overflow-hidden ${editorState.isFullscreen ? 'h-[calc(100vh-220px)]' : 'h-96'}`}>
                <Editor
                  height="100%"
                  language={getLanguageFromPath(editorState.activeFile)}
                  value={editorState.files[editorState.activeFile] || ''}
                  onChange={(value) => handleEditorChange(value, editorState.activeFile!)}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                  theme={editorTheme}
                  options={{
                    minimap: { enabled: true },
                    fontSize: fontSize,
                    lineNumbers: 'on',
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    folding: true,
                    foldingStrategy: 'auto',
                    showFoldingControls: 'always',
                    multiCursorModifier: 'ctrlCmd',
                    selectionClipboard: false,
                    bracketPairColorization: {
                      enabled: true
                    },
                    guides: {
                      bracketPairs: true,
                      indentation: true
                    },
                    quickSuggestions: {
                      other: true,
                      comments: true,
                      strings: true
                    },
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: 'on',
                    tabCompletion: 'on',
                    wordBasedSuggestions: true,
                    parameterHints: {
                      enabled: true
                    },
                    autoClosingBrackets: 'always',
                    autoClosingQuotes: 'always',
                    autoClosingOvertype: 'always',
                    formatOnPaste: true,
                    formatOnType: true,
                    renderWhitespace: 'selection',
                    renderControlCharacters: true,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: true
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center">
                  <Code className="h-12 w-12 mx-auto mb-4" />
                  <p>Select a file to start editing</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!editorState.isFullscreen && (
          <div className="flex gap-2">
            <Button
              onClick={saveAllFiles}
              disabled={editorState.unsavedChanges.size === 0}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All ({editorState.unsavedChanges.size})
            </Button>
            <Button variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThemeCodeEditor;
