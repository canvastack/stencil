import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Search,
  MoreVertical,
  Settings,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  Puzzle,
} from 'lucide-react';
import { toast } from 'sonner';
import { pluginService } from '@/services/api/plugins';
import { InstalledPlugin } from '@/types/plugin';
import { format } from 'date-fns';

export default function InstalledPlugins() {
  const navigate = useNavigate();
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uninstallDialog, setUninstallDialog] = useState<{
    open: boolean;
    plugin: InstalledPlugin | null;
  }>({ open: false, plugin: null });
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [deleteData, setDeleteData] = useState(false);

  const fetchInstalledPlugins = async () => {
    setIsLoading(true);
    try {
      const data = await pluginService.getInstalledPlugins();
      setPlugins(data);
    } catch (error: any) {
      toast.error('Failed to load installed plugins', {
        description: error.message || 'Unable to fetch your plugins',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstalledPlugins();
  }, []);

  const getStatusInfo = (status: InstalledPlugin['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          variant: 'secondary' as const,
          description: 'Waiting for approval',
        };
      case 'approved':
        return {
          icon: CheckCircle2,
          label: 'Approved',
          variant: 'default' as const,
          description: 'Installing...',
        };
      case 'active':
        return {
          icon: CheckCircle2,
          label: 'Active',
          variant: 'default' as const,
          description: 'Plugin is active',
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          variant: 'destructive' as const,
          description: 'Request was rejected',
        };
      case 'suspended':
        return {
          icon: AlertTriangle,
          label: 'Suspended',
          variant: 'destructive' as const,
          description: 'Plugin has been suspended',
        };
      case 'expired':
        return {
          icon: Calendar,
          label: 'Expired',
          variant: 'secondary' as const,
          description: 'Plugin license expired',
        };
      default:
        return {
          icon: Package,
          label: status,
          variant: 'outline' as const,
          description: '',
        };
    }
  };

  const handleUninstall = async () => {
    if (!uninstallDialog.plugin) return;

    setIsUninstalling(true);
    try {
      await pluginService.uninstallPlugin(uninstallDialog.plugin.uuid, { delete_data: deleteData });
      toast.success('Plugin uninstalled successfully');
      setUninstallDialog({ open: false, plugin: null });
      setDeleteData(false);
      fetchInstalledPlugins();
    } catch (error: any) {
      toast.error('Uninstall failed', {
        description: error.message || 'Unable to uninstall plugin',
      });
    } finally {
      setIsUninstalling(false);
    }
  };

  const handleViewDetails = (plugin: InstalledPlugin) => {
    navigate(`/admin/plugins/installed/${plugin.uuid}`);
  };

  const handleSettings = (plugin: InstalledPlugin) => {
    navigate(`/admin/plugins/installed/${plugin.uuid}/settings`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-light bg-clip-text text-transparent">
            Installed Plugins
          </h1>
          <p className="text-muted-foreground mt-1">Manage your installed plugins and requests</p>
        </div>
        <Button onClick={() => navigate('/admin/plugins/marketplace')}>
          <Search className="w-4 h-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Plugins</CardTitle>
          <CardDescription>
            {plugins.length} {plugins.length === 1 ? 'plugin' : 'plugins'} installed or pending
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : plugins.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No plugins installed</h3>
              <p className="text-muted-foreground mb-4">
                Browse the marketplace to find plugins for your application
              </p>
              <Button onClick={() => navigate('/admin/plugins/marketplace')}>
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {plugins.map((plugin) => {
                const statusInfo = getStatusInfo(plugin.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <Card key={plugin.uuid} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{plugin.display_name}</h3>
                            <Badge variant={statusInfo.variant}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <Badge variant="outline">{plugin.version}</Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                Requested on{' '}
                                {plugin.requested_at
                                  ? format(new Date(plugin.requested_at), 'PPP')
                                  : 'Unknown'}
                              </span>
                            </div>
                            
                            {plugin.installed_at && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>
                                  Installed on {format(new Date(plugin.installed_at), 'PPP')}
                                </span>
                              </div>
                            )}
                            
                            {plugin.expires_at && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Expires on {format(new Date(plugin.expires_at), 'PPP')}
                                </span>
                              </div>
                            )}
                            
                            {plugin.rejection_reason && (
                              <div className="flex items-center gap-2 text-destructive">
                                <XCircle className="w-4 h-4" />
                                <span>{plugin.rejection_reason}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(plugin)}>
                              <Package className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {plugin.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleSettings(plugin)}>
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                              </DropdownMenuItem>
                            )}
                            {(plugin.status === 'active' || plugin.status === 'suspended') && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setUninstallDialog({ open: true, plugin })
                                }
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Uninstall
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={uninstallDialog.open}
        onOpenChange={(open) =>
          !isUninstalling && setUninstallDialog({ open, plugin: uninstallDialog.plugin })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uninstall Plugin</DialogTitle>
            <DialogDescription>
              Are you sure you want to uninstall "{uninstallDialog.plugin?.display_name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteData}
                onChange={(e) => setDeleteData(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">
                Delete all plugin data (database tables, files, etc.)
              </span>
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              If unchecked, plugin data will be preserved for potential reinstallation
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUninstallDialog({ open: false, plugin: null })}
              disabled={isUninstalling}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUninstall}
              disabled={isUninstalling}
            >
              {isUninstalling ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uninstalling...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Uninstall
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
