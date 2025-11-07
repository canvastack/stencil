import React from 'react';
import { useTheme } from '@/core/engine/ThemeContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export function ThemeSwitcher() {
  const { 
    currentTheme, 
    currentThemeName, 
    isLoading, 
    error, 
    availableThemes, 
    setTheme, 
    reloadTheme 
  } = useTheme();

  const handleThemeChange = async (themeName: string) => {
    try {
      await setTheme(themeName);
    } catch (err) {
      console.error('Failed to switch theme:', err);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Theme Switcher
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {error && <AlertCircle className="h-4 w-4 text-red-500" />}
          {!isLoading && !error && <CheckCircle className="h-4 w-4 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Switch between available themes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Theme Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Theme:</span>
            <Badge variant="outline">{currentThemeName}</Badge>
          </div>
          
          {currentTheme && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Name: {currentTheme.metadata.name}</div>
              <div>Version: {currentTheme.metadata.version}</div>
              <div>Author: {currentTheme.metadata.author}</div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-800 font-medium">Theme Error</div>
            <div className="text-xs text-red-600 mt-1">{error.message}</div>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={reloadTheme}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Theme Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Theme:</label>
          <Select 
            value={currentThemeName} 
            onValueChange={handleThemeChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              {availableThemes.map((themeName) => (
                <SelectItem key={themeName} value={themeName}>
                  {themeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Available Themes List */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Available Themes:</div>
          <div className="flex flex-wrap gap-1">
            {availableThemes.map((themeName) => (
              <Badge 
                key={themeName} 
                variant={themeName === currentThemeName ? "default" : "secondary"}
                className="text-xs cursor-pointer"
                onClick={() => handleThemeChange(themeName)}
              >
                {themeName}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={reloadTheme}
            disabled={isLoading}
          >
            Reload Theme
          </Button>
        </div>

        {/* Debug Info */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
            {JSON.stringify({
              currentThemeName,
              isLoading,
              error: error?.message,
              availableThemes,
              hasCurrentTheme: !!currentTheme
            }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}

export default ThemeSwitcher;