import { FeatureFlag, featureFlagConfigs } from '@/lib/featureFlags/flags';
import { authService } from './api/auth';

export interface FeatureFlagContext {
  tenantId?: string;
  userId?: string;
  userEmail?: string;
  accountType?: string;
  tenantPlan?: string;
}

interface CacheEntry {
  value: boolean;
  timestamp: number;
}

interface FeatureFlagResponse {
  enabled: boolean;
  rolloutPercentage?: number;
  reason?: string;
}

interface AllFlagsResponse {
  flags: Record<FeatureFlag, boolean>;
}

class FeatureFlagService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  async isEnabled(flag: FeatureFlag, context?: FeatureFlagContext): Promise<boolean> {
    const cacheKey = this.getCacheKey(flag, context);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    try {
      const actualContext = context || this.getDefaultContext();
      const response = await this.checkWithBackend(flag, actualContext);
      const enabled = response.enabled;

      this.cache.set(cacheKey, {
        value: enabled,
        timestamp: Date.now(),
      });

      return enabled;
    } catch (error) {
      console.error('Feature flag service error:', error);

      const config = featureFlagConfigs[flag];
      return config?.defaultValue ?? false;
    }
  }

  async getAllFlags(context?: FeatureFlagContext): Promise<Record<FeatureFlag, boolean>> {
    try {
      const actualContext = context || this.getDefaultContext();
      const response = await this.fetchAllFlags(actualContext);
      
      Object.entries(response.flags).forEach(([flag, enabled]) => {
        const cacheKey = this.getCacheKey(flag as FeatureFlag, actualContext);
        this.cache.set(cacheKey, {
          value: enabled,
          timestamp: Date.now(),
        });
      });

      return response.flags;
    } catch (error) {
      console.error('Failed to fetch all feature flags:', error);

      return Object.values(FeatureFlag).reduce(
        (acc, flag) => ({
          ...acc,
          [flag]: featureFlagConfigs[flag]?.defaultValue ?? false,
        }),
        {} as Record<FeatureFlag, boolean>
      );
    }
  }

  async updateFlag(
    flag: FeatureFlag,
    enabled: boolean,
    rolloutPercentage?: number
  ): Promise<void> {
    const token = authService.getToken();
    const accountType = authService.getAccountType();

    if (!token || accountType !== 'platform') {
      throw new Error('Unauthorized: Only platform admins can update feature flags');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/platform/feature-flags/${flag}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Account-Type': accountType,
      },
      body: JSON.stringify({
        enabled,
        rollout_percentage: rolloutPercentage,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update feature flag');
    }

    this.clearCache();
  }

  private async checkWithBackend(
    flag: FeatureFlag,
    context: FeatureFlagContext
  ): Promise<FeatureFlagResponse> {
    const token = authService.getToken();
    const accountType = authService.getAccountType();

    const endpoint = accountType === 'platform'
      ? '/api/v1/platform/feature-flags/check'
      : '/api/v1/tenant/feature-flags/check';

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(accountType && { 'X-Account-Type': accountType }),
      },
      body: JSON.stringify({
        flag,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error('Feature flag check failed');
    }

    return response.json();
  }

  private async fetchAllFlags(context: FeatureFlagContext): Promise<AllFlagsResponse> {
    const token = authService.getToken();
    const accountType = authService.getAccountType();

    const endpoint = accountType === 'platform'
      ? '/api/v1/platform/feature-flags/all'
      : '/api/v1/tenant/feature-flags/all';

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(accountType && { 'X-Account-Type': accountType }),
      },
      body: JSON.stringify({ context }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch all feature flags');
    }

    return response.json();
  }

  private getDefaultContext(): FeatureFlagContext {
    return {
      tenantId: localStorage.getItem('tenant_id') || undefined,
      userId: localStorage.getItem('user_id') || undefined,
      userEmail: localStorage.getItem('user_email') || undefined,
      accountType: localStorage.getItem('account_type') || undefined,
    };
  }

  private getCacheKey(flag: FeatureFlag, context?: FeatureFlagContext): string {
    const ctx = context || this.getDefaultContext();
    return `${flag}-${ctx.tenantId || 'none'}-${ctx.userId || 'none'}`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearCacheForFlag(flag: FeatureFlag): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(flag)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const featureFlagService = new FeatureFlagService();
