import { useMemo } from 'react';
import { useActivePlugins } from '@/hooks/useInstalledPlugins';
import type { PluginMenu } from '@/types/plugin';
import * as LucideIcons from 'lucide-react';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  badge?: string;
  children?: {
    title: string;
    path: string;
    badge?: string;
    requiredRoles?: string[];
  }[];
  visibleFor?: 'platform' | 'tenant' | 'both';
  requiredRoles?: string[];
  position?: number;
}

function transformPluginMenuToMenuItem(pluginMenu: PluginMenu): MenuItem {
  const IconComponent = (LucideIcons as any)[pluginMenu.icon] || LucideIcons.FileType;
  
  return {
    title: pluginMenu.title,
    icon: IconComponent,
    position: pluginMenu.position,
    visibleFor: pluginMenu.visible_for || 'tenant',
    requiredRoles: pluginMenu.required_roles,
    children: pluginMenu.children?.map(child => ({
      title: child.title,
      path: child.path,
      badge: child.badge,
      requiredRoles: child.required_roles,
    })),
  };
}

export function usePluginMenuItems(baseMenuItems: MenuItem[]): MenuItem[] {
  const { data: activePlugins, isLoading } = useActivePlugins();

  const allMenuItems = useMemo(() => {
    if (isLoading) {
      console.log('[usePluginMenuItems] Still loading plugins...');
      return baseMenuItems.map((item, index) => ({
        ...item,
        position: item.position ?? index + 1,
      }));
    }

    console.log('[usePluginMenuItems] Active plugins:', activePlugins);

    const pluginMenus: MenuItem[] = activePlugins
      ?.filter(plugin => {
        const hasMenu = plugin.manifest?.menu;
        console.log(`[usePluginMenuItems] Plugin ${plugin.plugin_name}: hasMenu=${hasMenu}`, plugin.manifest?.menu);
        return hasMenu;
      })
      .map(plugin => {
        const menuItem = transformPluginMenuToMenuItem(plugin.manifest!.menu!);
        console.log(`[usePluginMenuItems] Transformed menu for ${plugin.plugin_name}:`, menuItem);
        return menuItem;
      }) || [];

    console.log('[usePluginMenuItems] Plugin menus:', pluginMenus);

    const baseItems = baseMenuItems.map((item, index) => ({
      ...item,
      position: item.position ?? index + 1,
    }));

    const combined = [...baseItems, ...pluginMenus];
    
    console.log('[usePluginMenuItems] Combined menu items (before sort):', combined);
    const sorted = combined.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    console.log('[usePluginMenuItems] Final sorted menu items:', sorted);
    
    return sorted;
  }, [activePlugins, baseMenuItems, isLoading]);

  return allMenuItems;
}
