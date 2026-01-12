import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  Package,
  Settings,
  FileText,
  User,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { pluginService } from '@/services/api/plugins';
import { InstalledPlugin } from '@/types/plugin';
import { format } from 'date-fns';

export default function InstalledPluginDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<InstalledPlugin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPluginDetails = async () => {
    if (!uuid) return;

    setIsLoading(true);
    try {
      const data = await pluginService.getInstalledPluginDetails(uuid);
      setPlugin(data);
    } catch (error: any) {
      toast.error('Failed to load plugin details', {
        description: error.message || 'Unable to fetch plugin information',
      });
      navigate('/admin/plugins/installed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPluginDetails();
  }, [uuid]);

  const getStatusInfo = (status: InstalledPlugin['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending Approval',
          variant: 'secondary' as const,
          color: 'text-yellow-600 dark:text-yellow-500',
          borderColor: 'border-yellow-200 dark:border-yellow-900',
          bgColor: 'bg-yellow-50/50 dark:bg-yellow-950/30',
          circleColor: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400',
        };
      case 'approved':
        return {
          icon: CheckCircle2,
          label: 'Approved - Installing',
          variant: 'default' as const,
          color: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-200 dark:border-blue-900',
          bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
          circleColor: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
        };
      case 'active':
        return {
          icon: CheckCircle2,
          label: 'Active',
          variant: 'default' as const,
          color: 'text-green-600 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-900',
          bgColor: 'bg-green-50/50 dark:bg-green-950/30',
          circleColor: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          variant: 'destructive' as const,
          color: 'text-red-600 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-900',
          bgColor: 'bg-red-50/50 dark:bg-red-950/30',
          circleColor: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
        };
      case 'suspended':
        return {
          icon: AlertTriangle,
          label: 'Suspended',
          variant: 'destructive' as const,
          color: 'text-orange-600 dark:text-orange-400',
          borderColor: 'border-orange-200 dark:border-orange-900',
          bgColor: 'bg-orange-50/50 dark:bg-orange-950/30',
          circleColor: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
        };
      case 'expired':
        return {
          icon: Calendar,
          label: 'Expired',
          variant: 'secondary' as const,
          color: 'text-gray-600 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-800',
          bgColor: 'bg-gray-50/50 dark:bg-gray-950/30',
          circleColor: 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400',
        };
      default:
        return {
          icon: Package,
          label: status,
          variant: 'outline' as const,
          color: 'text-gray-600 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-800',
          bgColor: 'bg-gray-50/50 dark:bg-gray-950/30',
          circleColor: 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400',
        };
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

  const statusInfo = getStatusInfo(plugin.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/plugins/installed')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-light bg-clip-text text-transparent">
            {plugin.display_name}
          </h1>
          <p className="text-muted-foreground mt-1">Plugin Details</p>
        </div>
        {plugin.status === 'active' && (
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/plugins/installed/${uuid}/settings`)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className={`${statusInfo.borderColor} ${statusInfo.bgColor}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                <div>
                  <CardTitle className="text-base">{statusInfo.label}</CardTitle>
                  <CardDescription>Installation Timeline</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${
                    plugin.requested_at ? statusInfo.circleColor : 'bg-muted text-muted-foreground'
                  }`}>
                    1
                  </span>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Request Submitted</span>
                      {plugin.requested_at && (
                        <CheckCircle2 className={`w-4 h-4 ${statusInfo.color}`} />
                      )}
                    </div>
                    {plugin.requested_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(plugin.requested_at), 'PPP p')}
                      </p>
                    )}
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${
                    plugin.approved_at || plugin.rejected_at ? statusInfo.circleColor : 'bg-muted text-muted-foreground'
                  }`}>
                    2
                  </span>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {plugin.rejected_at ? 'Request Rejected' : 'Platform Review'}
                      </span>
                      {plugin.approved_at && (
                        <CheckCircle2 className={`w-4 h-4 ${statusInfo.color}`} />
                      )}
                      {plugin.rejected_at && (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    {plugin.approved_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Approved on {format(new Date(plugin.approved_at), 'PPP p')}
                      </p>
                    )}
                    {plugin.rejected_at && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Rejected on {format(new Date(plugin.rejected_at), 'PPP p')}
                      </p>
                    )}
                    {!plugin.approved_at && !plugin.rejected_at && plugin.status === 'pending' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Waiting for platform admin approval
                      </p>
                    )}
                  </div>
                </li>

                {!plugin.rejected_at && (
                  <>
                    <li className="flex items-start gap-3">
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${
                        plugin.installed_at ? statusInfo.circleColor : 'bg-muted text-muted-foreground'
                      }`}>
                        3
                      </span>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Plugin Installed</span>
                          {plugin.installed_at && (
                            <CheckCircle2 className={`w-4 h-4 ${statusInfo.color}`} />
                          )}
                        </div>
                        {plugin.installed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Installed on {format(new Date(plugin.installed_at), 'PPP p')}
                          </p>
                        )}
                        {plugin.approved_at && !plugin.installed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Installing automatically...
                          </p>
                        )}
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${
                        plugin.status === 'active' ? statusInfo.circleColor : 'bg-muted text-muted-foreground'
                      }`}>
                        4
                      </span>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Ready to Use</span>
                          {plugin.status === 'active' && (
                            <CheckCircle2 className={`w-4 h-4 ${statusInfo.color}`} />
                          )}
                        </div>
                        {plugin.status === 'active' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Plugin is active and ready to use
                          </p>
                        )}
                        {plugin.expires_at && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires: {format(new Date(plugin.expires_at), 'PPP')}
                          </p>
                        )}
                      </div>
                    </li>
                  </>
                )}

                {plugin.rejection_reason && (
                  <li className="flex items-start gap-3 mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        Rejection Reason
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {plugin.rejection_reason}
                      </p>
                    </div>
                  </li>
                )}
              </ol>
            </CardContent>
          </Card>

          <Tabs defaultValue="manifest" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manifest">
                <Info className="w-4 h-4 mr-2" />
                Manifest
              </TabsTrigger>
              <TabsTrigger value="approval">
                <FileText className="w-4 h-4 mr-2" />
                Approval Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manifest" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  {plugin.manifest ? (
                    <div className="space-y-4">
                      {plugin.manifest.description && (
                        <div>
                          <h3 className="font-semibold mb-2">Description</h3>
                          <p className="text-sm text-muted-foreground">
                            {plugin.manifest.description}
                          </p>
                        </div>
                      )}

                      {plugin.manifest.author && (
                        <div>
                          <h3 className="font-semibold mb-2">Author</h3>
                          <p className="text-sm text-muted-foreground">
                            {plugin.manifest.author}
                          </p>
                        </div>
                      )}

                      {plugin.manifest.requires && (
                        <div>
                          <h3 className="font-semibold mb-2">Requirements</h3>
                          <div className="space-y-2">
                            {plugin.manifest.requires.php && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">PHP</span>
                                <Badge variant="outline">{plugin.manifest.requires.php}</Badge>
                              </div>
                            )}
                            {plugin.manifest.requires.laravel && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Laravel</span>
                                <Badge variant="outline">{plugin.manifest.requires.laravel}</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {plugin.manifest.permissions && plugin.manifest.permissions.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Permissions</h3>
                          <div className="flex flex-wrap gap-1">
                            {plugin.manifest.permissions.map((permission: string) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No manifest data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approval" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {plugin.requested_by && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Requested By
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {typeof plugin.requested_by === 'string'
                            ? plugin.requested_by
                            : plugin.requested_by.name}
                        </p>
                      </div>
                    )}

                    {plugin.approved_by && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Approved By
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {typeof plugin.approved_by === 'string'
                            ? plugin.approved_by
                            : plugin.approved_by.name}
                        </p>
                      </div>
                    )}

                    {plugin.approval_notes && (
                      <div>
                        <h3 className="font-semibold mb-2">Approval Notes</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {plugin.approval_notes}
                        </p>
                      </div>
                    )}

                    {plugin.rejected_by && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Rejected By
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {typeof plugin.rejected_by === 'string'
                            ? plugin.rejected_by
                            : plugin.rejected_by.name}
                        </p>
                      </div>
                    )}

                    {plugin.rejection_reason && (
                      <div>
                        <h3 className="font-semibold mb-2 text-destructive">
                          Rejection Reason
                        </h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {plugin.rejection_reason}
                        </p>
                      </div>
                    )}

                    {!plugin.requested_by &&
                      !plugin.approved_by &&
                      !plugin.rejected_by && (
                        <p className="text-muted-foreground">
                          No approval information available
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Plugin Name</div>
                <p className="text-sm text-muted-foreground">{plugin.plugin_name}</p>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-1">Status</div>
                <Badge variant={statusInfo.variant}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-1">Version</div>
                <Badge variant="outline">{plugin.version}</Badge>
              </div>
            </CardContent>
          </Card>

          {plugin.settings && Object.keys(plugin.settings).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                  {JSON.stringify(plugin.settings, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
