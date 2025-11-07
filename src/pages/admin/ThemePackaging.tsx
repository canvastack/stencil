import React, { useState, useEffect } from 'react';
import { Package, Download, Check, FileArchive, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTheme } from '@/core/engine/ThemeContext';
import { themePackageManager, ExportOptions } from '@/core/engine/packaging/ThemePackageManager';
import { ThemeValidator } from '@/core/engine/validation/ThemeValidator';

export default function ThemePackaging() {
  const { currentTheme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeReadme: true,
    includeChangelog: true,
    includeLicense: true,
    includeScreenshots: true
  });
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (currentTheme) {
      validateTheme();
    }
  }, [currentTheme]);

  const validateTheme = async () => {
    if (!currentTheme) return;

    setIsValidating(true);
    try {
      const validator = new ThemeValidator();
      const result = await validator.validateTheme(currentTheme);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExportTheme = async () => {
    if (!currentTheme) {
      alert('No theme selected');
      return;
    }

    setIsExporting(true);

    try {
      const blob = await themePackageManager.exportThemeAsZip(currentTheme, exportOptions);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentTheme.metadata.name}-v${currentTheme.metadata.version}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Theme exported successfully!');
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleOption = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  if (!currentTheme) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Theme Selected</CardTitle>
            <CardDescription>Please select a theme to package and export</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Theme Packaging
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Export your theme as a distributable ZIP package
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Theme Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Theme Name</Label>
                    <p className="font-medium">{currentTheme.metadata.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Version</Label>
                    <p className="font-medium">v{currentTheme.metadata.version}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Author</Label>
                    <p className="font-medium">{currentTheme.metadata.author}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">License</Label>
                    <p className="font-medium">{currentTheme.metadata.license || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Description</Label>
                  <p className="text-sm">{currentTheme.metadata.description}</p>
                </div>

                {currentTheme.metadata.supports && (
                  <div>
                    <Label className="text-sm text-gray-500 mb-2 block">Features</Label>
                    <div className="flex flex-wrap gap-2">
                      {currentTheme.metadata.supports.map(feature => (
                        <Badge key={feature} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileArchive className="h-5 w-5" />
                  Export Options
                </CardTitle>
                <CardDescription>
                  Select which files to include in the package
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="readme"
                    checked={exportOptions.includeReadme}
                    onCheckedChange={() => toggleOption('includeReadme')}
                  />
                  <label htmlFor="readme" className="text-sm font-medium cursor-pointer">
                    Include README.md
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="changelog"
                    checked={exportOptions.includeChangelog}
                    onCheckedChange={() => toggleOption('includeChangelog')}
                  />
                  <label htmlFor="changelog" className="text-sm font-medium cursor-pointer">
                    Include CHANGELOG.md
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="license"
                    checked={exportOptions.includeLicense}
                    onCheckedChange={() => toggleOption('includeLicense')}
                  />
                  <label htmlFor="license" className="text-sm font-medium cursor-pointer">
                    Include LICENSE file
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="screenshots"
                    checked={exportOptions.includeScreenshots}
                    onCheckedChange={() => toggleOption('includeScreenshots')}
                  />
                  <label htmlFor="screenshots" className="text-sm font-medium cursor-pointer">
                    Include screenshots
                  </label>
                </div>
              </CardContent>
            </Card>

            {validationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {validationResult.isValid ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      Validation Results
                    </span>
                    <Badge variant={validationResult.isValid ? 'default' : 'destructive'}>
                      Score: {validationResult.score}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {validationResult.summary}
                    </AlertDescription>
                  </Alert>

                  {validationResult.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">
                        Errors ({validationResult.errors.length})
                      </h4>
                      <div className="space-y-2">
                        {validationResult.errors.slice(0, 5).map((error: any, index: number) => (
                          <Alert key={index} variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              <div className="font-medium">{error.message}</div>
                              {error.suggestion && (
                                <div className="text-xs mt-1 opacity-80">
                                  Suggestion: {error.suggestion}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-600 mb-2">
                        Warnings ({validationResult.warnings.length})
                      </h4>
                      <div className="space-y-2">
                        {validationResult.warnings.slice(0, 3).map((warning: any, index: number) => (
                          <Alert key={index}>
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              {warning.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    onClick={validateTheme}
                    disabled={isValidating}
                  >
                    {isValidating ? 'Validating...' : 'Re-validate'}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Package Preview</CardTitle>
                <CardDescription>Files that will be included</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span>theme.json</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span>components/</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span>styles/</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span>assets/</span>
                  </div>
                  
                  {exportOptions.includeReadme && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span>README.md</span>
                    </div>
                  )}
                  
                  {exportOptions.includeChangelog && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span>CHANGELOG.md</span>
                    </div>
                  )}
                  
                  {exportOptions.includeLicense && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span>LICENSE</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Package</CardTitle>
                <CardDescription>
                  Download theme as ZIP file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleExportTheme}
                  disabled={isExporting || (validationResult && !validationResult.isValid)}
                  className="w-full"
                  size="lg"
                >
                  {isExporting ? (
                    <>
                      <Package className="h-5 w-5 mr-2 animate-pulse" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Export Theme
                    </>
                  )}
                </Button>
                
                {validationResult && !validationResult.isValid && (
                  <p className="text-sm text-red-600 mt-2">
                    Fix validation errors before exporting
                  </p>
                )}
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                The exported package will be compatible with the Stencil Theme Engine
                and can be shared or uploaded to the marketplace.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
