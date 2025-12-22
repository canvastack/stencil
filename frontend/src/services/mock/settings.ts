import { Settings } from '@/types/settings';
import settingsData from './data/settings.json';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let settings: Settings = { ...settingsData } as Settings;

export const settingsService = {
  async getSettings(): Promise<Settings> {
    await delay(300);
    return JSON.parse(JSON.stringify(settings));
  },

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    await delay(500);
    
    settings = {
      ...settings,
      ...updates,
      general: { ...settings.general, ...updates.general },
      notifications: { ...settings.notifications, ...updates.notifications },
      security: { ...settings.security, ...updates.security },
      analytics: { ...settings.analytics, ...updates.analytics },
      emailService: { ...settings.emailService, ...updates.emailService },
      paymentGateway: { ...settings.paymentGateway, ...updates.paymentGateway },
      whatsapp: { ...settings.whatsapp, ...updates.whatsapp },
      backup: { ...settings.backup, ...updates.backup },
    };

    return JSON.parse(JSON.stringify(settings));
  },

  async resetSettings(): Promise<Settings> {
    await delay(500);
    settings = { ...settingsData } as Settings;
    return JSON.parse(JSON.stringify(settings));
  },

  async getGeneralSettings() {
    await delay(200);
    return { ...settings.general };
  },

  async updateGeneralSettings(updates: Partial<Settings['general']>) {
    await delay(300);
    settings.general = { ...settings.general, ...updates };
    return { ...settings.general };
  },

  async getNotificationSettings() {
    await delay(200);
    return { ...settings.notifications };
  },

  async updateNotificationSettings(updates: Partial<Settings['notifications']>) {
    await delay(300);
    settings.notifications = { ...settings.notifications, ...updates };
    return { ...settings.notifications };
  },

  async getSecuritySettings() {
    await delay(200);
    return { ...settings.security };
  },

  async updateSecuritySettings(updates: Partial<Settings['security']>) {
    await delay(300);
    settings.security = { ...settings.security, ...updates };
    return { ...settings.security };
  },

  async getEmailServiceSettings() {
    await delay(200);
    return { ...settings.emailService };
  },

  async updateEmailServiceSettings(updates: Partial<Settings['emailService']>) {
    await delay(300);
    settings.emailService = { ...settings.emailService, ...updates };
    return { ...settings.emailService };
  },

  async getPaymentGatewaySettings() {
    await delay(200);
    return { ...settings.paymentGateway };
  },

  async updatePaymentGatewaySettings(updates: Partial<Settings['paymentGateway']>) {
    await delay(300);
    settings.paymentGateway = { ...settings.paymentGateway, ...updates };
    return { ...settings.paymentGateway };
  },

  async getBackupSettings() {
    await delay(200);
    return { ...settings.backup };
  },

  async updateBackupSettings(updates: Partial<Settings['backup']>) {
    await delay(300);
    settings.backup = { ...settings.backup, ...updates };
    return { ...settings.backup };
  },

  async triggerBackup() {
    await delay(1000);
    settings.backup.lastBackup = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' UTC';
    return { success: true, timestamp: settings.backup.lastBackup };
  },
};
