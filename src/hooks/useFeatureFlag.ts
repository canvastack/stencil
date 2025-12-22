import { useEffect, useState } from 'react';
import { FeatureFlag } from '@/lib/featureFlags/flags';
import { featureFlagService, type FeatureFlagContext } from '@/services/featureFlagService';

export const useFeatureFlag = (flag: FeatureFlag): { isEnabled: boolean; isLoading: boolean } => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        setIsLoading(true);

        const context: FeatureFlagContext = {
          tenantId: localStorage.getItem('tenant_id') || undefined,
          userId: localStorage.getItem('user_id') || undefined,
          userEmail: localStorage.getItem('user_email') || undefined,
          accountType: localStorage.getItem('account_type') || undefined,
        };

        const enabled = await featureFlagService.isEnabled(flag, context);

        setIsEnabled(enabled);
      } catch (error) {
        console.error(`Failed to check feature flag ${flag}:`, error);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeatureFlag();
  }, [flag]);

  return { isEnabled, isLoading };
};

export const useFeatureFlags = (
  flags: FeatureFlag[]
): { 
  flags: Record<FeatureFlag, boolean>; 
  isLoading: boolean;
  refetch: () => Promise<void>;
} => {
  const [flagStates, setFlagStates] = useState<Record<FeatureFlag, boolean>>({} as Record<FeatureFlag, boolean>);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      setIsLoading(true);

      const context: FeatureFlagContext = {
        tenantId: localStorage.getItem('tenant_id') || undefined,
        userId: localStorage.getItem('user_id') || undefined,
        userEmail: localStorage.getItem('user_email') || undefined,
        accountType: localStorage.getItem('account_type') || undefined,
      };

      const results = await Promise.all(
        flags.map(async (flag) => ({
          flag,
          enabled: await featureFlagService.isEnabled(flag, context),
        }))
      );

      const states = results.reduce(
        (acc, { flag, enabled }) => ({
          ...acc,
          [flag]: enabled,
        }),
        {} as Record<FeatureFlag, boolean>
      );

      setFlagStates(states);
    } catch (error) {
      console.error('Failed to check feature flags:', error);
      const states = flags.reduce(
        (acc, flag) => ({ ...acc, [flag]: false }),
        {} as Record<FeatureFlag, boolean>
      );
      setFlagStates(states);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [flags.join(',')]);

  return {
    flags: flagStates,
    isLoading,
    refetch: fetchFlags,
  };
};

export const useAllFeatureFlags = (): {
  flags: Record<FeatureFlag, boolean>;
  isLoading: boolean;
  refetch: () => Promise<void>;
} => {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>({} as Record<FeatureFlag, boolean>);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllFlags = async () => {
    try {
      setIsLoading(true);

      const context: FeatureFlagContext = {
        tenantId: localStorage.getItem('tenant_id') || undefined,
        userId: localStorage.getItem('user_id') || undefined,
        userEmail: localStorage.getItem('user_email') || undefined,
        accountType: localStorage.getItem('account_type') || undefined,
      };

      const allFlags = await featureFlagService.getAllFlags(context);
      setFlags(allFlags);
    } catch (error) {
      console.error('Failed to fetch all feature flags:', error);
      setFlags({} as Record<FeatureFlag, boolean>);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFlags();
  }, []);

  return {
    flags,
    isLoading,
    refetch: fetchAllFlags,
  };
};
