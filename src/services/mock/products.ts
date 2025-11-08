import { Product, ProductFilters } from '@/types/product';
import productsData from './data/products.json';

let mockProducts: Product[] = JSON.parse(JSON.stringify(productsData));

export function getProducts(filters?: ProductFilters): Product[] {
  let filtered = [...mockProducts];

  if (!filters) return filtered;

  if (filters.category) {
    filtered = filtered.filter(p => p.category === filters.category);
  }

  if (filters.subcategory) {
    filtered = filtered.filter(p => p.subcategory === filters.subcategory);
  }

  if (filters.featured !== undefined) {
    filtered = filtered.filter(p => p.featured === filters.featured);
  }

  if (filters.status) {
    filtered = filtered.filter(p => p.status === filters.status);
  }

  if (filters.inStock !== undefined) {
    filtered = filtered.filter(p => p.inStock === filters.inStock);
  }

  if (filters.priceMin !== undefined) {
    filtered = filtered.filter(p => p.price >= filters.priceMin!);
  }

  if (filters.priceMax !== undefined) {
    filtered = filtered.filter(p => p.price <= filters.priceMax!);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(p => 
      filters.tags!.some(tag => p.tags.includes(tag))
    );
  }

  if (filters.offset !== undefined) {
    filtered = filtered.slice(filters.offset);
  }

  if (filters.limit !== undefined) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function getProductById(id: string): Product | undefined {
  return mockProducts.find(p => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find(p => p.slug === slug);
}

export function createProduct(data: Partial<Product>): Product {
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: data.name || '',
    slug: data.slug || '',
    description: data.description || '',
    longDescription: data.longDescription,
    images: data.images || [],
    category: data.category || '',
    subcategory: data.subcategory,
    tags: data.tags || [],
    material: data.material || '',
    price: data.price || 0,
    currency: data.currency || 'IDR',
    priceUnit: data.priceUnit || 'per pcs',
    minOrder: data.minOrder || 1,
    specifications: data.specifications || [],
    customizable: data.customizable || false,
    customOptions: data.customOptions,
    inStock: data.inStock !== undefined ? data.inStock : true,
    stockQuantity: data.stockQuantity,
    leadTime: data.leadTime || '3-5 hari kerja',
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    seoKeywords: data.seoKeywords,
    status: data.status || 'draft',
    featured: data.featured || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockProducts.push(newProduct);
  return newProduct;
}

export function updateProduct(id: string, data: Partial<Product>): Product {
  const index = mockProducts.findIndex(p => p.id === id);
  if (index === -1) {
    throw new Error(`Product with id ${id} not found`);
  }
  
  const updatedProduct: Product = {
    ...mockProducts[index],
    ...data,
    id: mockProducts[index].id,
    updatedAt: new Date().toISOString(),
  };
  
  mockProducts[index] = updatedProduct;
  return updatedProduct;
}

export function deleteProduct(id: string): boolean {
  const index = mockProducts.findIndex(p => p.id === id);
  if (index === -1) {
    return false;
  }
  
  mockProducts.splice(index, 1);
  return true;
}

export function getFeaturedProducts(limit = 3): Product[] {
  return mockProducts
    .filter(p => p.featured && p.status === 'published')
    .slice(0, limit);
}

export function getProductsByCategory(category: string, limit?: number): Product[] {
  const products = mockProducts.filter(p => 
    p.category === category && p.status === 'published'
  );
  
  return limit ? products.slice(0, limit) : products;
}

export function searchProducts(query: string, limit?: number): Product[] {
  const searchLower = query.toLowerCase();
  const results = mockProducts.filter(p => 
    p.status === 'published' && (
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  );
  
  return limit ? results.slice(0, limit) : results;
}

export function resetProducts(): void {
  mockProducts = JSON.parse(JSON.stringify(productsData));
}
