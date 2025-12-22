import { Theme, ThemeMetadata } from '../types';
import { ThemePackageManager } from '../packaging/ThemePackageManager';
import { themeStorage } from '../utils/themeStorage';
import { themeManager } from '../ThemeManager';

export interface ThemeUpdate {
  themeName: string;
  currentVersion: string;
  latestVersion: string;
  updateUrl: string;
  changelog: string;
  releaseDate: string;
  isSecurityUpdate: boolean;
  isBreakingChange: boolean;
  size: number;
}

export interface ThemeBackup {
  themeName: string;
  version: string;
  backupDate: Date;
  backupId: string;
  size: number;
  data: Theme;
}

export interface UpdateResult {
  success: boolean;
  error?: string;
  previousVersion?: string;
  newVersion?: string;
}

export interface RollbackResult {
  success: boolean;
  error?: string;
  rolledBackTo?: string;
}

export class ThemeUpdateManager {
  private packageManager: ThemePackageManager;
  private readonly MARKETPLACE_API = 'https://marketplace.stencil.com/api';
  private readonly BACKUP_PREFIX = 'theme_backup_';
  private readonly MAX_BACKUPS_PER_THEME = 5;

  constructor() {
    this.packageManager = new ThemePackageManager();
  }

  async checkForUpdates(): Promise<ThemeUpdate[]> {
    try {
      const installedThemes = await themeStorage.listThemes();
      const updates: ThemeUpdate[] = [];

      for (const themeName of installedThemes) {
        const theme = await themeStorage.getTheme(themeName);
        if (!theme) continue;

        const latestVersion = await this.getLatestVersion(themeName);
        
        if (latestVersion && this.isNewerVersion(latestVersion.version, theme.metadata.version)) {
          updates.push({
            themeName,
            currentVersion: theme.metadata.version,
            latestVersion: latestVersion.version,
            updateUrl: latestVersion.downloadUrl,
            changelog: latestVersion.changelog,
            releaseDate: latestVersion.releaseDate,
            isSecurityUpdate: latestVersion.isSecurityUpdate,
            isBreakingChange: latestVersion.isBreakingChange,
            size: latestVersion.size
          });
        }
      }

      return updates;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return [];
    }
  }

  async checkSingleThemeUpdate(themeName: string): Promise<ThemeUpdate | null> {
    try {
      const theme = await themeStorage.getTheme(themeName);
      
      if (!theme) {
        throw new Error(`Theme ${themeName} not found`);
      }

      const latestVersion = await this.getLatestVersion(themeName);
      
      if (latestVersion && this.isNewerVersion(latestVersion.version, theme.metadata.version)) {
        return {
          themeName,
          currentVersion: theme.metadata.version,
          latestVersion: latestVersion.version,
          updateUrl: latestVersion.downloadUrl,
          changelog: latestVersion.changelog,
          releaseDate: latestVersion.releaseDate,
          isSecurityUpdate: latestVersion.isSecurityUpdate,
          isBreakingChange: latestVersion.isBreakingChange,
          size: latestVersion.size
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to check update for ${themeName}:`, error);
      return null;
    }
  }

  async updateTheme(themeName: string): Promise<UpdateResult> {
    try {
      const currentTheme = await themeStorage.getTheme(themeName);
      
      if (!currentTheme) {
        return { success: false, error: `Theme ${themeName} not found` };
      }

      const update = await this.checkSingleThemeUpdate(themeName);
      
      if (!update) {
        return { success: false, error: 'No updates available' };
      }

      const backup = await this.createBackup(currentTheme);
      
      try {
        const updatePackage = await this.downloadUpdate(update.updateUrl);
        
        const updateFile = new File([updatePackage], `${themeName}.zip`, { type: 'application/zip' });
        const result = await this.packageManager.installThemeFromZip(updateFile);
        
        if (result.success) {
          await this.cleanupOldBackups(themeName);
          
          return {
            success: true,
            previousVersion: update.currentVersion,
            newVersion: update.latestVersion
          };
        } else {
          await this.restoreFromBackup(backup);
          return { success: false, error: result.error || 'Update failed' };
        }
      } catch (error) {
        await this.restoreFromBackup(backup);
        throw error;
      }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async rollbackTheme(themeName: string, targetVersion?: string): Promise<RollbackResult> {
    try {
      const backups = await this.getThemeBackups(themeName);
      
      if (backups.length === 0) {
        return { success: false, error: 'No backups available for this theme' };
      }

      let backup: ThemeBackup | undefined;
      
      if (targetVersion) {
        backup = backups.find(b => b.version === targetVersion);
        if (!backup) {
          return { success: false, error: `No backup found for version ${targetVersion}` };
        }
      } else {
        backup = backups.sort((a, b) => b.backupDate.getTime() - a.backupDate.getTime())[0];
      }

      const currentTheme = await themeStorage.getTheme(themeName);
      
      if (currentTheme) {
        await this.createBackup(currentTheme);
      }

      await this.restoreFromBackup(backup);

      return {
        success: true,
        rolledBackTo: backup.version
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rollback failed'
      };
    }
  }

  async createBackup(theme: Theme): Promise<ThemeBackup> {
    const backupId = this.generateBackupId();
    const backup: ThemeBackup = {
      themeName: theme.metadata.name,
      version: theme.metadata.version,
      backupDate: new Date(),
      backupId,
      size: this.calculateThemeSize(theme),
      data: theme
    };

    const backupKey = `${this.BACKUP_PREFIX}${theme.metadata.name}_${backupId}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));

    return backup;
  }

  async getThemeBackups(themeName: string): Promise<ThemeBackup[]> {
    const backups: ThemeBackup[] = [];
    const prefix = `${this.BACKUP_PREFIX}${themeName}_`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const backupData = localStorage.getItem(key);
          if (backupData) {
            const backup: ThemeBackup = JSON.parse(backupData);
            backup.backupDate = new Date(backup.backupDate);
            backups.push(backup);
          }
        } catch (error) {
          console.error(`Failed to parse backup ${key}:`, error);
        }
      }
    }

    return backups.sort((a, b) => b.backupDate.getTime() - a.backupDate.getTime());
  }

  async deleteBackup(backupId: string): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(backupId)) {
        localStorage.removeItem(key);
        return;
      }
    }
  }

  async cleanupOldBackups(themeName: string): Promise<void> {
    const backups = await this.getThemeBackups(themeName);
    
    if (backups.length > this.MAX_BACKUPS_PER_THEME) {
      const backupsToDelete = backups.slice(this.MAX_BACKUPS_PER_THEME);
      
      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.backupId);
      }
    }
  }

  private async restoreFromBackup(backup: ThemeBackup): Promise<void> {
    await themeStorage.saveTheme(backup.themeName, backup.data);
    await themeManager.registerTheme(backup.themeName, backup.data);
    
    console.log(`Theme ${backup.themeName} restored to version ${backup.version}`);
  }

  private async getLatestVersion(themeName: string): Promise<{
    version: string;
    downloadUrl: string;
    changelog: string;
    releaseDate: string;
    isSecurityUpdate: boolean;
    isBreakingChange: boolean;
    size: number;
  } | null> {
    try {
      const response = await fetch(`${this.MARKETPLACE_API}/themes/${themeName}/latest`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch latest version for ${themeName}:`, error);
      return null;
    }
  }

  private async downloadUpdate(updateUrl: string): Promise<Blob> {
    try {
      const response = await fetch(updateUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download update: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (v: string): number[] => {
      const match = v.match(/(\d+)\.(\d+)\.(\d+)/);
      return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
    };

    const [newMajor, newMinor, newPatch] = parseVersion(newVersion);
    const [currentMajor, currentMinor, currentPatch] = parseVersion(currentVersion);

    if (newMajor !== currentMajor) return newMajor > currentMajor;
    if (newMinor !== currentMinor) return newMinor > currentMinor;
    return newPatch > currentPatch;
  }

  private calculateThemeSize(theme: Theme): number {
    try {
      return JSON.stringify(theme).length;
    } catch {
      return 0;
    }
  }

  private generateBackupId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getUpdateSummary(update: ThemeUpdate): string {
    const lines: string[] = [];
    
    lines.push(`Update available for ${update.themeName}`);
    lines.push(`Current: v${update.currentVersion} → Latest: v${update.latestVersion}`);
    
    if (update.isSecurityUpdate) {
      lines.push('⚠️ Security Update - Recommended');
    }
    
    if (update.isBreakingChange) {
      lines.push('⚠️ Breaking Changes - Review changelog before updating');
    }
    
    lines.push(`Release Date: ${update.releaseDate}`);
    lines.push(`Size: ${this.formatSize(update.size)}`);
    
    if (update.changelog) {
      lines.push('');
      lines.push('Changelog:');
      lines.push(update.changelog);
    }
    
    return lines.join('\n');
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}

export const themeUpdateManager = new ThemeUpdateManager();
