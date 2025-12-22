export const getBaseUrl = () => {
  // Get base URL from Vite's environment (e.g., '/stencil/')
  const baseUrl = import.meta.env.BASE_URL || '/';
  // Ensure it has trailing slash
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
};

export const createUrl = (path: string) => {
  // Since BrowserRouter handles the base path, we just need to ensure
  // the path starts with a slash for proper routing
  return path.startsWith('/') ? path : `/${path}`;
};