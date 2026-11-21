export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type SortOption = 
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc'
  | 'newest'
  | 'rating'
  | 'stock_asc'
  | 'stock_desc';

export interface FilterParams {
  category?: string;
  categoryId?: string;
  subcategory?: string;
  subcategoryId?: string;
  brand?: string;
  brandId?: string;
  sku?: string;
  productId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  query?: string;
  featured?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  onSale?: boolean;
  status?: 'active' | 'inactive' | 'all';
  stockStatus?: 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'all';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}
