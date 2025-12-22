import { useState, useMemo } from 'react';
import { 
  FeatureFlag, 
  featureFlagConfigs, 
  getFeatureFlagsByCategory,
  type FeatureFlagConfig 
} from '@/lib/featureFlags/flags';
import { featureFlagService } from '@/services/featureFlagService';
import { useAllFeatureFlags } from '@/hooks/useFeatureFlag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Settings, 
  BarChart, 
  RotateCcw, 
  Plus, 
  Search,
  Filter,
  Zap,
  Sparkles,
  Paintbrush,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

type FilterType = 'all' | 'enabled' | 'disabled';
type CategoryFilter = 'all' | 'performance' | 'feature' | 'ux' | 'technical';

const categoryIcons = {
  performance: Zap,
  feature: Sparkles,
  ux: Paintbrush,
  technical: Wrench,
};

export default function FeatureFlagsManagement() {
  const { flags: enabledFlags, isLoading, refetch } = useAllFeatureFlags();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [rollbackDialog, setRollbackDialog] = useState<FeatureFlag | null>(null);
  const [updatingFlags, setUpdatingFlags] = useState<Set<FeatureFlag>>(new Set());

  const allFlags = useMemo(() => {
    return Object.values(featureFlagConfigs);
  }, []);

  const filteredFlags = useMemo(() => {
    return allFlags.filter(flag => {
      const matchesSearch = flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          flag.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isEnabled = enabledFlags[flag.key] ?? flag.defaultValue;
      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'enabled' && isEnabled) ||
                           (statusFilter === 'disabled' && !isEnabled);
      
      const matchesCategory = categoryFilter === 'all' || flag.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [allFlags, enabledFlags, searchQuery, statusFilter, categoryFilter]);

  const handleToggleFlag = async (flag: FeatureFlag, enabled: boolean) => {
    setUpdatingFlags(prev => new Set([...prev, flag]));
    
    try {
      await featureFlagService.updateFlag(flag, enabled);
      await refetch();
      
      toast.success(
        `Feature flag ${enabled ? 'enabled' : 'disabled'}`,
        {
          description: featureFlagConfigs[flag].name,
        }
      );
    } catch (error) {
      console.error('Failed to toggle feature flag:', error);
      toast.error('Failed to update feature flag', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUpdatingFlags(prev => {
        const newSet = new Set(prev);
        newSet.delete(flag);
        return newSet;
      });
    }
  };

  const handleUpdateRollout = async (flag: FeatureFlag, percentage: number) => {
    setUpdatingFlags(prev => new Set([...prev, flag]));
    
    try {
      const isEnabled = enabledFlags[flag.key] ?? featureFlagConfigs[flag].defaultValue;
      await featureFlagService.updateFlag(flag, isEnabled, percentage);
      await refetch();
      
      toast.success('Rollout percentage updated', {
        description: `${featureFlagConfigs[flag].name} - ${percentage}%`,
      });
    } catch (error) {
      console.error('Failed to update rollout percentage:', error);
      toast.error('Failed to update rollout', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUpdatingFlags(prev => {
        const newSet = new Set(prev);
        newSet.delete(flag);
        return newSet;
      });
    }
  };

  const handleRollback = async (flag: FeatureFlag) => {
    setUpdatingFlags(prev => new Set([...prev, flag]));
    
    try {
      await featureFlagService.updateFlag(flag, false, 0);
      await refetch();
      
      toast.success('Feature flag rolled back', {
        description: featureFlagConfigs[flag].name,
      });
    } catch (error) {
      console.error('Failed to rollback feature flag:', error);
      toast.error('Failed to rollback', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUpdatingFlags(prev => {
        const newSet = new Set(prev);
        newSet.delete(flag);
        return newSet;
      });
      setRollbackDialog(null);
    }
  };

  const getCategoryStats = () => {
    const stats = {
      all: allFlags.length,
      performance: getFeatureFlagsByCategory('performance').length,
      feature: getFeatureFlagsByCategory('feature').length,
      ux: getFeatureFlagsByCategory('ux').length,
      technical: getFeatureFlagsByCategory('technical').length,
    };
    
    return stats;
  };

  const stats = getCategoryStats();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags Management</h1>
          <p className="text-muted-foreground mt-1">
            Control feature rollout and deployment with granular flags
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Flags</p>
              <p className="text-2xl font-bold">{stats.all}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Zap className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Performance</p>
              <p className="text-2xl font-bold">{stats.performance}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Features</p>
              <p className="text-2xl font-bold">{stats.feature}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Paintbrush className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">UX & Technical</p>
              <p className="text-2xl font-bold">{stats.ux + stats.technical}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feature flags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterType)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="feature">Features</SelectItem>
              <SelectItem value="ux">UX</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredFlags.map((config) => {
            const isEnabled = enabledFlags[config.key] ?? config.defaultValue;
            const isUpdating = updatingFlags.has(config.key);
            const CategoryIcon = categoryIcons[config.category];

            return (
              <Card key={config.key} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{config.name}</h3>
                      <Badge variant={isEnabled ? 'default' : 'secondary'}>
                        {isEnabled ? 'ENABLED' : 'DISABLED'}
                      </Badge>
                      <Badge variant="outline">{config.category}</Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {config.description}
                    </p>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Target Audience:</span>
                        <span className="ml-2 font-medium">{config.targetAudience}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rollout:</span>
                        <span className="ml-2 font-medium">{config.rolloutPercentage}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Permissions:</span>
                        <span className="ml-2 font-medium">
                          {config.requiredPermissions.length > 0 
                            ? config.requiredPermissions.join(', ')
                            : 'None'}
                        </span>
                      </div>
                    </div>

                    {config.dependencies.length > 0 && (
                      <div className="mb-4">
                        <span className="text-sm text-muted-foreground">Dependencies: </span>
                        {config.dependencies.map(dep => (
                          <Badge key={dep} variant="outline" className="ml-1">
                            {featureFlagConfigs[dep].name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Label>Enable Flag:</Label>
                    <Switch 
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggleFlag(config.key, checked)}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  <Separator orientation="vertical" className="h-6" />
                  
                  <div className="flex-1 flex items-center gap-4">
                    <Label className="min-w-24">Rollout %:</Label>
                    <Slider 
                      value={[config.rolloutPercentage]}
                      onValueChange={(value) => handleUpdateRollout(config.key, value[0])}
                      max={100}
                      step={5}
                      className="w-48"
                      disabled={isUpdating || !isEnabled}
                    />
                    <span className="min-w-12 text-sm font-medium">{config.rolloutPercentage}%</span>
                  </div>

                  {isEnabled && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setRollbackDialog(config.key)}
                      disabled={isUpdating}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rollback
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {filteredFlags.length === 0 && (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No feature flags found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </Card>

      <AlertDialog open={rollbackDialog !== null} onOpenChange={() => setRollbackDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback Feature Flag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable the feature flag "{rollbackDialog && featureFlagConfigs[rollbackDialog].name}" 
              and reset its rollout percentage to 0%. This action can be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rollbackDialog && handleRollback(rollbackDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
