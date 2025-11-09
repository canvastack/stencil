/**
 * Resolves image URL based on current base path and environment
 * @param img - Image path/URL to resolve
 * @param options - Optional configuration for image resolution
 * @returns Resolved image URL
 */
export const resolveImageUrl = (img: string, options?: { prefix?: string; preview?: boolean }): string => {
  if (!img) return img;
  // Handle full absolute URLs, data URLs, and blob URLs
  if (/^(https?:\/\/|data:|blob:)/.test(img) || img.startsWith('//')) return img;

  const base = import.meta.env.BASE_URL || '/';
  // normalize base so it has no trailing slash (but keeps leading slash if present)
  const normalizedBase = base.replace(/\/+$/, ''); // '/' -> '' ; '/stencil/' -> '/stencil'

  // If img is already an absolute path (starts with '/'), handle carefully to avoid double-prefixing base
  if (img.startsWith('/')) {
    // If img already starts with the configured base (e.g. '/stencil/...'), return as-is
    if (normalizedBase && img.startsWith(normalizedBase + '/')) {
      return img;
    }

    // If base is not root, prefix it so production served under a base path resolves correctly
    if (normalizedBase) {
      return `${normalizedBase}${img}`; // normalizedBase already contains leading '/'
    }

    // base is root '/', return the absolute path unchanged
    return img;
  }

  // At this point img is a relative path (no leading slash)
  // Support developer-friendly 'src/assets/...' -> map to '/images/...'
  if (img.startsWith('src/assets/')) {
    const rel = img.replace(/^src\/assets\//, '');
    return (normalizedBase ? `${normalizedBase}/images/${rel}` : `/${['images', rel].join('/')}`);
  }

  // Support relative 'images/...' entries (from CMS/mock data)
  if (img.startsWith('images/')) {
    return normalizedBase ? `${normalizedBase}/${img}` : `/${img}`;
  }

  // Default: return relative path prefixed with base (or root)
  return normalizedBase ? `${normalizedBase}/${img}` : `/${img}`;
};