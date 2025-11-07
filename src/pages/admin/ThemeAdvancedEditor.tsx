import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Code, 
  Eye, 
  History, 
  Search, 
  Settings,
  Sparkles
} from 'lucide-react';
import { ThemeCodeEditor } from '@/components/admin/ThemeCodeEditor';
import { LivePreview } from '@/components/admin/LivePreview';
import { VersionHistory } from '@/components/admin/VersionHistory';
import { SearchReplace } from '@/components/admin/SearchReplace';
import { ThemeCustomizer } from '@/components/admin/ThemeCustomizer';
import { useTheme } from '@/core/engine/ThemeContext';
import { useThemeHooks } from '@/core/engine/hooks';

export default function ThemeAdvancedEditor() {
  const navigate = useNavigate();
  const { currentThemeName } = useTheme();
  const [activeTab, setActiveTab] = useState('editor');
  const { doAction } = useThemeHooks();

  const handleBackToDashboard = () => {
    navigate('/admin/themes');
  };

  React.useEffect(() => {
    doAction('admin.page.render', 'theme-advanced-editor');
  }, []);

  return (
    <div className="p-6 space-y-6">
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Advanced Theme Editor
            </h1>
            <p className="text-muted-foreground">
              Full-featured theme development environment with live preview, version control, and search
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {currentThemeName}
        </Badge>
      </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="editor" className="gap-2">
            <Code className="h-4 w-4" />
            Code Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Live Preview
          </TabsTrigger>
          <TabsTrigger value="version" className="gap-2">
            <History className="h-4 w-4" />
            Version Control
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search & Replace
          </TabsTrigger>
          <TabsTrigger value="customizer" className="gap-2">
            <Settings className="h-4 w-4" />
            Customizer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <div className="flex flex-col gap-4">
            <div>
              <ThemeCodeEditor themeName={currentThemeName} />
            </div>
            <div className="border-t pt-4">
              <LivePreview 
                previewUrl="/" 
                theme={currentThemeName}
                initialDevice="desktop"
                compactMode={true}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <LivePreview 
            previewUrl="/" 
            theme={currentThemeName}
          />
        </TabsContent>

        <TabsContent value="version" className="space-y-4">
          <VersionHistory />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <SearchReplace />
        </TabsContent>

        <TabsContent value="customizer" className="space-y-4">
          <ThemeCustomizer showPreview={true} />
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Phase 3 Features
        </h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✅ WordPress-like hooks system for extensibility</li>
          <li>✅ Git-like version control with commit history and rollback</li>
          <li>✅ Live preview with device selector and iframe sandbox</li>
          <li>✅ Real-time theme customizer with instant updates</li>
          <li>✅ Advanced search & replace across all theme files</li>
        </ul>
      </div>
    </div>
  );
}
