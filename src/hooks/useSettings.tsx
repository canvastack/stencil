import { useState, useEffect, useCallback } from 'react';
import { Settings } from '@/types/settings';
import { settingsService } from '@/services/mock/settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (updates: Partial<Settings>): Promise<boolean> => {
    try {
      setUpdating(true);
      setError(null);
      const updatedSettings = await settingsService.updateSettings(updates);
      setSettings(updatedSettings);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update settings'));
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const resetSettings = async (): Promise<boolean> => {
    try {
      setUpdating(true);
      setError(null);
      const resetData = await settingsService.resetSettings();
      setSettings(resetData);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reset settings'));
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    settings,
    loading,
    error,
    updating,
    updateSettings,
    resetSettings,
    refresh: loadSettings,
  };
};

export const useGeneralSettings = () => {
  const [settings, setSettings] = useState<Settings['general'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await settingsService.getGeneralSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load general settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (updates: Partial<Settings['general']>): Promise<boolean> => {
    try {
      setUpdating(true);
      setError(null);
      const updatedSettings = await settingsService.updateGeneralSettings(updates);
      setSettings(updatedSettings);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update general settings'));
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    settings,
    loading,
    error,
    updating,
    updateSettings,
    refresh: loadSettings,
  };
};

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<Settings['notifications'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await settingsService.getNotificationSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load notification settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (updates: Partial<Settings['notifications']>): Promise<boolean> => {
    try {
      setUpdating(true);
      setError(null);
      const updatedSettings = await settingsService.updateNotificationSettings(updates);
      setSettings(updatedSettings);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update notification settings'));
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    settings,
    loading,
    error,
    updating,
    updateSettings,
    refresh: loadSettings,
  };
};

export const useSecuritySettings = () => {
  const [settings, setSettings] = useState<Settings['security'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSecuritySettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load security settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (updates: Partial<Settings['security']>): Promise<boolean> => {
    try {
      setUpdating(true);
      setError(null);
      const updatedSettings = await settingsService.updateSecuritySettings(updates);
      setSettings(updatedSettings);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update security settings'));
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    settings,
    loading,
    error,
    updating,
    updateSettings,
    refresh: loadSettings,
  };
};
