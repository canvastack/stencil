import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import ThemeUploader from '@/components/admin/ThemeUploader';

export default function ThemeUpload() {
  const navigate = useNavigate();
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleUploadComplete = (themeName: string) => {
    setUploadStatus({
      type: 'success',
      message: `Theme "${themeName}" has been successfully installed and is ready to use.`
    });
  };

  const handleUploadError = (error: Error) => {
    setUploadStatus({
      type: 'error',
      message: `Upload failed: ${error.message}`
    });
  };

  const handleBackToDashboard = () => {
    navigate('/admin/themes');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold">Upload Theme</h1>
          <p className="text-muted-foreground">
            Install a new theme from a ZIP package
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {uploadStatus.type && (
        <Alert variant={uploadStatus.type === 'error' ? 'destructive' : 'default'}>
          {uploadStatus.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{uploadStatus.message}</AlertDescription>
        </Alert>
      )}

      {/* Upload Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Before You Upload</CardTitle>
          <CardDescription>
            Please ensure your theme package meets the following requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Required Files</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <code>theme.json</code> or <code>manifest.json</code> - Theme metadata</li>
                  <li>• <code>index.ts</code> or <code>index.js</code> - Main theme file</li>
                  <li>• <code>components/</code> - React components directory</li>
                  <li>• <code>assets/</code> - Images, fonts, and other assets</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Package Structure</h3>
                <div className="text-sm text-muted-foreground font-mono bg-muted/50 p-3 rounded">
                  <div>theme-name.zip</div>
                  <div>├── theme.json</div>
                  <div>├── index.ts</div>
                  <div>├── components/</div>
                  <div>│   ├── Header.tsx</div>
                  <div>│   └── Footer.tsx</div>
                  <div>├── assets/</div>
                  <div>│   ├── images/</div>
                  <div>│   └── styles/</div>
                  <div>└── README.md</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Theme Metadata (theme.json)</h3>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded font-mono">
                <pre>{`{
  "name": "My Custom Theme",
  "version": "1.0.0",
  "description": "A beautiful custom theme",
  "author": "Your Name",
  "license": "MIT",
  "compatibility": {
    "minVersion": "1.0.0"
  }
}`}</pre>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Test your theme locally before uploading</li>
                <li>• Use TypeScript for better development experience</li>
                <li>• Follow the existing component interfaces</li>
                <li>• Include a README.md with installation instructions</li>
                <li>• Optimize images and assets for web performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Uploader */}
      <ThemeUploader
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />

      {/* Success Actions */}
      {uploadStatus.type === 'success' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Theme Installed Successfully!</h3>
                <p className="text-muted-foreground">
                  Your theme has been installed and is ready to use.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <Button onClick={handleBackToDashboard}>
                  View All Themes
                </Button>
                <Button variant="outline" onClick={() => setUploadStatus({ type: null, message: '' })}>
                  Upload Another Theme
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}