import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Eye, 
  Palette, 
  Type, 
  Layout,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle,
  AlertCircle,
  Undo,
  Download
} from 'lucide-react';
import { useTheme } from '@/core/engine/ThemeContext';
import type { ThemeConfig } from '@/core/engine/types';

interface ThemeSettingsState {
  config: ThemeConfig;
  hasChanges: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  livePreview: boolean;
}

const FONT_OPTIONS = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' }
];

const PRESET_COLORS = [
  { name: 'Blue', primary: '#3b82f6', secondary: '#64748b', accent: '#f59e0b' },
  { name: 'Green', primary: '#10b981', secondary: '#6b7280', accent: '#f59e0b' },
  { name: 'Purple', primary: '#8b5cf6', secondary: '#6b7280', accent: '#f59e0b' },
  { name: 'Red', primary: '#ef4444', secondary: '#6b7280', accent: '#f59e0b' },
  { name: 'Orange', primary: '#f97316', secondary: '#6b7280', accent: '#3b82f6' },
  { name: 'Pink', primary: '#ec4899', secondary: '#6b7280', accent: '#f59e0b' }
];

export default function ThemeSettings() {
  const navigate = useNavigate();
  const { currentTheme, currentThemeName } = useTheme();
  
  const [state, setState] = useState<ThemeSettingsState>({
    config: {
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
    },
    hasChanges: false,
    saveStatus: 'idle',
    previewDevice: 'desktop',
    livePreview: true
  });

  // Initialize with current theme config
  useEffect(() => {
    if (currentTheme?.config) {
      setState(prev => ({
        ...prev,
        config: { ...prev.config, ...currentTheme.config }
      }));
    }
  }, [currentTheme]);

  const updateConfig = (path: string, value: any) => {
    setState(prev => {
      const newConfig = { ...prev.config };
      const keys = path.split('.');
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      return {
        ...prev,
        config: newConfig,
        hasChanges: true,
        saveStatus: 'idle'
      };
    });
  };

  const applyColorPreset = (preset: typeof PRESET_COLORS[0]) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        colors: {
          ...prev.config.colors,
          primary: preset.primary,
          secondary: preset.secondary,
          accent: preset.accent
        }
      },
      hasChanges: true,
      saveStatus: 'idle'
    }));
  };

  const handleSave = async () => {
    setState(prev => ({ ...prev, saveStatus: 'saving' }));

    try {
      // Here you would save the configuration to the theme
      // For now, we'll simulate the save process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({ 
        ...prev, 
        hasChanges: false, 
        saveStatus: 'saved' 
      }));

      // Auto-clear saved status after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, saveStatus: 'idle' }));
      }, 3000);

    } catch (error) {
      console.error('Failed to save settings:', error);
      setState(prev => ({ ...prev, saveStatus: 'error' }));
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setState(prev => ({
        ...prev,
        config: currentTheme?.config || prev.config,
        hasChanges: false,
        saveStatus: 'idle'
      }));
    }
  };

  const handleBackToDashboard = () => {
    if (state.hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/admin/themes');
      }
    } else {
      navigate('/admin/themes');
    }
  };

  const getPreviewClasses = () => {
    const device = state.previewDevice;
    switch (device) {
      case 'mobile': return 'max-w-sm mx-auto';
      case 'tablet': return 'max-w-2xl mx-auto';
      default: return 'w-full';
    }
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
            <h1 className="text-2xl font-bold">Theme Settings</h1>
            <p className="text-muted-foreground">
              Customize {currentTheme.metadata.name} appearance and behavior
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state.hasChanges && (
            <Badge variant="secondary">Unsaved Changes</Badge>
          )}
          
          {state.saveStatus === 'saved' && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}

          {/* Device Preview Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={state.previewDevice === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, previewDevice: 'desktop' }))}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={state.previewDevice === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, previewDevice: 'tablet' }))}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={state.previewDevice === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, previewDevice: 'mobile' }))}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!state.hasChanges}
          >
            <Undo className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <Button
            onClick={handleSave}
            disabled={!state.hasChanges || state.saveStatus === 'saving'}
          >
            <Save className="h-4 w-4 mr-2" />
            {state.saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Settings Panel */}
        <div className="col-span-5">
          <Tabs defaultValue="colors" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color Scheme
                  </CardTitle>
                  <CardDescription>
                    Customize your theme colors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Color Presets */}
                  <div>
                    <Label className="text-sm font-medium">Quick Presets</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {PRESET_COLORS.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => applyColorPreset(preset)}
                          className="flex items-center gap-2"
                        >
                          <div className="flex gap-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: preset.primary }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: preset.secondary }}
                            />
                          </div>
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Individual Colors */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="primary-color"
                          type="color"
                          value={state.config.colors?.primary || '#3b82f6'}
                          onChange={(e) => updateConfig('colors.primary', e.target.value)}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          value={state.config.colors?.primary || '#3b82f6'}
                          onChange={(e) => updateConfig('colors.primary', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={state.config.colors?.secondary || '#64748b'}
                          onChange={(e) => updateConfig('colors.secondary', e.target.value)}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          value={state.config.colors?.secondary || '#64748b'}
                          onChange={(e) => updateConfig('colors.secondary', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="accent-color">Accent Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="accent-color"
                          type="color"
                          value={state.config.colors?.accent || '#f59e0b'}
                          onChange={(e) => updateConfig('colors.accent', e.target.value)}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          value={state.config.colors?.accent || '#f59e0b'}
                          onChange={(e) => updateConfig('colors.accent', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="background-color">Background Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="background-color"
                          type="color"
                          value={state.config.colors?.background || '#ffffff'}
                          onChange={(e) => updateConfig('colors.background', e.target.value)}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          value={state.config.colors?.background || '#ffffff'}
                          onChange={(e) => updateConfig('colors.background', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="foreground-color">Text Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="foreground-color"
                          type="color"
                          value={state.config.colors?.foreground || '#1f2937'}
                          onChange={(e) => updateConfig('colors.foreground', e.target.value)}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          value={state.config.colors?.foreground || '#1f2937'}
                          onChange={(e) => updateConfig('colors.foreground', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Typography
                  </CardTitle>
                  <CardDescription>
                    Configure fonts and text styles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="font-family">Font Family</Label>
                    <Select
                      value={state.config.typography?.fontFamily || 'Inter, system-ui, sans-serif'}
                      onValueChange={(value) => updateConfig('typography.fontFamily', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="base-font-size">Base Font Size</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Slider
                        value={[parseInt(state.config.typography?.fontSize?.base?.replace('px', '') || '16')]}
                        onValueChange={([value]) => updateConfig('typography.fontSize.base', `${value}px`)}
                        min={12}
                        max={24}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-right">
                        {state.config.typography?.fontSize?.base || '16px'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="small-font-size">Small Font Size</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Slider
                        value={[parseInt(state.config.typography?.fontSize?.sm?.replace('px', '') || '14')]}
                        onValueChange={([value]) => updateConfig('typography.fontSize.sm', `${value}px`)}
                        min={10}
                        max={20}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-right">
                        {state.config.typography?.fontSize?.sm || '14px'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="large-font-size">Large Font Size</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Slider
                        value={[parseInt(state.config.typography?.fontSize?.lg?.replace('px', '') || '18')]}
                        onValueChange={([value]) => updateConfig('typography.fontSize.lg', `${value}px`)}
                        min={16}
                        max={32}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-right">
                        {state.config.typography?.fontSize?.lg || '18px'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Layout & Spacing
                  </CardTitle>
                  <CardDescription>
                    Configure layout dimensions and spacing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="max-width">Container Max Width</Label>
                    <Select
                      value={state.config.layout?.maxWidth || '1200px'}
                      onValueChange={(value) => updateConfig('layout.maxWidth', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024px">1024px (Small)</SelectItem>
                        <SelectItem value="1200px">1200px (Medium)</SelectItem>
                        <SelectItem value="1400px">1400px (Large)</SelectItem>
                        <SelectItem value="1600px">1600px (Extra Large)</SelectItem>
                        <SelectItem value="100%">100% (Full Width)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Spacing Scale</Label>
                    <div className="space-y-2 mt-2">
                      {['xs', 'sm', 'md', 'lg', 'xl'].map((size) => (
                        <div key={size} className="flex items-center gap-2">
                          <Label className="w-8 text-xs uppercase">{size}</Label>
                          <Input
                            value={state.config.layout?.spacing?.[size] || '1rem'}
                            onChange={(e) => updateConfig(`layout.spacing.${size}`, e.target.value)}
                            className="flex-1"
                            placeholder="1rem"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Theme Features
                  </CardTitle>
                  <CardDescription>
                    Enable or disable theme features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dark-mode">Dark Mode Support</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable automatic dark mode switching
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={state.config.features?.darkMode || false}
                      onCheckedChange={(checked) => updateConfig('features.darkMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="animations">Animations</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable smooth transitions and animations
                      </p>
                    </div>
                    <Switch
                      id="animations"
                      checked={state.config.features?.animations || false}
                      onCheckedChange={(checked) => updateConfig('features.animations', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="lazy-loading">Lazy Loading</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable lazy loading for images and components
                      </p>
                    </div>
                    <Switch
                      id="lazy-loading"
                      checked={state.config.features?.lazyLoading || false}
                      onCheckedChange={(checked) => updateConfig('features.lazyLoading', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
                <Badge variant="outline" className="ml-auto">
                  {state.previewDevice}
                </Badge>
              </CardTitle>
              <CardDescription>
                See your changes in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`border rounded-lg p-4 bg-muted/20 ${getPreviewClasses()}`}>
                <div 
                  className="space-y-4 p-6 rounded-lg"
                  style={{
                    backgroundColor: state.config.colors?.background,
                    color: state.config.colors?.foreground,
                    fontFamily: state.config.typography?.fontFamily,
                    fontSize: state.config.typography?.fontSize?.base
                  }}
                >
                  {/* Preview Header */}
                  <div 
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: state.config.colors?.primary, color: state.config.colors?.background }}
                  >
                    <h1 className="text-xl font-bold">Theme Preview</h1>
                    <p className="opacity-90">This is how your theme will look</p>
                  </div>

                  {/* Preview Content */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Sample Content</h2>
                    <p>
                      This is a paragraph of text using your selected typography settings. 
                      The font family is {state.config.typography?.fontFamily} with a base size of {state.config.typography?.fontSize?.base}.
                    </p>
                    
                    <div className="flex gap-2">
                      <button 
                        className="px-4 py-2 rounded"
                        style={{ backgroundColor: state.config.colors?.primary, color: state.config.colors?.background }}
                      >
                        Primary Button
                      </button>
                      <button 
                        className="px-4 py-2 rounded border"
                        style={{ 
                          borderColor: state.config.colors?.secondary, 
                          color: state.config.colors?.secondary 
                        }}
                      >
                        Secondary Button
                      </button>
                      <button 
                        className="px-4 py-2 rounded"
                        style={{ backgroundColor: state.config.colors?.accent, color: state.config.colors?.background }}
                      >
                        Accent Button
                      </button>
                    </div>

                    <div 
                      className="p-4 rounded border-l-4"
                      style={{ 
                        borderLeftColor: state.config.colors?.accent,
                        backgroundColor: `${state.config.colors?.accent}10`
                      }}
                    >
                      <p className="font-medium">Sample Alert</p>
                      <p className="text-sm opacity-75">This shows how alerts and callouts will appear with your color scheme.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}