import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, CheckCircle2, Package, Info, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { pluginService } from '@/services/api/plugins';
import { Plugin } from '@/types/plugin';

export default function PluginDetails() {
  const { pluginName } = useParams<{ pluginName: string }>();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [installationStatus, setInstallationStatus] = useState<string | null>(null);
  const [installationUuid, setInstallationUuid] = useState<string | null>(null);

  const fetchPluginDetails = async () => {
    if (!pluginName) return;
    
    setIsLoading(true);
    try {
      const data = await pluginService.getPluginDetails(pluginName);
      setPlugin(data);
      
      // Check if plugin already requested/installed
      const installedPlugins = await pluginService.getInstalledPlugins();
      const existingInstallation = installedPlugins.find(p => p.plugin_name === pluginName);
      
      if (existingInstallation) {
        setInstallationStatus(existingInstallation.status);
        setInstallationUuid(existingInstallation.uuid);
      }
    } catch (error: any) {
      toast.error('Failed to load plugin details', {
        description: error.message || 'Unable to fetch plugin information',
      });
      navigate('/admin/plugins/marketplace');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPluginDetails();
  }, [pluginName]);

  const handleRequestInstall = async () => {
    if (!plugin) return;

    setIsRequesting(true);
    try {
      const response = await pluginService.requestPlugin({ plugin_name: plugin.name });
      toast.success('Plugin installation requested', {
        description: response.message || 'Your request has been submitted for approval',
      });
      navigate('/admin/plugins/installed');
    } catch (error: any) {
      toast.error('Request failed', {
        description: error.message || 'Unable to request plugin installation',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plugin) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/plugins/marketplace')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-light bg-clip-text text-transparent">
            {plugin.display_name}
          </h1>
          <p className="text-muted-foreground mt-1">by {plugin.author}</p>
        </div>
        {installationStatus ? (
          installationStatus === 'active' ? (
            <Button
              onClick={() => navigate(`/admin/plugins/installed/${installationUuid}`)}
              variant="outline"
              className="border-green-500 text-green-600 dark:text-green-400"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Installed
            </Button>
          ) : installationStatus === 'pending' ? (
            <Button
              disabled
              variant="outline"
              className="border-yellow-500 text-yellow-600 dark:text-yellow-400"
            >
              <Clock className="w-4 h-4 mr-2" />
              Pending Approval
            </Button>
          ) : installationStatus === 'approved' ? (
            <Button
              disabled
              variant="outline"
              className="border-blue-500 text-blue-600 dark:text-blue-400"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approved - Awaiting Installation
            </Button>
          ) : installationStatus === 'rejected' ? (
            <Button
              onClick={handleRequestInstall}
              disabled={isRequesting}
              variant="outline"
              className="border-red-500 text-red-600 dark:text-red-400"
            >
              <Download className="w-4 h-4 mr-2" />
              {isRequesting ? 'Requesting...' : 'Request Again'}
            </Button>
          ) : (
            <Button
              onClick={() => navigate(`/admin/plugins/installed/${installationUuid}`)}
              variant="outline"
            >
              <Info className="w-4 h-4 mr-2" />
              View Status
            </Button>
          )
        ) : (
          <Button
            onClick={handleRequestInstall}
            disabled={isRequesting}
            className="bg-gradient-to-r from-primary to-orange-light hover:opacity-90"
          >
            <Download className="w-4 h-4 mr-2" />
            {isRequesting ? 'Requesting...' : 'Request Install'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">
                {plugin.description}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">
                <Info className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="changelog">
                <FileText className="w-4 h-4 mr-2" />
                Changelog
              </TabsTrigger>
              <TabsTrigger value="requirements">
                <Package className="w-4 h-4 mr-2" />
                Requirements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Features</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Professional plugin architecture</li>
                        <li>Easy configuration and setup</li>
                        <li>Seamless integration with your system</li>
                        <li>Regular updates and support</li>
                      </ul>
                    </div>
                    {plugin.screenshots && plugin.screenshots.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Screenshots</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {plugin.screenshots.map((screenshot, index) => (
                            <img
                              key={index}
                              src={screenshot}
                              alt={`Screenshot ${index + 1}`}
                              className="rounded-lg border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="changelog" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  {plugin.changelog && plugin.changelog.length > 0 ? (
                    <div className="space-y-4">
                      {plugin.changelog.map((entry, index) => (
                        <div key={index}>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">v{entry.version}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                            {entry.changes.map((change, idx) => (
                              <li key={idx}>{change}</li>
                            ))}
                          </ul>
                          {index < plugin.changelog!.length - 1 && (
                            <Separator className="my-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No changelog available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  {plugin.requirements ? (
                    <div className="space-y-3">
                      {plugin.requirements.php && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">PHP Version</span>
                          <Badge variant="secondary">{plugin.requirements.php}</Badge>
                        </div>
                      )}
                      {plugin.requirements.laravel && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Laravel Version</span>
                          <Badge variant="secondary">{plugin.requirements.laravel}</Badge>
                        </div>
                      )}
                      {plugin.requirements.dependencies && (
                        <>
                          <Separator className="my-4" />
                          <div>
                            <h4 className="text-sm font-medium mb-3">Dependencies</h4>
                            <div className="space-y-2">
                              {Object.entries(plugin.requirements.dependencies).map(
                                ([name, version]) => (
                                  <div
                                    key={name}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <span className="text-muted-foreground">{name}</span>
                                    <Badge variant="outline">{version}</Badge>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No specific requirements</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Version</div>
                <Badge variant="secondary">{plugin.version}</Badge>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-1">Author</div>
                <p className="text-sm text-muted-foreground">{plugin.author}</p>
              </div>
              {plugin.tags && plugin.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {plugin.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Installation Process</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Click "Request Install" to submit your request</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Platform admin will review your request</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Once approved, plugin installs automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <span>Configure and start using the plugin</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
