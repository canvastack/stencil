import React, { useState, useEffect } from 'react';
import { useTheme } from '@/core/engine/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Type, 
  Layout, 
  Settings, 
  Eye, 
  RotateCcw, 
  Save,
  Monitor,
  Smartphone,
  Tablet,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import type { ThemeConfig } from '@/core/engine/types';

interface CustomizerProps {
  onConfigChange?: (config: ThemeConfig) => void;
  showPreview?: boolean;
}

export function ThemeCustomizer({ onConfigChange, showPreview = true }: CustomizerProps) {
  const { currentTheme, currentThemeName } = useTheme();
  const [config, setConfig] = useState<ThemeConfig>({
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      foreground: '#1f2937'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        base: '16px',
        sm: '14px',
        lg: '18px',
        xl: '20px'
      }
    },
    layout: {
      maxWidth: '1200px',
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem'
      }
    },
    features: {
      darkMode: true,
      animations: true,
      lazyLoading: true
    }
  });

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (currentTheme?.config) {
      setConfig({ ...config, ...currentTheme.config });
    }
  }, [currentTheme]);

  const updateConfig = (path: string, value: any) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
    setHasUnsavedChanges(true);
    onConfigChange?.(newConfig);
  };

  const resetToDefaults = () => {
    if (currentTheme?.config) {
      setConfig({ ...currentTheme.config });
      setHasUnsavedChanges(false);
    }
  };

  const saveChanges = async () => {
    // In a real implementation, this would save the config to the theme
    console.log('Saving theme config:', config);
    setHasUnsavedChanges(false);
    
    // Apply CSS custom properties for live preview
    const root = document.documentElement;
    if (config.colors) {
      Object.entries(config.colors).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--theme-${key}`, value);
        }
      });
    }
  };

  const ColorPicker = ({ label, value, onChange }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded border border-border cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = value;
            input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
            input.click();
          }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop': return Monitor;
      case 'tablet': return Tablet;
      case 'mobile': return Smartphone;
      default: return Monitor;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Customizer Panel */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Theme Customizer
            </CardTitle>
            <CardDescription>
              Customize the appearance of {currentThemeName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="colors" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colors">
                  <Palette className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="typography">
                  <Type className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="layout">
                  <Layout className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="features">
                  <Zap className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Color Scheme</h3>
                  <ColorPicker
                    label="Primary Color"
                    value={config.colors?.primary || '#3b82f6'}
                    onChange={(value) => updateConfig('colors.primary', value)}
                  />
                  <ColorPicker
                    label="Secondary Color"
                    value={config.colors?.secondary || '#64748b'}
                    onChange={(value) => updateConfig('colors.secondary', value)}
                  />
                  <ColorPicker
                    label="Accent Color"
                    value={config.colors?.accent || '#f59e0b'}
                    onChange={(value) => updateConfig('colors.accent', value)}
                  />
                  <ColorPicker
                    label="Background"
                    value={config.colors?.background || '#ffffff'}
                    onChange={(value) => updateConfig('colors.background', value)}
                  />
                  <ColorPicker
                    label="Text Color"
                    value={config.colors?.foreground || '#1f2937'}
                    onChange={(value) => updateConfig('colors.foreground', value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="typography" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Typography</h3>
                  
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={config.typography?.fontFamily || 'Inter, system-ui, sans-serif'}
                      onChange={(e) => updateConfig('typography.fontFamily', e.target.value)}
                    >
                      <option value="Inter, system-ui, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Open Sans, sans-serif">Open Sans</option>
                      <option value="Lato, sans-serif">Lato</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Base Font Size</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[parseInt(config.typography?.fontSize?.base?.replace('px', '') || '16')]}
                        onValueChange={([value]) => updateConfig('typography.fontSize.base', `${value}px`)}
                        min={12}
                        max={24}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm w-12">{config.typography?.fontSize?.base || '16px'}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Layout Settings</h3>
                  
                  <div className="space-y-2">
                    <Label>Max Width</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={config.layout?.maxWidth || '1200px'}
                      onChange={(e) => updateConfig('layout.maxWidth', e.target.value)}
                    >
                      <option value="1024px">1024px</option>
                      <option value="1200px">1200px</option>
                      <option value="1400px">1400px</option>
                      <option value="100%">Full Width</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Base Spacing</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[parseFloat(config.layout?.spacing?.sm?.replace('rem', '') || '1')]}
                        onValueChange={([value]) => updateConfig('layout.spacing.sm', `${value}rem`)}
                        min={0.5}
                        max={3}
                        step={0.25}
                        className="flex-1"
                      />
                      <span className="text-sm w-16">{config.layout?.spacing?.sm || '1rem'}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Features</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode Support</Label>
                      <p className="text-sm text-muted-foreground">Enable dark mode toggle</p>
                    </div>
                    <Switch
                      checked={config.features?.darkMode || false}
                      onCheckedChange={(checked) => updateConfig('features.darkMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Animations</Label>
                      <p className="text-sm text-muted-foreground">Enable smooth animations</p>
                    </div>
                    <Switch
                      checked={config.features?.animations || false}
                      onCheckedChange={(checked) => updateConfig('features.animations', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lazy Loading</Label>
                      <p className="text-sm text-muted-foreground">Optimize image loading</p>
                    </div>
                    <Switch
                      checked={config.features?.lazyLoading || false}
                      onCheckedChange={(checked) => updateConfig('features.lazyLoading', checked)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={saveChanges} disabled={!hasUnsavedChanges} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            {hasUnsavedChanges && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  Unsaved changes
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    See your changes in real-time
                  </CardDescription>
                </div>
                
                {/* Device Toggle */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
                  {(['desktop', 'tablet', 'mobile'] as const).map((device) => {
                    const Icon = getDeviceIcon(device);
                    return (
                      <Button
                        key={device}
                        variant={previewDevice === device ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewDevice(device)}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Preview Frame */}
              <div className="border rounded-lg overflow-hidden bg-background">
                <div 
                  className={`mx-auto transition-all duration-300 ${
                    previewDevice === 'desktop' ? 'w-full' :
                    previewDevice === 'tablet' ? 'w-[768px]' : 'w-[375px]'
                  }`}
                  style={{
                    '--theme-primary': config.colors?.primary,
                    '--theme-secondary': config.colors?.secondary,
                    '--theme-accent': config.colors?.accent,
                    '--theme-background': config.colors?.background,
                    '--theme-foreground': config.colors?.foreground,
                    fontFamily: config.typography?.fontFamily,
                    fontSize: config.typography?.fontSize?.base
                  } as React.CSSProperties}
                >
                  {/* Mock Preview Content */}
                  <div className="p-6 space-y-4">
                    <div 
                      className="h-12 rounded-md flex items-center px-4"
                      style={{ backgroundColor: config.colors?.primary, color: 'white' }}
                    >
                      <h1 className="text-lg font-semibold">Header Preview</h1>
                    </div>
                    
                    <div className="space-y-3">
                      <h2 
                        className="text-xl font-bold"
                        style={{ color: config.colors?.foreground }}
                      >
                        Sample Content
                      </h2>
                      <p 
                        className="text-sm"
                        style={{ color: config.colors?.secondary }}
                      >
                        This is how your theme will look with the current settings.
                      </p>
                      
                      <div className="flex gap-2">
                        <button 
                          className="px-4 py-2 rounded-md text-white text-sm"
                          style={{ backgroundColor: config.colors?.primary }}
                        >
                          Primary Button
                        </button>
                        <button 
                          className="px-4 py-2 rounded-md text-sm border"
                          style={{ 
                            borderColor: config.colors?.secondary,
                            color: config.colors?.secondary 
                          }}
                        >
                          Secondary Button
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ThemeCustomizer;