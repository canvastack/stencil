interface AppConfig {
  baseUrl: string;
  apiUrl: string;
  env: string;
  deployPlatform: 'local' | 'github' | 'custom';
  isGitHubPages: boolean;
}

const config: AppConfig = {
  baseUrl: import.meta.env.VITE_APP_BASE_URL || '/',
  apiUrl: import.meta.env.VITE_APP_API_URL || 'http://localhost:8000',
  env: import.meta.env.VITE_APP_ENV || 'development',
  deployPlatform: (import.meta.env.VITE_APP_DEPLOY_PLATFORM as AppConfig['deployPlatform']) || 'local',
  isGitHubPages: import.meta.env.VITE_APP_IS_GITHUB_PAGES === 'true'
};

export const getAssetPath = (path: string): string => {
  // Remove leading slash if exists to prevent double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${config.baseUrl}${cleanPath}`;
};

export default config;