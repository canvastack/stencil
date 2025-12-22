import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  RefreshCw, 
  FileText, 
  Folder,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Code
} from 'lucide-react';
import { useTheme } from '@/core/engine/ThemeContext';
import { themeManager } from '@/core/engine/ThemeManager';
import CodeEditor from '@/components/admin/CodeEditor';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  modified?: boolean;
}

interface EditorState {
  currentFile: FileItem | null;
  files: FileItem[];
  hasUnsavedChanges: boolean;
  previewMode: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

export default function ThemeCodeEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentTheme, currentThemeName } = useTheme();
  
  const [state, setState] = useState<EditorState>({
    currentFile: null,
    files: [],
    hasUnsavedChanges: false,
    previewMode: false,
    saveStatus: 'idle'
  });

  const [fileContent, setFileContent] = useState('');

  // Initialize files from theme
  useEffect(() => {
    if (currentTheme) {
      const files: FileItem[] = [];
      
      // Add theme metadata file
      files.push({
        name: 'theme.json',
        path: 'theme.json',
        type: 'file',
        content: JSON.stringify(currentTheme.metadata, null, 2),
        language: 'json'
      });

      // Add main index file
      files.push({
        name: 'index.ts',
        path: 'index.ts',
        type: 'file',
        content: generateIndexContent(),
        language: 'typescript'
      });

      // Add component files
      Object.keys(currentTheme.components).forEach(componentName => {
        files.push({
          name: `${componentName}.tsx`,
          path: `components/${componentName}.tsx`,
          type: 'file',
          content: generateComponentContent(componentName),
          language: 'typescript'
        });
      });

      // Add style files
      files.push({
        name: 'main.css',
        path: 'styles/main.css',
        type: 'file',
        content: generateMainCSS(),
        language: 'css'
      });

      files.push({
        name: 'components.css',
        path: 'styles/components.css',
        type: 'file',
        content: generateComponentsCSS(),
        language: 'css'
      });

      // Add README
      files.push({
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        content: generateReadme(),
        language: 'markdown'
      });

      setState(prev => ({ ...prev, files }));

      // Auto-select file from URL params
      const fileName = searchParams.get('file');
      if (fileName) {
        const file = files.find(f => f.name === fileName);
        if (file) {
          selectFile(file);
        }
      } else if (files.length > 0) {
        selectFile(files[0]);
      }
    }
  }, [currentTheme, searchParams]);

  const generateIndexContent = () => {
    if (!currentTheme) return '';
    
    return `import { Theme } from '@/core/engine/types';
${Object.keys(currentTheme.components).map(name => 
  `import ${name} from './components/${name}';`
).join('\n')}

const theme: Theme = {
  metadata: {
    name: '${currentTheme.metadata.name}',
    version: '${currentTheme.metadata.version}',
    description: '${currentTheme.metadata.description}',
    author: '${currentTheme.metadata.author}',
    license: '${currentTheme.metadata.license || 'MIT'}'
  },
  components: {
${Object.keys(currentTheme.components).map(name => `    ${name},`).join('\n')}
  },
  assets: {
    styles: ['/themes/${currentThemeName}/styles/main.css'],
    images: {},
    fonts: {}
  },
  config: ${JSON.stringify(currentTheme.config || {}, null, 4)}
};

export default theme;
`;
  };

  const generateComponentContent = (componentName: string) => {
    return `import React from 'react';

export interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      {/* ${componentName} component implementation */}
      <h2>${componentName} Component</h2>
      {children}
    </div>
  );
};

export default ${componentName};
`;
  };

  const generateMainCSS = () => {
    if (!currentTheme) return '';
    
    return `/* ${currentTheme.metadata.name} Theme Styles */

:root {
  --primary: ${currentTheme.config?.colors?.primary || '#3b82f6'};
  --secondary: ${currentTheme.config?.colors?.secondary || '#64748b'};
  --accent: ${currentTheme.config?.colors?.accent || '#f59e0b'};
  --background: ${currentTheme.config?.colors?.background || '#ffffff'};
  --foreground: ${currentTheme.config?.colors?.foreground || '#1f2937'};
}

body {
  font-family: ${currentTheme.config?.typography?.fontFamily || 'Inter, system-ui, sans-serif'};
  font-size: ${currentTheme.config?.typography?.fontSize?.base || '16px'};
  background-color: var(--background);
  color: var(--foreground);
}

/* Global Styles */
.container {
  max-width: ${currentTheme.config?.layout?.maxWidth || '1200px'};
  margin: 0 auto;
  padding: 0 ${currentTheme.config?.layout?.spacing?.md || '1.5rem'};
}

/* Add your custom styles here */
`;
  };

  const generateComponentsCSS = () => {
    if (!currentTheme) return '';
    
    return `/* Component Styles for ${currentTheme.metadata.name} */

/* Header Styles */
.theme-header {
  background-color: var(--background);
  border-bottom: 1px solid var(--secondary);
  padding: ${currentTheme.config?.layout?.spacing?.md || '1.5rem'} 0;
}

/* Footer Styles */
.theme-footer {
  background-color: var(--secondary);
  color: var(--background);
  padding: ${currentTheme.config?.layout?.spacing?.lg || '2rem'} 0;
  margin-top: auto;
}

/* Button Styles */
.theme-button {
  background-color: var(--primary);
  color: var(--background);
  padding: ${currentTheme.config?.layout?.spacing?.sm || '1rem'} ${currentTheme.config?.layout?.spacing?.md || '1.5rem'};
  border-radius: ${currentTheme.config?.layout?.borderRadius || '0.375rem'};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Add more component styles as needed */
`;
  };

  const generateReadme = () => {
    if (!currentTheme) return '';
    
    return `# ${currentTheme.metadata.name}

${currentTheme.metadata.description}

## Installation

1. Upload this theme package through the Theme Manager
2. Activate the theme from the dashboard
3. Customize settings as needed

## Features

${currentTheme.config?.features ? Object.entries(currentTheme.config.features)
  .map(([feature, enabled]) => `- **${feature}**: ${enabled ? 'Enabled' : 'Disabled'}`)
  .join('\n') : '- No specific features documented'}

## Components

This theme includes the following components:

${Object.keys(currentTheme.components).map(name => `- **${name}**: Theme component for ${name.toLowerCase()}`).join('\n')}

## Customization

### Colors

The theme uses CSS custom properties for easy color customization:

- \`--primary\`: ${currentTheme.config?.colors?.primary || '#3b82f6'}
- \`--secondary\`: ${currentTheme.config?.colors?.secondary || '#64748b'}
- \`--accent\`: ${currentTheme.config?.colors?.accent || '#f59e0b'}
- \`--background\`: ${currentTheme.config?.colors?.background || '#ffffff'}
- \`--foreground\`: ${currentTheme.config?.colors?.foreground || '#1f2937'}

### Typography

- **Font Family**: ${currentTheme.config?.typography?.fontFamily || 'Inter, system-ui, sans-serif'}
- **Base Font Size**: ${currentTheme.config?.typography?.fontSize?.base || '16px'}

### Layout

- **Max Width**: ${currentTheme.config?.layout?.maxWidth || '1200px'}
- **Spacing**: Consistent spacing scale using CSS custom properties

## Development

To modify this theme:

1. Edit the component files in the \`components/\` directory
2. Update styles in the \`styles/\` directory
3. Modify theme configuration in \`index.ts\`
4. Test your changes using the preview feature

## Author

**${currentTheme.metadata.author}**

## Version

${currentTheme.metadata.version}

## License

${currentTheme.metadata.license || 'MIT'}
`;
  };

  const selectFile = (file: FileItem) => {
    setState(prev => ({ ...prev, currentFile: file }));
    setFileContent(file.content || '');
  };

  const handleContentChange = (newContent: string) => {
    setFileContent(newContent);
    setState(prev => ({ 
      ...prev, 
      hasUnsavedChanges: true,
      saveStatus: 'idle'
    }));
  };

  const handleSave = async () => {
    if (!state.currentFile) return;

    setState(prev => ({ ...prev, saveStatus: 'saving' }));

    try {
      // Update file content
      const updatedFiles = state.files.map(file => 
        file.path === state.currentFile?.path 
          ? { ...file, content: fileContent, modified: true }
          : file
      );

      setState(prev => ({ 
        ...prev, 
        files: updatedFiles,
        hasUnsavedChanges: false,
        saveStatus: 'saved'
      }));

      // Auto-clear saved status after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, saveStatus: 'idle' }));
      }, 3000);

    } catch (error) {
      console.error('Failed to save file:', error);
      setState(prev => ({ ...prev, saveStatus: 'error' }));
    }
  };

  const handleBackToDashboard = () => {
    if (state.hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/admin/themes');
      }
    } else {
      navigate('/admin/themes');
    }
  };

  const togglePreview = () => {
    setState(prev => ({ ...prev, previewMode: !prev.previewMode }));
  };

  if (!currentTheme) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No active theme found. Please activate a theme first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToDashboard}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Themes
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Theme Code Editor</h1>
            <p className="text-muted-foreground">
              Edit {currentTheme.metadata.name} theme files
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state.hasUnsavedChanges && (
            <Badge variant="secondary">Unsaved Changes</Badge>
          )}
          
          {state.saveStatus === 'saved' && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}

          <Button
            variant="outline"
            onClick={togglePreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            {state.previewMode ? 'Edit' : 'Preview'}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!state.hasUnsavedChanges || state.saveStatus === 'saving'}
          >
            <Save className="h-4 w-4 mr-2" />
            {state.saveStatus === 'saving' ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* File Explorer */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Files
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {state.files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => selectFile(file)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
                      state.currentFile?.path === file.path ? 'bg-muted' : ''
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{file.name}</span>
                    {file.modified && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor */}
        <div className="col-span-9">
          {state.currentFile ? (
            <CodeEditor
              value={fileContent}
              onChange={handleContentChange}
              language={state.currentFile.language}
              height="100%"
              onSave={handleSave}
              fileName={state.currentFile.name}
              readOnly={state.previewMode}
            />
          ) : (
            <Card className="h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No File Selected</h3>
                  <p className="text-muted-foreground">
                    Select a file from the explorer to start editing
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded">
        <div className="flex items-center gap-4">
          <span>Theme: {currentTheme.metadata.name}</span>
          <span>Version: {currentTheme.metadata.version}</span>
          {state.currentFile && (
            <span>Editing: {state.currentFile.name}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {state.hasUnsavedChanges && (
            <span className="text-orange-600">● Unsaved changes</span>
          )}
          <span>Files: {state.files.length}</span>
        </div>
      </div>
    </div>
  );
}