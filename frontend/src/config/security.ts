import { config } from './environment';

// Security configuration and utilities
export interface SecurityConfig {
  CSP_DIRECTIVES: Record<string, string[]>;
  SECURITY_HEADERS: Record<string, string>;
  ALLOWED_DOMAINS: string[];
  BLOCKED_DOMAINS: string[];
  RATE_LIMITS: {
    WINDOW_MS: number;
    MAX_REQUESTS: number;
  };
}

// Content Security Policy directives
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite dev mode
    "'unsafe-eval'", // Required for development
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://static.hotjar.com',
    'https://script.hotjar.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://static.hotjar.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.canvastencil.com',
    'https://staging-api.canvastencil.com',
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://stats.g.doubleclick.net',
    'https://sentry.io',
    'wss://ws.hotjar.com',
    'https://*.hotjar.com',
    'https://*.hotjar.io',
  ],
  'frame-src': [
    "'self'",
    'https://vars.hotjar.com',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

// Security headers for production
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// Production CSP (stricter)
const PRODUCTION_CSP_OVERRIDES = {
  'script-src': [
    "'self'",
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://static.hotjar.com',
    'https://script.hotjar.com',
  ],
};

export const securityConfig: SecurityConfig = {
  CSP_DIRECTIVES: config.ENVIRONMENT === 'production' 
    ? { ...CSP_DIRECTIVES, ...PRODUCTION_CSP_OVERRIDES }
    : CSP_DIRECTIVES,
  SECURITY_HEADERS,
  ALLOWED_DOMAINS: [
    'canvastencil.com',
    '*.canvastencil.com',
    'localhost',
    '127.0.0.1',
  ],
  BLOCKED_DOMAINS: [
    // Add domains to block
  ],
  RATE_LIMITS: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: config.RATE_LIMITING.REQUESTS_PER_MINUTE,
  },
};

// CSP string generator
export const generateCSPString = (): string => {
  return Object.entries(securityConfig.CSP_DIRECTIVES)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
};

// Security utilities
export const securityUtils = {
  // Sanitize HTML input
  sanitizeHtml: (input: string): string => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },
  
  // Validate URL against allowed domains
  isAllowedDomain: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      return securityConfig.ALLOWED_DOMAINS.some(allowedDomain => {
        if (allowedDomain.startsWith('*.')) {
          const baseDomain = allowedDomain.substring(2);
          return domain.endsWith(baseDomain);
        }
        return domain === allowedDomain;
      });
    } catch {
      return false;
    }
  },
  
  // Check if domain is blocked
  isBlockedDomain: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      return securityConfig.BLOCKED_DOMAINS.some(blockedDomain => {
        if (blockedDomain.startsWith('*.')) {
          const baseDomain = blockedDomain.substring(2);
          return domain.endsWith(baseDomain);
        }
        return domain === blockedDomain;
      });
    } catch {
      return false;
    }
  },
  
  // Generate secure random string
  generateSecureToken: (length: number = 32): string => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },
  
  // Validate input against XSS patterns
  containsXSS: (input: string): boolean => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<link/gi,
      /<meta/gi,
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  },
  
  // Hash function for integrity checks
  generateHash: async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  },
};

// Rate limiting utilities
export const rateLimitUtils = {
  // Client-side rate limiting store
  requestCounts: new Map<string, { count: number; resetTime: number }>(),
  
  // Check if request is allowed
  isAllowed: (key: string, limit: number = securityConfig.RATE_LIMITS.MAX_REQUESTS): boolean => {
    const now = Date.now();
    const windowStart = now - securityConfig.RATE_LIMITS.WINDOW_MS;
    
    const current = rateLimitUtils.requestCounts.get(key);
    
    if (!current || current.resetTime < windowStart) {
      rateLimitUtils.requestCounts.set(key, { count: 1, resetTime: now });
      return true;
    }
    
    if (current.count >= limit) {
      return false;
    }
    
    current.count++;
    return true;
  },
  
  // Clean up expired entries
  cleanup: (): void => {
    const now = Date.now();
    const windowStart = now - securityConfig.RATE_LIMITS.WINDOW_MS;
    
    for (const [key, data] of rateLimitUtils.requestCounts.entries()) {
      if (data.resetTime < windowStart) {
        rateLimitUtils.requestCounts.delete(key);
      }
    }
  },
  
  // Get remaining requests for a key
  getRemainingRequests: (key: string, limit: number = securityConfig.RATE_LIMITS.MAX_REQUESTS): number => {
    const current = rateLimitUtils.requestCounts.get(key);
    if (!current) return limit;
    return Math.max(0, limit - current.count);
  },
};

// Initialize security measures
export const initializeSecurity = (): void => {
  // Set up CSP if enabled
  if (config.CSP_ENABLED && config.SECURITY_HEADERS) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = generateCSPString();
    document.head.appendChild(meta);
  }
  
  // Add security event listeners
  if (config.ENVIRONMENT === 'production') {
    // Disable right-click context menu (optional)
    document.addEventListener('contextmenu', (e) => {
      if (config.ENVIRONMENT === 'production') {
        e.preventDefault();
      }
    });
    
    // Disable F12 and other dev tools shortcuts (optional)
    document.addEventListener('keydown', (e) => {
      if (config.ENVIRONMENT === 'production') {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'U')) {
          e.preventDefault();
        }
      }
    });
  }
  
  // Start rate limit cleanup interval
  setInterval(rateLimitUtils.cleanup, 60000); // Clean up every minute
};

export default securityConfig;