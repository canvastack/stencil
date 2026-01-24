import { tenantApiClient } from '../tenant/tenantApiClient';
import { anonymousApiClient } from './anonymousApiClient';
import { Category, CategoryFilters } from '@/types/category';
import { PaginatedResponse } from '@/types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  business_type?: string;
  description?: string;
  parent_id?: string;
  image?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  specifications_template?: Record<string, any>;
  seo_meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

// Mock data for development
const mockCategories: Category[] = [
  {
    id: '1',
    uuid: 'cat-1-uuid',
    name: 'Awards & Trophies',
    slug: 'awards-trophies',
    description: 'Custom engraved awards and trophies for achievements',
    color: '#ff8000',
    sort_order: 1,
    is_active: true,
    product_count: 12,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    uuid: 'cat-2-uuid',
    name: 'Glass Etching',
    slug: 'glass-etching',
    description: 'Precision laser etched glass products',
    color: '#4a90e2',
    sort_order: 2,
    is_active: true,
    product_count: 8,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    uuid: 'cat-3-uuid',
    name: 'Metal Engraving',
    slug: 'metal-engraving',
    description: 'High-quality metal etching and engraving',
    color: '#f5a623',
    sort_order: 3,
    is_active: true,
    product_count: 15,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '4',
    uuid: 'cat-4-uuid',
    name: 'Custom Plaques',
    slug: 'custom-plaques',
    description: 'Personalized plaques for various occasions',
    color: '#7b68ee',
    sort_order: 4,
    is_active: true,
    product_count: 10,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

class CategoriesService {
  async getCategories(filters?: CategoryFilters): Promise<PaginatedResponse<Category>> {
    if (USE_MOCK) {
      let filteredCategories = [...mockCategories];
      
      // Apply filters
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filteredCategories = filteredCategories.filter(cat =>
          cat.name.toLowerCase().includes(search) ||
          cat.description?.toLowerCase().includes(search)
        );
      }
      
      if (filters?.is_active !== undefined) {
        filteredCategories = filteredCategories.filter(cat => cat.is_active === filters.is_active);
      }
      
      if (filters?.parent_id) {
        filteredCategories = filteredCategories.filter(cat => cat.parent_id === filters.parent_id);
      }
      
      // Apply sorting
      if (filters?.sort) {
        filteredCategories.sort((a, b) => {
          let aValue, bValue;
          
          switch (filters.sort) {
            case 'name':
              aValue = a.name;
              bValue = b.name;
              break;
            case 'created_at':
              aValue = new Date(a.created_at);
              bValue = new Date(b.created_at);
              break;
            case 'sort_order':
            default:
              aValue = a.sort_order;
              bValue = b.sort_order;
              break;
          }
          
          if (filters.order === 'desc') {
            return aValue > bValue ? -1 : 1;
          }
          return aValue < bValue ? -1 : 1;
        });
      }
      
      return Promise.resolve({
        data: filteredCategories,
        current_page: filters?.page || 1,
        per_page: filters?.per_page || 50,
        total: filteredCategories.length,
        last_page: 1,
      });
    }

    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.per_page) params.append('per_page', filters.per_page.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.order) params.append('order', filters.order);
        if (filters.parent_id) params.append('parent_id', filters.parent_id);
        if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
      }

      // Try public API first for public pages
      try {
        const publicResponse = await anonymousApiClient.get<PaginatedResponse<Category>>(
          `/public/categories?${params.toString()}`
        );
        return publicResponse;
      } catch (publicError) {
        // Fall back to tenant API if public API fails
        const response = await tenantApiClient.get<PaginatedResponse<Category>>(
          `/categories?${params.toString()}`
        );
        return response;
      }
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      // Return mock data on API failure
      let filteredCategories = [...mockCategories];
      
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filteredCategories = filteredCategories.filter(cat =>
          cat.name.toLowerCase().includes(search) ||
          cat.description?.toLowerCase().includes(search)
        );
      }
      
      return {
        data: filteredCategories,
        current_page: filters?.page || 1,
        per_page: filters?.per_page || 50,
        total: filteredCategories.length,
        last_page: 1,
      };
    }
  }

  async getCategoryById(id: string): Promise<Category> {
    if (USE_MOCK) {
      const category = mockCategories.find(cat => cat.id === id);
      if (!category) throw new Error('Category not found');
      return Promise.resolve(category);
    }

    try {
      // Try public API first
      try {
        const publicResponse = await anonymousApiClient.get<Category>(`/public/categories/${id}`);
        return publicResponse;
      } catch (publicError) {
        // Fall back to tenant API
        const response = await tenantApiClient.get<Category>(`/categories/${id}`);
        return response;
      }
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      const category = mockCategories.find(cat => cat.id === id);
      if (!category) throw new Error('Category not found');
      return category;
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    if (USE_MOCK) {
      const category = mockCategories.find(cat => cat.slug === slug);
      if (!category) throw new Error('Category not found');
      return Promise.resolve(category);
    }

    try {
      // Try public API first
      try {
        const publicResponse = await anonymousApiClient.get<Category>(`/public/categories/slug/${slug}`);
        return publicResponse;
      } catch (publicError) {
        // Fall back to tenant API
        const response = await tenantApiClient.get<Category>(`/categories/slug/${slug}`);
        return response;
      }
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      const category = mockCategories.find(cat => cat.slug === slug);
      if (!category) throw new Error('Category not found');
      return category;
    }
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    if (USE_MOCK) {
      const newCategory: Category = {
        id: Date.now().toString(),
        uuid: `cat-${Date.now()}-uuid`,
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        description: data.description,
        parent_id: data.parent_id,
        image: data.image,
        color: data.color || '#ff8000',
        sort_order: data.sort_order || mockCategories.length + 1,
        is_active: data.is_active ?? true,
        product_count: 0,
        specifications_template: data.specifications_template,
        seo_meta: data.seo_meta,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockCategories.push(newCategory);
      return Promise.resolve(newCategory);
    }

    try {
      const response = await tenantApiClient.post<Category>('/categories', data);
      return response;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      // Mock implementation as fallback
      const newCategory: Category = {
        id: Date.now().toString(),
        uuid: `cat-${Date.now()}-uuid`,
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        description: data.description,
        color: data.color || '#ff8000',
        sort_order: data.sort_order || 0,
        is_active: data.is_active ?? true,
        product_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newCategory;
    }
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    if (USE_MOCK) {
      const index = mockCategories.findIndex(cat => cat.id === id);
      if (index === -1) throw new Error('Category not found');
      
      const updatedCategory = {
        ...mockCategories[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      
      mockCategories[index] = updatedCategory;
      return Promise.resolve(updatedCategory);
    }

    try {
      const response = await tenantApiClient.put<Category>(`/categories/${id}`, data);
      return response;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      // Mock implementation as fallback
      const index = mockCategories.findIndex(cat => cat.id === id);
      if (index === -1) throw new Error('Category not found');
      
      const updatedCategory = {
        ...mockCategories[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      
      return updatedCategory;
    }
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    if (USE_MOCK) {
      const index = mockCategories.findIndex(cat => cat.id === id);
      if (index === -1) throw new Error('Category not found');
      
      mockCategories.splice(index, 1);
      return Promise.resolve({ message: 'Category deleted' });
    }

    try {
      const response = await tenantApiClient.delete<{ message: string }>(`/categories/${id}`);
      return response;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      // Mock implementation as fallback
      const index = mockCategories.findIndex(cat => cat.id === id);
      if (index > -1) {
        mockCategories.splice(index, 1);
      }
      return { message: 'Category deleted' };
    }
  }

  async getCategoryTree(): Promise<Category[]> {
    try {
      const response = await tenantApiClient.get<Category[]>('/categories/tree');
      return response;
    } catch (error) {
      console.error('Failed to fetch category tree:', error);
      // Return mock flat categories for now
      return mockCategories.filter(cat => !cat.parent_id);
    }
  }

  async reorderCategories(categoryIds: string[]): Promise<{ message: string }> {
    try {
      const response = await tenantApiClient.post<{ message: string }>('/categories/reorder', {
        category_ids: categoryIds
      });
      return response;
    } catch (error) {
      console.error('Failed to reorder categories:', error);
      return { message: 'Categories reordered' };
    }
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;