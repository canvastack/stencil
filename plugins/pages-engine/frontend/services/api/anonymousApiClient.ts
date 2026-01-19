import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export interface AnonymousApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: Record<string, string[]>;
}

export interface AnonymousApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  code?: string;
}

class AnonymousApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // Increased timeout for anonymous users
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Context': 'anonymous'
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add anonymous context headers
    this.client.interceptors.request.use(
      (config) => {
        // Add anonymous-specific headers
        config.headers['X-Anonymous-Request'] = 'true';
        config.headers['X-Context'] = 'anonymous';
        config.headers['X-Platform-Default'] = 'true'; // Request platform default content

        console.log(`AnonymousApiClient: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data
        });

        return config;
      },
      (error) => {
        console.error('AnonymousApiClient: Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle anonymous-specific responses and errors
    this.client.interceptors.response.use(
      (response: AxiosResponse<AnonymousApiResponse>) => {
        console.log(`AnonymousApiClient: Response ${response.status}:`, response.data);
        return response;
      },
      async (error: AxiosError<AnonymousApiError>) => {
        console.warn('AnonymousApiClient: Response error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        // Handle rate limiting for anonymous users
        if (error.response?.status === 429) {
          console.log('AnonymousApiClient: Rate limited');
          throw new Error('Too many requests. Please try again later.');
        }

        // Handle content not available - don't intercept, let query handle it
        if (error.response?.status === 404) {
          console.log('AnonymousApiClient: Content not found (404)');
          // Let the error propagate so queryFn can catch it
        }

        // Handle server errors
        if (error.response?.status >= 500) {
          console.error('AnonymousApiClient: Server error:', error.response?.data);
          throw new Error('Service temporarily unavailable. Please try again later.');
        }

        return Promise.reject(error);
      }
    );
  }

  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AnonymousApiResponse<T>> {
    try {
      const response = await this.client.get<AnonymousApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST request (limited for anonymous users)
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AnonymousApiResponse<T>> {
    try {
      // Only allow certain POST endpoints for anonymous users (like contact forms)
      const allowedAnonymousPosts = [
        '/contact',
        '/newsletter/subscribe',
        '/product-inquiry',
        '/quote-request',
        '/form-submission'
      ];

      if (!allowedAnonymousPosts.some(endpoint => url.includes(endpoint))) {
        throw new Error('Anonymous users are not allowed to perform this action');
      }

      const response = await this.client.post<AnonymousApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // GET platform default content
  async getPlatformContent<T = any>(contentType: string, slug?: string): Promise<AnonymousApiResponse<T>> {
    const url = slug ? `/public/content/${contentType}/${slug}` : `/public/content/${contentType}`;
    
    try {
      const response = await this.client.get<T>(url, {
        headers: {
          'X-Content-Type': contentType,
          'X-Platform-Default': 'true'
        }
      });
      
      // Backend returns content directly, wrap it in our response format
      return {
        data: response.data,
        success: true,
        message: 'Content loaded successfully'
      };
    } catch (error) {
      console.error(`AnonymousApiClient: Failed to get platform content for ${contentType}:`, error);
      
      // Return fallback content structure
      return {
        data: this.getFallbackContent(contentType, slug) as T,
        message: 'Using fallback content',
        success: true
      };
    }
  }

  // GET tenant-specific content
  async getTenantContent<T = any>(tenantSlug: string, pageSlug: string): Promise<AnonymousApiResponse<T>> {
    const url = `/public/content/pages/${tenantSlug}/${pageSlug}`;
    
    console.log(`AnonymousApiClient: Calling tenant content URL: ${this.baseURL}${url}`);
    
    try {
      const response = await this.client.get<T>(url, {
        headers: {
          'X-Content-Type': 'pages',
          'X-Tenant-Slug': tenantSlug
        }
      });
      
      console.log(`AnonymousApiClient: Tenant content response:`, response.data);
      
      // Backend returns content directly, wrap it in our response format
      return {
        data: response.data,
        success: true,
        message: 'Tenant content loaded successfully'
      };
    } catch (error: any) {
      console.error(`AnonymousApiClient: Failed to get tenant content for ${tenantSlug}/${pageSlug}:`, error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      
      // Return fallback content structure
      return {
        data: this.getFallbackContent('pages', `${tenantSlug}/${pageSlug}`) as T,
        message: 'Using fallback content',
        success: true
      };
    }
  }

  // GET platform products
  async getPlatformProducts(params?: Record<string, any>): Promise<AnonymousApiResponse<any[]>> {
    try {
      const response = await this.client.get<AnonymousApiResponse<any[]>>('/public/products', {
        params,
        headers: {
          'X-Platform-Default': 'true'
        }
      });
      return response.data;
    } catch (error) {
      console.error('AnonymousApiClient: Failed to get platform products:', error);
      
      // Return fallback products
      return {
        data: this.getFallbackProducts(),
        message: 'Using fallback products',
        success: true
      };
    }
  }

  // Get fallback content when API fails
  private getFallbackContent(contentType: string, slug?: string): any {
    const fallbackContents: Record<string, any> = {
      home: {
        title: 'Welcome to CanvaStencil',
        subtitle: 'Professional Multi-Tenant CMS Platform',
        description: 'Build and manage multiple websites with ease using our powerful CMS platform.',
        hero_image: '/assets/default-hero.jpg',
        sections: []
      },
      about: {
        title: 'About Us',
        subtitle: 'Building the Future of Multi-Tenant CMS',
        description: 'CanvaStencil provides enterprise-grade CMS solutions for modern businesses.',
        content: 'We are dedicated to providing the best multi-tenant CMS platform for businesses of all sizes.'
      },
      contact: {
        title: 'Contact Us',
        subtitle: 'Get in Touch',
        description: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
        email: 'info@canvastencil.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business St, Suite 100, City, ST 12345'
      },
      faq: {
        title: 'Frequently Asked Questions',
        subtitle: 'Find answers to common questions',
        description: 'Get quick answers to the most frequently asked questions about our platform.',
        faqs: [
          {
            question: 'What is CanvaStencil?',
            answer: 'CanvaStencil is a multi-tenant CMS platform that allows you to manage multiple websites from a single dashboard.'
          }
        ]
      }
    };

    return fallbackContents[contentType] || {
      title: 'Content Not Available',
      description: 'This content is currently not available.',
      content: ''
    };
  }

  // Get fallback products when API fails
  private getFallbackProducts(): any[] {
    return [
      {
        id: '1',
        uuid: '00000000-0000-0000-0000-000000000001',
        title: 'Premium Etching Service',
        slug: 'premium-etching-service',
        description: 'High-quality etching services for metal, glass, and other materials.',
        image: '/assets/products/etching-1.jpg',
        price: null, // No price for anonymous users
        category: 'Etching Services',
        featured: true,
        status: 'published'
      },
      {
        id: '2',
        uuid: '00000000-0000-0000-0000-000000000002',
        title: 'Custom Design Service',
        slug: 'custom-design-service',
        description: 'Professional custom design services for your etching needs.',
        image: '/assets/products/design-1.jpg',
        price: null, // No price for anonymous users
        category: 'Design Services',
        featured: true,
        status: 'published'
      }
    ];
  }

  // Handle errors consistently
  private handleError(error: any): AnonymousApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<AnonymousApiError>;
      
      if (axiosError.response?.data) {
        return {
          message: axiosError.response.data.message || 'Request failed',
          errors: axiosError.response.data.errors,
          status: axiosError.response.status,
          code: axiosError.response.data.code
        };
      }
      
      if (axiosError.request) {
        return {
          message: 'Service is unavailable. Please try again later.',
          status: 0
        };
      }
      
      return {
        message: axiosError.message || 'Request failed'
      };
    }
    
    return {
      message: error.message || 'Request failed'
    };
  }

  // Get current base URL
  getBaseURL(): string {
    return this.baseURL;
  }

  // Check if content is available online
  async checkContentAvailability(contentType: string): Promise<boolean> {
    try {
      await this.client.head(`/public/content/${contentType}`);
      return true;
    } catch (error) {
      console.log(`AnonymousApiClient: Content ${contentType} not available online`);
      return false;
    }
  }

  // Get raw axios instance (use sparingly)
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance
export const anonymousApiClient = new AnonymousApiClient();

// Export the class for testing purposes
export { AnonymousApiClient };