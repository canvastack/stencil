import { Settings } from '@/types/settings';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { settingsService as mockSettings } from '@/services/mock/settings';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const createContextAwareSettingsService = () => {
  const settingsService = {
    async getSettings(): Promise<Settings> {
      if (USE_MOCK) {
        return mockSettings.getSettings();
      }
      
      try {
        // Context-aware API endpoint determination would go here
        // For now, fallback to mock
        return mockSettings.getSettings();
      } catch (error) {
        console.error('Settings API call failed, falling back to mock data:', error);
        return mockSettings.getSettings();
      }
    },

    async updateSettings(updates: Partial<Settings>): Promise<Settings> {
      if (USE_MOCK) {
        return mockSettings.updateSettings(updates);
      }
      
      try {
        // Context-aware API endpoint determination would go here
        // For now, fallback to mock
        return mockSettings.updateSettings(updates);
      } catch (error) {
        console.error('Settings API call failed, falling back to mock data:', error);
        return mockSettings.updateSettings(updates);
      }
    },

    async resetSettings(): Promise<Settings> {
      if (USE_MOCK) {
        return mockSettings.resetSettings();
      }
      
      try {
        // Context-aware API endpoint determination would go here
        // For now, fallback to mock
        return mockSettings.resetSettings();
      } catch (error) {
        console.error('Settings API call failed, falling back to mock data:', error);
        return mockSettings.resetSettings();
      }
    },

    async getGeneralSettings(): Promise<Settings['general']> {
      if (USE_MOCK) {
        return mockSettings.getGeneralSettings();
      }
      
      try {
        // Context-aware API endpoint determination would go here
        // For now, fallback to mock
        return mockSettings.getGeneralSettings();
      } catch (error) {
        console.error('Settings API call failed, falling back to mock data:', error);
        return mockSettings.getGeneralSettings();
      }
    },

    async updateGeneralSettings(updates: Partial<Settings['general']>): Promise<Settings['general']> {
      if (USE_MOCK) {
        return mockSettings.updateGeneralSettings(updates);
      }
      
      try {
        // Context-aware API endpoint determination would go here
        // For now, fallback to mock
        return mockSettings.updateGeneralSettings(updates);
      } catch (error) {
        console.error('Settings API call failed, falling back to mock data:', error);
        return mockSettings.updateGeneralSettings(updates);
      }
    },

    async getNotificationSettings(): Promise<Settings['notifications']> {
      if (USE_MOCK) {
        return mockSettings.getNotificationSettings();
      }
      
      try {
        // Context-aware API endpoint determination would go here
        // For now, fallback to mock
        return mockSettings.getNotificationSettings();
      } catch (error) {
        console.error('Settings API call failed, falling back to mock data:', error);
        return mockSettings.getNotificationSettings();
      }
    },

    async updateNotificationSettings(updates: Partial<Settings['notifications']>): Promise<Settings['notifications']> {
      if (USE_MOCK) {
        return mockSettings.updateNotificationSettings(updates);
      }
      
      try {
        // Context-aware API endpoint determination would go here
        // For now, fallback to mock
        return mockSettings.updateNotificationSettings(updates);
      } catch (error) {
        console.error('Settings API call failed, falling back to mock data:', error);
        return mockSettings.updateNotificationSettings(updates);
      }
    },

    async getSecuritySettings(): Promise<Settings['security']> {
      if (USE_MOCK) {
        return mockSettings.getSecuritySettings();
      }
      
      try {
        // Context-aware API endpoint determination would go here
        // For now, fallback to mock
        return mockSettings.getSecuritySettings();
      } catch (error) {
        console.error('Settings API call failed, falling back to mock data:', error);
        return mockSettings.getSecuritySettings();
      }
    },

    async updateSecuritySettings(updates: Partial<Settings['security']>): Promise<Settings['security']> {
      if (USE_MOCK) {
        return mockSettings.updateSecuritySettings(updates);
      }
      
      try {
        // Context-aware API endpoint determination would go here
        // For now, fallback to mock
        return mockSettings.updateSecuritySettings(updates);
      } catch (error) {
        console.error('Settings API call failed, falling back to mock data:', error);
        return mockSettings.updateSecuritySettings(updates);
      }
    }
  };

  return settingsService;
};

export const settingsService = createContextAwareSettingsService();