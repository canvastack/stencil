import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Package, 
  FileText, 
  Image, 
  Code, 
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useTheme } from '@/core/engine/ThemeContext';
import { themeManager } from '@/core/engine/ThemeManager';
import JSZip from 'jszip';

interface ExportOptions {
  includeComponents: boolean;
  includeAssets: boolean;
  includeStyles: boolean;
  includeDocumentation: boolean;
  includeMetadata: boolean;
  customName?: string;
  customVersion?: string;
  customDescription?: string;
}

interface ExportState {
  isExporting: boolean;
  exportProgress: number;
  exportComplete: boolean;
  exportError: string | null;
  exportedFileName: string | null;
}

export function ThemeExporter() {
  const { currentTheme, currentThemeName } = useTheme();
  
  const [options, setOptions] = useState<ExportOptions>({
    includeComponents: true,
    includeAssets: true,
    includeStyles: true,
    includeDocumentation: true,
    includeMetadata: true,
    customName: '',
    customVersion: '',
    customDescription: ''
  });

  const [state, setState] = useState<ExportState>({
    isExporting: false,
    exportProgress: 0,
    exportComplete: false,
    exportError: null,
    exportedFileName: null
  });

  const updateOption = (key: keyof ExportOptions, value: boolean | string) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const generateThemePackage = async (): Promise<Blob> => {
    const zip = new JSZip();
    
    if (!currentTheme) {
      throw new Error('No active theme to export');
    }

    setState(prev => ({ ...prev, exportProgress: 10 }));

    // Create theme metadata
    if (options.includeMetadata) {
      const metadata = {
        ...currentTheme.metadata,
        name: options.customName || currentTheme.metadata.name,
        version: options.customVersion || currentTheme.metadata.version,
        description: options.customDescription || currentTheme.metadata.description,
        exportedAt: new Date().toISOString(),
        exportedBy: 'Theme Manager'
      };
      
      zip.file('theme.json', JSON.stringify(metadata, null, 2));
      setState(prev => ({ ...prev, exportProgress: 20 }));
    }

    // Add components
    if (options.includeComponents) {
      const componentsFolder = zip.folder('components');
      
      Object.entries(currentTheme.components).forEach(([name, component]) => {
        if (component) {
          // Generate component code (this is a simplified version)
          const componentCode = `import React from 'react';

export interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${name}: React.FC<${name}Props> = ({ className, children, ...props }) => {
  return (
    <div className={className} {...props}>
      {/* ${name} component implementation */}
      {children}
    </div>
  );
};

export default ${name};
`;
          componentsFolder?.file(`${name}.tsx`, componentCode);
        }
      });
      
      setState(prev => ({ ...prev, exportProgress: 40 }));
    }

    // Add assets
    if (options.includeAssets) {
      const assetsFolder = zip.folder('assets');
      
      // Add images
      if (currentTheme.assets?.images) {
        const imagesFolder = assetsFolder?.folder('images');
        Object.entries(currentTheme.assets.images).forEach(([name, path]) => {
          // For demo purposes, we'll create placeholder files
          imagesFolder?.file(`${name}.placeholder`, `Image placeholder for ${path}`);
        });
      }

      // Add fonts
      if (currentTheme.assets?.fonts) {
        const fontsFolder = assetsFolder?.folder('fonts');
        Object.entries(currentTheme.assets.fonts).forEach(([name, path]) => {
          fontsFolder?.file(`${name}.placeholder`, `Font placeholder for ${path}`);
        });
      }

      setState(prev => ({ ...prev, exportProgress: 60 }));
    }

    // Add styles
    if (options.includeStyles) {
      const stylesFolder = zip.folder('styles');
      
      // Generate main CSS file
      const mainCSS = `/* ${currentTheme.metadata.name} Theme Styles */

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
}

/* Add your custom styles here */
`;
      
      stylesFolder?.file('main.css', mainCSS);
      
      // Generate component-specific styles
      const componentCSS = `/* Component Styles */

.theme-header {
  /* Header component styles */
}

.theme-footer {
  /* Footer component styles */
}

/* Add more component styles as needed */
`;
      
      stylesFolder?.file('components.css', componentCSS);
      
      setState(prev => ({ ...prev, exportProgress: 80 }));
    }

    // Add documentation
    if (options.includeDocumentation) {
      const readme = `# ${currentTheme.metadata.name}

${currentTheme.metadata.description}

## Installation

1. Upload the theme ZIP file through the Theme Manager
2. Activate the theme from the dashboard
3. Customize settings as needed

## Features

${currentTheme.config?.features ? Object.entries(currentTheme.config.features)
  .map(([feature, enabled]) => `- ${feature}: ${enabled ? 'Enabled' : 'Disabled'}`)
  .join('\n') : '- No specific features documented'}

## Components

${Object.keys(currentTheme.components).map(name => `- ${name}`).join('\n')}

## Configuration

This theme supports the following configuration options:

- Colors: Primary, Secondary, Accent, Background, Foreground
- Typography: Font family, sizes, weights
- Layout: Max width, spacing, border radius
- Features: Dark mode, animations, lazy loading

## Author

${currentTheme.metadata.author}

## Version

${currentTheme.metadata.version}

## License

${currentTheme.metadata.license || 'Not specified'}
`;
      
      zip.file('README.md', readme);
      
      // Add package.json for npm compatibility
      const packageJson = {
        name: (options.customName || currentTheme.metadata.name).toLowerCase().replace(/\s+/g, '-'),
        version: options.customVersion || currentTheme.metadata.version,
        description: options.customDescription || currentTheme.metadata.description,
        main: 'index.ts',
        author: currentTheme.metadata.author,
        license: currentTheme.metadata.license || 'MIT',
        keywords: currentTheme.metadata.keywords || ['theme', 'react', 'typescript'],
        peerDependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
        }
      };
      
      zip.file('package.json', JSON.stringify(packageJson, null, 2));
    }

    // Add main index file
    const indexContent = `import { Theme } from '@/core/engine/types';
${Object.keys(currentTheme.components).map(name => 
  `import ${name} from './components/${name}';`
).join('\n')}

const theme: Theme = {
  metadata: {
    name: '${options.customName || currentTheme.metadata.name}',
    version: '${options.customVersion || currentTheme.metadata.version}',
    description: '${options.customDescription || currentTheme.metadata.description}',
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
    
    zip.file('index.ts', indexContent);
    
    setState(prev => ({ ...prev, exportProgress: 100 }));
    
    return await zip.generateAsync({ type: 'blob' });
  };

  const handleExport = async () => {
    if (!currentTheme) {
      setState(prev => ({ 
        ...prev, 
        exportError: 'No active theme to export' 
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isExporting: true,
      exportProgress: 0,
      exportError: null,
      exportComplete: false
    }));

    try {
      const blob = await generateThemePackage();
      
      // Create download
      const fileName = `${(options.customName || currentTheme.metadata.name).toLowerCase().replace(/\s+/g, '-')}-v${options.customVersion || currentTheme.metadata.version}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState(prev => ({
        ...prev,
        isExporting: false,
        exportComplete: true,
        exportedFileName: fileName
      }));

    } catch (error) {
      console.error('Export failed:', error);
      setState(prev => ({
        ...prev,
        isExporting: false,
        exportError: error instanceof Error ? error.message : 'Export failed'
      }));
    }
  };

  const resetExport = () => {
    setState({
      isExporting: false,
      exportProgress: 0,
      exportComplete: false,
      exportError: null,
      exportedFileName: null
    });
  };

  if (!currentTheme) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Theme</h3>
            <p className="text-muted-foreground">
              Please activate a theme before attempting to export.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Export Theme: {currentTheme.metadata.name}
          </CardTitle>
          <CardDescription>
            Create a downloadable package of your current theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Current Version:</span>
              <p>{currentTheme.metadata.version}</p>
            </div>
            <div>
              <span className="font-medium">Author:</span>
              <p>{currentTheme.metadata.author}</p>
            </div>
            <div>
              <span className="font-medium">Components:</span>
              <p>{Object.keys(currentTheme.components).length} components</p>
            </div>
            <div>
              <span className="font-medium">Last Modified:</span>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Choose what to include in your theme package
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Include Options */}
          <div>
            <h3 className="font-medium mb-3">Package Contents</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="components"
                    checked={options.includeComponents}
                    onCheckedChange={(checked) => updateOption('includeComponents', !!checked)}
                  />
                  <Label htmlFor="components" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Components
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assets"
                    checked={options.includeAssets}
                    onCheckedChange={(checked) => updateOption('includeAssets', !!checked)}
                  />
                  <Label htmlFor="assets" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Assets (Images, Fonts)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="styles"
                    checked={options.includeStyles}
                    onCheckedChange={(checked) => updateOption('includeStyles', !!checked)}
                  />
                  <Label htmlFor="styles" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Styles & Configuration
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="documentation"
                    checked={options.includeDocumentation}
                    onCheckedChange={(checked) => updateOption('includeDocumentation', !!checked)}
                  />
                  <Label htmlFor="documentation" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentation
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metadata"
                    checked={options.includeMetadata}
                    onCheckedChange={(checked) => updateOption('includeMetadata', !!checked)}
                  />
                  <Label htmlFor="metadata" className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Theme Metadata
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Custom Metadata */}
          <div>
            <h3 className="font-medium mb-3">Custom Metadata (Optional)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customName">Theme Name</Label>
                <Input
                  id="customName"
                  placeholder={currentTheme.metadata.name}
                  value={options.customName}
                  onChange={(e) => updateOption('customName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customVersion">Version</Label>
                <Input
                  id="customVersion"
                  placeholder={currentTheme.metadata.version}
                  value={options.customVersion}
                  onChange={(e) => updateOption('customVersion', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="customDescription">Description</Label>
              <Textarea
                id="customDescription"
                placeholder={currentTheme.metadata.description}
                value={options.customDescription}
                onChange={(e) => updateOption('customDescription', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Progress */}
      {state.isExporting && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Generating theme package...</span>
                <span className="text-sm text-muted-foreground">{state.exportProgress}%</span>
              </div>
              <Progress value={state.exportProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Results */}
      {state.exportError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Export failed: {state.exportError}
          </AlertDescription>
        </Alert>
      )}

      {state.exportComplete && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Theme exported successfully as <strong>{state.exportedFileName}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Export Actions */}
      <div className="flex justify-end gap-2">
        {state.exportComplete && (
          <Button variant="outline" onClick={resetExport}>
            Export Another
          </Button>
        )}
        <Button
          onClick={handleExport}
          disabled={state.isExporting || (!options.includeComponents && !options.includeAssets && !options.includeStyles)}
        >
          {state.isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Theme
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default ThemeExporter;