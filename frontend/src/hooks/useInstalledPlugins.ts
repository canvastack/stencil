import { useQuery } from '@tanstack/react-query';
import { pluginService } from '@/services/api/plugins';
import type { InstalledPlugin } from '@/types/plugin';
import { useAuthState } from '@/hooks/useAuthState';

export function useInstalledPlugins() {
  const { userType } = useAuthState();
  
  return useQuery<InstalledPlugin[]>({
    queryKey: ['installed-plugins', userType],
    queryFn: async () => {
      try {
        const plugins = await pluginService.getInstalledPlugins();
        console.log('[useInstalledPlugins] Fetched plugins:', plugins);
        return plugins;
      } catch (error) {
        console.error('[useInstalledPlugins] Error fetching plugins:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: userType === 'tenant',
  });
}

export function useActivePlugins() {
  const { data: plugins, ...rest } = useInstalledPlugins();
  
  const activePlugins = plugins?.filter(plugin => {
    const isActive = plugin.status === 'active';
    console.log(`[useActivePlugins] Plugin ${plugin.plugin_name}: status=${plugin.status}, active=${isActive}, hasMenu=${!!plugin.manifest?.menu}`);
    return isActive;
  }) || [];
  
  console.log('[useActivePlugins] Active plugins with menus:', activePlugins.filter(p => p.manifest?.menu));
  
  return {
    data: activePlugins,
    ...rest,
  };
}
