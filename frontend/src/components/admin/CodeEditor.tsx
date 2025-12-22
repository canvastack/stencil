import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Code, 
  Save, 
  Undo, 
  Redo, 
  Search, 
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  height?: string;
  onSave?: () => void;
  fileName?: string;
}

interface EditorState {
  isFullscreen: boolean;
  hasChanges: boolean;
  lastSaved: Date | null;
  cursorPosition: { line: number; column: number };
}

const SUPPORTED_LANGUAGES = [
  { value: 'typescript', label: 'TypeScript', extension: '.tsx' },
  { value: 'javascript', label: 'JavaScript', extension: '.jsx' },
  { value: 'css', label: 'CSS', extension: '.css' },
  { value: 'json', label: 'JSON', extension: '.json' },
  { value: 'html', label: 'HTML', extension: '.html' },
  { value: 'markdown', label: 'Markdown', extension: '.md' }
];

export function CodeEditor({
  value,
  onChange,
  language = 'typescript',
  theme = 'light',
  readOnly = false,
  height = '400px',
  onSave,
  fileName
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<EditorState>({
    isFullscreen: false,
    hasChanges: false,
    lastSaved: null,
    cursorPosition: { line: 1, column: 1 }
  });

  const [editorValue, setEditorValue] = useState(value);
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  useEffect(() => {
    setEditorValue(value);
    setState(prev => ({ ...prev, hasChanges: false }));
  }, [value]);

  const handleValueChange = useCallback((newValue: string) => {
    setEditorValue(newValue);
    onChange(newValue);
    setState(prev => ({ ...prev, hasChanges: true }));
  }, [onChange]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
      setState(prev => ({ 
        ...prev, 
        hasChanges: false, 
        lastSaved: new Date() 
      }));
    }
  }, [onSave]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Handle Ctrl+S for save
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      handleSave();
    }

    // Handle Tab for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = editorValue.substring(0, start) + '  ' + editorValue.substring(end);
      handleValueChange(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  }, [editorValue, handleValueChange, handleSave]);

  const updateCursorPosition = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const text = textarea.value.substring(0, textarea.selectionStart);
      const lines = text.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      setState(prev => ({ 
        ...prev, 
        cursorPosition: { line, column } 
      }));
    }
  }, []);

  const toggleFullscreen = () => {
    setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  };

  const formatCode = () => {
    // Simple code formatting (basic indentation)
    try {
      if (selectedLanguage === 'json') {
        const parsed = JSON.parse(editorValue);
        const formatted = JSON.stringify(parsed, null, 2);
        handleValueChange(formatted);
      } else {
        // Basic formatting for other languages
        const lines = editorValue.split('\n');
        let indentLevel = 0;
        const formatted = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed.includes('}') || trimmed.includes(']') || trimmed.includes('</')) {
            indentLevel = Math.max(0, indentLevel - 1);
          }
          
          const indented = '  '.repeat(indentLevel) + trimmed;
          
          if (trimmed.includes('{') || trimmed.includes('[') || trimmed.includes('<')) {
            indentLevel++;
          }
          
          return indented;
        }).join('\n');
        
        handleValueChange(formatted);
      }
    } catch (error) {
      console.warn('Failed to format code:', error);
    }
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'tsx': 'typescript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'js': 'javascript',
      'css': 'css',
      'json': 'json',
      'html': 'html',
      'md': 'markdown'
    };
    return langMap[extension || ''] || 'typescript';
  };

  useEffect(() => {
    if (fileName) {
      const detectedLanguage = getLanguageFromFileName(fileName);
      setSelectedLanguage(detectedLanguage);
    }
  }, [fileName]);

  const editorClasses = `
    w-full p-4 font-mono text-sm border rounded-md resize-none
    ${theme === 'dark' ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-300'}
    ${readOnly ? 'cursor-not-allowed opacity-75' : ''}
    focus:outline-none focus:ring-2 focus:ring-blue-500
  `;

  const containerClasses = state.isFullscreen 
    ? 'fixed inset-0 z-50 bg-background p-4' 
    : '';

  return (
    <div className={containerClasses}>
      <Card className={state.isFullscreen ? 'h-full flex flex-col' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              <CardTitle className="text-base">
                {fileName || 'Code Editor'}
              </CardTitle>
              {state.hasChanges && (
                <Badge variant="secondary" className="text-xs">
                  Unsaved
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Editor Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={formatCode}
                disabled={readOnly}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                {state.isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {onSave && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!state.hasChanges || readOnly}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                Line {state.cursorPosition.line}, Column {state.cursorPosition.column}
              </span>
              <span>
                {editorValue.length} characters
              </span>
              <span>
                {editorValue.split('\n').length} lines
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {state.lastSaved && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Saved {state.lastSaved.toLocaleTimeString()}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {selectedLanguage.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className={state.isFullscreen ? 'flex-1 flex flex-col' : ''}>
          {/* Editor Textarea */}
          <textarea
            ref={textareaRef}
            value={editorValue}
            onChange={(e) => handleValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onSelect={updateCursorPosition}
            onClick={updateCursorPosition}
            className={editorClasses}
            style={{ 
              height: state.isFullscreen ? '100%' : height,
              minHeight: state.isFullscreen ? '100%' : '200px'
            }}
            readOnly={readOnly}
            placeholder={`Enter your ${selectedLanguage} code here...`}
            spellCheck={false}
          />

          {/* Help Text */}
          {!readOnly && (
            <div className="mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Press Ctrl+S to save</span>
                <span>Press Tab for indentation</span>
                <span>Use the format button to auto-format code</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Help */}
      {state.isFullscreen && (
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Keyboard Shortcuts:</strong> Ctrl+S (Save), Tab (Indent), Esc (Exit Fullscreen)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default CodeEditor;