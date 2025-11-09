export const getBaseUrl = () => {
  // Get base URL from Vite's environment (e.g., '/stencil/')
  const baseUrl = import.meta.env.BASE_URL || '/';
  // Ensure it has trailing slash
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
};

export const createUrl = (path: string) => {
  const baseUrl = getBaseUrl();
  // Remove leading slash from path if it exists
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Combine base URL with path
  return `${baseUrl}${cleanPath}`;
};