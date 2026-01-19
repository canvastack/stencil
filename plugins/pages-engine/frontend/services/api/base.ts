export { tenantApiClient } from './tenantApiClient';

export const mockApiCall = async <T>(
  fn: () => Promise<T>,
  delay: number = 200
): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return fn();
};
