import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import Editor from '@monaco-editor/react';
import { FileText, Code, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContentStore } from '@/stores/cms';
import { useTheme } from 'next-themes';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

interface ContentEditorProps {
  value: {
    wysiwyg?: string;
    markdown?: string;
  };
  onChange: (value: { wysiwyg?: string; markdown?: string }) => void;
  height?: number;
  label?: string;
  className?: string;
}

export function ContentEditor({ 
  value, 
  onChange, 
  height = 500, 
  label = 'Content',
  className 
}: ContentEditorProps) {
  const { editorMode, setEditorMode } = useContentStore();
  const { theme } = useTheme();
  const [previewMode, setPreviewMode] = useState(false);

  const handleWysiwygChange = (content: string) => {
    onChange({
      wysiwyg: content,
      markdown: value.markdown,
    });
  };

  const handleMarkdownChange = (content: string | undefined) => {
    onChange({
      wysiwyg: value.wysiwyg,
      markdown: content || '',
    });
  };

  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
    
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    
    return html;
  };

  const getPreviewContent = (): string => {
    if (editorMode === 'wysiwyg') {
      return value.wysiwyg || '';
    } else {
      return convertMarkdownToHtml(value.markdown || '');
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-2">
          <Tabs value={editorMode} onValueChange={(mode) => setEditorMode(mode as 'wysiwyg' | 'markdown')}>
            <TabsList>
              <TabsTrigger value="wysiwyg" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                WYSIWYG
              </TabsTrigger>
              <TabsTrigger value="markdown" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                Markdown
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant={previewMode ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {previewMode ? 'Hide' : 'Preview'}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <Card>
          <CardContent className="p-6">
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {editorMode === 'wysiwyg' ? (
            <WysiwygEditor
              value={value.wysiwyg || ''}
              onChange={handleWysiwygChange}
              height={height}
              placeholder="Start writing your content..."
            />
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Editor
                height={height}
                defaultLanguage="markdown"
                value={value.markdown || ''}
                onChange={handleMarkdownChange}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  wrappingIndent: 'same',
                  padding: { top: 16, bottom: 16 },
                  suggest: {
                    showKeywords: true,
                    showSnippets: true,
                  },
                }}
              />
            </div>
          )}
        </>
      )}

      {editorMode === 'markdown' && !previewMode && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Markdown Quick Reference:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <code className="px-2 py-1 bg-muted rounded text-xs"># Heading 1</code>
            <code className="px-2 py-1 bg-muted rounded text-xs">**Bold**</code>
            <code className="px-2 py-1 bg-muted rounded text-xs">## Heading 2</code>
            <code className="px-2 py-1 bg-muted rounded text-xs">*Italic*</code>
            <code className="px-2 py-1 bg-muted rounded text-xs">[Link](url)</code>
            <code className="px-2 py-1 bg-muted rounded text-xs">- List item</code>
          </div>
        </div>
      )}
    </div>
  );
}
