/* eslint-disable */
// @ts-nocheck

/**
 * Represents a single image in the product gallery
 */
export interface ProductImage {
  id?: string
  url: string
  isCover: boolean
  thumbnail?: string
}

/**
 * Represents a single product in the catalog
 */
export interface Product {
  id?: string
  title: string
  description?: string
  price: number
  discount?: number
  video?: any
  images?: ProductImage[]
  tags?: string[]
  category?: string
  createdAt?: number
  slug?: string
}

/**
 * Sorting options for catalog
 */
export type SortOption = 'createdAt' | 'price' | 'discount' | 'title'

/**
 * Filtering options for catalog
 */
export interface FilterOptions {
  category?: string
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  searchTerm?: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems?: number
  totalPages?: number
  hasNext: boolean
  hasPrev: boolean
}
