import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  RefreshCw, 
  Eye, 
  Code,
  Maximize2,
  Minimize2,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

interface LivePreviewProps {
  previewUrl?: string;
  theme?: string;
  onDeviceChange?: (device: 'desktop' | 'tablet' | 'mobile') => void;
  initialDevice?: 'desktop' | 'tablet' | 'mobile';
  compactMode?: boolean;
}

const DEVICE_SIZES = {
  desktop: { width: '100%', height: '100%', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' }
};

export function LivePreview({ 
  previewUrl = '/', 
  theme, 
  onDeviceChange,
  initialDevice = 'desktop',
  compactMode = false
}: LivePreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>(initialDevice);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [zoom, setZoom] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    onDeviceChange?.(device);
  }, [device, onDeviceChange]);

  const handleDeviceChange = (newDevice: 'desktop' | 'tablet' | 'mobile') => {
    setDevice(newDevice);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
    setIsLoading(true);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleResetView = () => {
    setZoom(100);
    setDevice('desktop');
    setIframeKey(prev => prev + 1);
    setIsLoading(true);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    
    if (iframeRef.current && theme) {
      try {
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc) {
          const themeIndicator = iframeDoc.createElement('div');
          themeIndicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 9999;
          `;
          themeIndicator.textContent = `Theme: ${theme}`;
          iframeDoc.body?.appendChild(themeIndicator);
        }
      } catch (error) {
        console.warn('Cannot access iframe content:', error);
      }
    }
  };

  const handleOpenExternal = () => {
    // Open the resolved preview URL in a new tab
    try {
      window.open(resolvedPreviewUrl, '_blank');
    } catch (e) {
      // Fallback to previewUrl if something goes wrong
      window.open(previewUrl, '_blank');
    }
  };

  const deviceSize = DEVICE_SIZES[device];
  
  // Resolve preview URL with base path.
  // Prefer the build-time BASE_URL, but if it's '/' (root) try to infer the base
  // from the current pathname so previews opened from /stencil/admin will
  // correctly point to /stencil/... on GitHub Pages.
  const getAppBase = () => {
    const base = import.meta.env.BASE_URL || '/';
    if (base && base !== '/') return base;
    // infer first path segment as base (e.g., /stencil/ from /stencil/admin)
    const seg = window.location.pathname.split('/').filter(Boolean)[0];
    return seg ? `/${seg}/` : '/';
  };

  const appBase = getAppBase();
  const resolvedPreviewUrl = previewUrl.startsWith('http')
    ? previewUrl
    : `${window.location.origin}${appBase.replace(/\/+$/,'')}/${previewUrl.replace(/^\//,'')}`;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <Card className={`${isFullscreen ? 'h-full rounded-none border-0' : 'h-full'}`}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                Real-time preview of your theme across different devices
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!compactMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCode(!showCode)}
                >
                  <Code className="h-4 w-4 mr-2" />
                  {showCode ? 'Hide' : 'Show'} Code
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetView} title="Reset View">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenExternal} title="Open in New Tab">
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showCode && !compactMode && (
            <div className="mb-4 p-4 border rounded-md bg-gray-50">
              <p className="text-sm font-medium mb-2">Iframe Source:</p>
              <code className="text-xs bg-white p-2 rounded block overflow-x-auto">
                {`<iframe src="${previewUrl}" width="${deviceSize.width}" height="${deviceSize.height}" />`}
              </code>
            </div>
          )}

          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <Tabs value={device} onValueChange={(v) => handleDeviceChange(v as any)}>
              <TabsList>
                <TabsTrigger value="desktop" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop
                </TabsTrigger>
                <TabsTrigger value="tablet" className="gap-2">
                  <Tablet className="h-4 w-4" />
                  Tablet
                </TabsTrigger>
                <TabsTrigger value="mobile" className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Badge variant="outline">
              {deviceSize.width} × {deviceSize.height}
            </Badge>
            
            {theme && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Theme: {theme}
              </Badge>
            )}
          </div>

          <div 
            className="relative bg-gray-100 rounded-lg p-4 flex items-center justify-center overflow-auto"
            style={{
              minHeight: compactMode ? '400px' : '600px',
              height: isFullscreen ? 'calc(100vh - 300px)' : compactMode ? '500px' : '700px'
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Loading preview...</p>
                </div>
              </div>
            )}

            <div
              className={`bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300 ${
                device === 'desktop' ? 'w-full h-full' : ''
              }`}
              style={{
                width: device !== 'desktop' ? deviceSize.width : '100%',
                height: device !== 'desktop' ? deviceSize.height : '100%',
                maxWidth: '100%',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center'
              }}
            >
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={resolvedPreviewUrl}
                className="w-full h-full border-0"
                title="Live Preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                onLoad={handleIframeLoad}
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500 text-center">
            <p>
              Preview is sandboxed and isolated from the main application
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SplitPreviewProps {
  leftUrl: string;
  rightUrl: string;
  leftLabel?: string;
  rightLabel?: string;
}

export function SplitPreview({ 
  leftUrl, 
  rightUrl, 
  leftLabel = 'Before', 
  rightLabel = 'After' 
}: SplitPreviewProps) {
  const [leftLoading, setLeftLoading] = useState(true);
  const [rightLoading, setRightLoading] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Split Preview</CardTitle>
        <CardDescription>Compare two versions side by side</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{leftLabel}</Badge>
              {leftLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                src={leftUrl}
                className="w-full h-[600px] border-0"
                title={leftLabel}
                sandbox="allow-same-origin allow-scripts"
                onLoad={() => setLeftLoading(false)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{rightLabel}</Badge>
              {rightLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                src={rightUrl}
                className="w-full h-[600px] border-0"
                title={rightLabel}
                sandbox="allow-same-origin allow-scripts"
                onLoad={() => setRightLoading(false)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
