import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/core/engine/ThemeContext';
import { themeManager } from '@/core/engine/ThemeManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Palette, 
  Download, 
  Upload, 
  Settings, 
  Code, 
  Eye, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Users,
  Star,
  Calendar,
  Package,
  Store,
  Archive
} from 'lucide-react';

interface ThemeStats {
  totalThemes: number;
  activeTheme: string;
  lastUpdated: string;
  totalDownloads: number;
  averageRating: number;
}

interface ThemeInfo {
  name: string;
  version: string;
  author: string;
  description: string;
  isActive: boolean;
  thumbnail?: string;
  rating?: number;
  downloads?: number;
  lastUpdated?: string;
  size?: string;
  status: 'active' | 'installed' | 'available' | 'error';
}

export default function ThemeDashboard() {
  const navigate = useNavigate();
  const { 
    currentTheme, 
    currentThemeName, 
    isLoading, 
    error, 
    availableThemes, 
    setTheme,
    reloadTheme 
  } = useTheme();

  const [themeStats, setThemeStats] = useState<ThemeStats>({
    totalThemes: 0,
    activeTheme: 'default',
    lastUpdated: new Date().toISOString(),
    totalDownloads: 0,
    averageRating: 4.5
  });

  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadThemeData();
  }, [availableThemes, currentThemeName]);

  const loadThemeData = async () => {
    const themeInfos: ThemeInfo[] = [];
    
    for (const themeName of availableThemes) {
      try {
        const theme = themeManager.getTheme(themeName);
        const metadata = theme?.metadata || await themeManager.getThemeMetadata(themeName);
        
        themeInfos.push({
          name: themeName,
          version: metadata?.version || '1.0.0',
          author: metadata?.author || 'Unknown',
          description: metadata?.description || 'No description available',
          isActive: themeName === currentThemeName,
          thumbnail: metadata?.thumbnail,
          rating: 4.2 + Math.random() * 0.8, // Mock rating
          downloads: Math.floor(Math.random() * 1000) + 100, // Mock downloads
          lastUpdated: new Date().toISOString(),
          size: `${Math.floor(Math.random() * 500) + 100}KB`,
          status: themeName === currentThemeName ? 'active' : 'installed'
        });
      } catch (err) {
        themeInfos.push({
          name: themeName,
          version: '0.0.0',
          author: 'Unknown',
          description: 'Error loading theme information',
          isActive: false,
          status: 'error'
        });
      }
    }

    setThemes(themeInfos);
    setThemeStats({
      totalThemes: themeInfos.length,
      activeTheme: currentThemeName,
      lastUpdated: new Date().toISOString(),
      totalDownloads: themeInfos.reduce((sum, t) => sum + (t.downloads || 0), 0),
      averageRating: themeInfos.reduce((sum, t) => sum + (t.rating || 0), 0) / themeInfos.length
    });
  };

  const handleThemeActivation = async (themeName: string) => {
    try {
      await setTheme(themeName);
      await loadThemeData();
    } catch (err) {
      console.error('Failed to activate theme:', err);
    }
  };

  const handleDeleteTheme = async (themeName: string) => {
    if (themeName === currentThemeName) {
      alert('Cannot delete the currently active theme');
      return;
    }
    
    if (confirm(`Are you sure you want to delete the theme "${themeName}"?`)) {
      try {
        // TODO: Implement theme deletion in themeManager
        console.log('Deleting theme:', themeName);
        await loadThemeData();
      } catch (err) {
        console.error('Failed to delete theme:', err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'installed': return 'bg-blue-500';
      case 'available': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'installed': return <Package className="h-4 w-4" />;
      case 'available': return <Download className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Theme Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and customize your website themes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reloadTheme}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/admin/themes/upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Theme
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Theme Error: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Themes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{themeStats.totalThemes}</div>
            <p className="text-xs text-muted-foreground">
              {themes.filter(t => t.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Theme</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{themeStats.activeTheme}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{themeStats.totalDownloads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all themes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{themeStats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0 stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="installed">Installed Themes</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Theme Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Current Active Theme
              </CardTitle>
              <CardDescription>
                Information about your currently active theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentTheme ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{currentTheme.metadata.name}</h3>
                      <p className="text-muted-foreground">{currentTheme.metadata.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Version:</span>
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
                        <span className="font-medium">Assets:</span>
                        <p>{currentTheme.assets?.styles?.length || 0} stylesheets</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => navigate('/admin/themes/settings')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Customize
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate('/admin/themes/editor')}>
                        <Code className="h-4 w-4 mr-2" />
                        Edit Code
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate('/admin/themes/files')}>
                        <Eye className="h-4 w-4 mr-2" />
                        Files
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Theme Features</h4>
                      <div className="space-y-2">
                        {currentTheme.config?.features && Object.entries(currentTheme.config.features).map(([feature, enabled]) => (
                          <div key={feature} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
                            <Badge variant={enabled ? "default" : "secondary"}>
                              {enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Performance</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Load Time</span>
                          <span>Fast</span>
                        </div>
                        <Progress value={85} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span>Bundle Size</span>
                          <span>Optimized</span>
                        </div>
                        <Progress value={92} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active theme loaded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common theme management tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/admin/themes/marketplace')}>
                  <Store className="h-6 w-6 mb-2" />
                  Marketplace
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/admin/themes/upload')}>
                  <Upload className="h-6 w-6 mb-2" />
                  Upload Theme
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/admin/themes/packaging')}>
                  <Archive className="h-6 w-6 mb-2" />
                  Package Theme
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/admin/themes/editor')}>
                  <Code className="h-6 w-6 mb-2" />
                  Code Editor
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/admin/themes/advanced')}>
                  <Zap className="h-6 w-6 mb-2" />
                  Advanced
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/admin/themes/settings')}>
                  <Settings className="h-6 w-6 mb-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installed" className="space-y-4">
          <div className="grid gap-4">
            {themes.map((theme) => (
              <Card key={theme.name} className={`transition-all ${theme.isActive ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg ${getStatusColor(theme.status)} flex items-center justify-center text-white`}>
                        {getStatusIcon(theme.status)}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{theme.name}</h3>
                          {theme.isActive && <Badge>Active</Badge>}
                          <Badge variant="outline">v{theme.version}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{theme.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>By {theme.author}</span>
                          {theme.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {theme.rating.toFixed(1)}
                            </div>
                          )}
                          {theme.downloads && <span>{theme.downloads} downloads</span>}
                          {theme.size && <span>{theme.size}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!theme.isActive && (
                        <Button 
                          size="sm" 
                          onClick={() => handleThemeActivation(theme.name)}
                          disabled={isLoading}
                        >
                          Activate
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => navigate('/admin/themes/settings')}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate('/admin/themes/editor')}>
                        <Code className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate('/admin/themes/packaging')}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {!theme.isActive && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteTheme(theme.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme Marketplace</CardTitle>
              <CardDescription>
                Discover and install new themes for your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  The theme marketplace will be available in the next update
                </p>
                <Button variant="outline" onClick={() => navigate('/admin/themes/upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Custom Theme
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Configure global theme settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Settings Panel</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced theme configuration options will be available here
                </p>
                <Button variant="outline" onClick={() => navigate('/admin/themes/settings')}>
                  Configure Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}