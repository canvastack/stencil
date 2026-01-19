import { useEffect, useState } from 'react';
import { Routes, Route, useRoutes } from 'react-router-dom';
import { pluginLoader } from '@/services/pluginLoader';
import type { RouteObject } from 'react-router-dom';

interface PluginRoutesProps {
  scope: 'admin' | 'public';
}

export function PluginRoutes({ scope }: PluginRoutesProps) {
  const [routes, setRoutes] = useState<RouteObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPluginRoutes = async () => {
      try {
        setLoading(true);
        
        await pluginLoader.loadInstalledPlugins('tenant');
        
        const pluginRoutes = pluginLoader.getPluginRoutes(scope);
        setRoutes(pluginRoutes);
      } catch (error) {
        console.error(`Failed to load ${scope} plugin routes:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadPluginRoutes();
  }, [scope]);

  const element = useRoutes(routes);

  if (loading) {
    return null;
  }

  return element;
}
