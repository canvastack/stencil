import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeManager } from '@/core/engine/ThemeManagerProvider';
import { Download, Upload, Check, X } from 'lucide-react';

export function ThemeManagementUI() {
  const {
    activeTheme,
    installedThemes,
    installTheme,
    uninstallTheme,
    activateTheme,
    exportTheme,
  } = useThemeManager();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await installTheme(file);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to install theme');
    } finally {
      setIsUploading(false);
    }
  }, [installTheme]);

  const handleExport = useCallback(async (themeName: string) => {
    try {
      const blob = await exportTheme(themeName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${themeName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export theme:', error);
    }
  }, [exportTheme]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Theme Management</h2>
        <div className="flex items-center space-x-4">
          <Input
            type="file"
            accept=".zip"
            onChange={handleFileUpload}
            className="hidden"
            id="theme-upload"
          />
          <Button
            onClick={() => document.getElementById('theme-upload')?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Theme
          </Button>
        </div>
      </div>

      {uploadError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {uploadError}
        </div>
      )}

      <div className="grid gap-4">
        {installedThemes.map((theme) => (
          <div
            key={theme.metadata.name}
            className="flex items-center justify-between p-4 bg-card rounded-lg border"
          >
            <div>
              <h3 className="font-semibold">{theme.metadata.name}</h3>
              <p className="text-sm text-muted-foreground">
                Version {theme.metadata.version} by {theme.metadata.author}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {activeTheme?.metadata.name === theme.metadata.name ? (
                <Button variant="outline" className="text-primary" disabled>
                  <Check className="w-4 h-4 mr-2" />
                  Active
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => activateTheme(theme.metadata.name)}
                >
                  Activate
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => handleExport(theme.metadata.name)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              {activeTheme?.metadata.name !== theme.metadata.name && (
                <Button
                  variant="destructive"
                  onClick={() => uninstallTheme(theme.metadata.name)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Uninstall
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}