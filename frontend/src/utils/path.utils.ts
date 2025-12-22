import config from '@/config/app.config';

export const getImagePath = (relativePath: string): string => {
  // Remove leading slash if exists
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${config.baseUrl}images/${cleanPath}`;
};

export const getPublicPath = (relativePath: string): string => {
  // Remove leading slash if exists
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${config.baseUrl}${cleanPath}`;
};

export const getThemePath = (themeName: string, relativePath: string): string => {
  // Remove leading slash if exists
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${config.baseUrl}themes/${themeName}/${cleanPath}`;
};