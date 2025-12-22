import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  X, 
  FileArchive,
  Loader2,
  Info
} from 'lucide-react';
import { validateThemePackage, type ValidationResult } from '@/core/engine/utils/themeValidator';
import JSZip from 'jszip';

interface ThemeUploadProps {
  onUploadComplete?: (themeName: string) => void;
  onUploadError?: (error: Error) => void;
}

interface UploadState {
  file: File | null;
  isUploading: boolean;
  uploadProgress: number;
  validationResult: ValidationResult | null;
  extractedFiles: { [key: string]: string } | null;
  previewData: any;
}

export function ThemeUploader({ onUploadComplete, onUploadError }: ThemeUploadProps) {
  const [state, setState] = useState<UploadState>({
    file: null,
    isUploading: false,
    uploadProgress: 0,
    validationResult: null,
    extractedFiles: null,
    previewData: null
  });

  const resetState = () => {
    setState({
      file: null,
      isUploading: false,
      uploadProgress: 0,
      validationResult: null,
      extractedFiles: null,
      previewData: null
    });
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setState(prev => ({
        ...prev,
        validationResult: {
          isValid: false,
          errors: ['Only ZIP files are supported'],
          warnings: []
        }
      }));
      return;
    }

    setState(prev => ({ ...prev, file, uploadProgress: 10 }));

    try {
      // Extract and validate ZIP file
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      setState(prev => ({ ...prev, uploadProgress: 30 }));

      // Extract files
      const extractedFiles: { [key: string]: string } = {};
      const filePromises: Promise<void>[] = [];

      zipContent.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          filePromises.push(
            zipEntry.async('text').then(content => {
              extractedFiles[relativePath] = content;
            })
          );
        }
      });

      await Promise.all(filePromises);
      setState(prev => ({ ...prev, extractedFiles, uploadProgress: 60 }));

      // Look for theme manifest
      let themeData = null;
      let manifestPath = '';

      // Check for different manifest file locations
      const possibleManifests = [
        'theme.json',
        'manifest.json',
        'package.json',
        'index.js',
        'index.ts'
      ];

      for (const manifest of possibleManifests) {
        if (extractedFiles[manifest]) {
          manifestPath = manifest;
          try {
            if (manifest.endsWith('.json')) {
              themeData = JSON.parse(extractedFiles[manifest]);
            } else {
              // For JS/TS files, we'll need to extract theme data differently
              themeData = { name: 'Custom Theme', version: '1.0.0' };
            }
            break;
          } catch (err) {
            console.warn(`Failed to parse ${manifest}:`, err);
          }
        }
      }

      setState(prev => ({ ...prev, uploadProgress: 80 }));

      // Validate theme package
      const packageData = {
        manifest: themeData,
        theme: themeData,
        files: extractedFiles
      };

      const validationResult = validateThemePackage(packageData);
      
      setState(prev => ({ 
        ...prev, 
        validationResult,
        previewData: themeData,
        uploadProgress: 100
      }));

    } catch (error) {
      console.error('Failed to process ZIP file:', error);
      setState(prev => ({
        ...prev,
        validationResult: {
          isValid: false,
          errors: [`Failed to process ZIP file: ${error}`],
          warnings: []
        },
        uploadProgress: 0
      }));
    }
  }, []);

  const handleUpload = async () => {
    if (!state.file || !state.extractedFiles || !state.validationResult?.isValid) {
      return;
    }

    setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    try {
      // Simulate upload process with progress
      for (let i = 0; i <= 100; i += 10) {
        setState(prev => ({ ...prev, uploadProgress: i }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Here you would implement the actual theme installation logic
      // For now, we'll simulate success
      const themeName = state.previewData?.name || 'Uploaded Theme';
      
      onUploadComplete?.(themeName);
      resetState();

    } catch (error) {
      console.error('Upload failed:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      onUploadError?.(err);
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    const zipFile = files.find(file => file.name.endsWith('.zip'));
    
    if (zipFile) {
      // Create a synthetic event to trigger file processing
      const syntheticEvent = {
        target: { files: [zipFile] }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileSelect(syntheticEvent);
    }
  }, [handleFileSelect]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Theme Package
        </CardTitle>
        <CardDescription>
          Upload a ZIP file containing your theme files and assets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            state.file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {state.file ? (
            <div className="space-y-2">
              <FileArchive className="h-12 w-12 text-green-600 mx-auto" />
              <div className="font-medium">{state.file.name}</div>
              <div className="text-sm text-muted-foreground">
                {(state.file.size / 1024 / 1024).toFixed(2)} MB
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetState}
                className="mt-2"
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-medium">Drop your theme ZIP file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <Label htmlFor="theme-upload" className="cursor-pointer">
                <Input
                  id="theme-upload"
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="outline" className="mt-2">
                  <File className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </Label>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {state.uploadProgress > 0 && state.uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{state.uploadProgress}%</span>
            </div>
            <Progress value={state.uploadProgress} className="h-2" />
          </div>
        )}

        {/* Validation Results */}
        {state.validationResult && (
          <div className="space-y-4">
            <Separator />
            
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                {state.validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                Validation Results
              </h3>

              {/* Errors */}
              {state.validationResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Errors found:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {state.validationResult.errors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {state.validationResult.warnings.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Warnings:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {state.validationResult.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Theme Preview */}
              {state.previewData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Theme Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p>{state.previewData.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Version:</span>
                        <p>{state.previewData.version || '1.0.0'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Author:</span>
                        <p>{state.previewData.author || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Files:</span>
                        <p>{Object.keys(state.extractedFiles || {}).length} files</p>
                      </div>
                    </div>
                    
                    {state.previewData.description && (
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {state.previewData.description}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {state.validationResult.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                      {state.validationResult.warnings.length > 0 && (
                        <Badge variant="secondary">
                          {state.validationResult.warnings.length} warnings
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Upload Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={resetState}
            disabled={state.isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!state.validationResult?.isValid || state.isUploading}
          >
            {state.isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Install Theme
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ThemeUploader;