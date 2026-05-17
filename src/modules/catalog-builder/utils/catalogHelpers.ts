/* eslint-disable */
// @ts-nocheck

import type { Product, ProductImage } from '../types/catalogTypes'

/**
 * Calculate final price after discount
 */
export function calculateFinalPrice(price: number, discount?: number): number {
  if (!discount || discount <= 0) return price
  return +(price - (price * discount) / 100).toFixed(2)
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

/**
 * Get cover image from product images
 */
export function getCoverImage(images: ProductImage[] = []): ProductImage | null {
  if (!images?.length) return null
  const cover = images.find((img) => img.isCover)
  return cover || images[0]
}

/**
 * Get gallery thumbnails
 */
export function getGalleryThumbnails(images: ProductImage[] = []): string[] {
  return (images || []).map((img) => img.thumbnail || img.url)
}

/**
 * Generate a slug from product title
 */
export function generateSlug(title: string = ''): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Validate product before saving
 */
export function validateProduct(product: Product): string[] {
  const errors: string[] = []
  if (!product.title || product.title.trim().length === 0) {
    errors.push('Title is required')
  }
  if (!product.price || product.price <= 0) {
    errors.push('Price must be greater than 0')
  }
  if (!product.images || product.images.length === 0) {
    errors.push('At least one image is required')
  }
  return errors
}

/**
 * Prepare product payload for Firestore
 */
export function prepareProductPayload(product: Product): any {
  return {
    ...product,
    images: product.images?.map((img) => ({
      url: img.url,
      isCover: img.isCover,
      thumbnail: img.thumbnail || null,
    })),
    createdAt: product.createdAt || Date.now(),
    slug: generateSlug(product.title || ''),
  }
}

/**
 * 🔹 Sorting utilities
 */
export function sortProducts(
  products: Product[] = [],
  sortBy: 'price' | 'discount' | 'title' | 'createdAt',
  direction: 'asc' | 'desc' = 'asc'
): Product[] {
  return [...(products || [])].sort((a, b) => {
    let valA: any = a?.[sortBy] || 0
    let valB: any = b?.[sortBy] || 0

    if (sortBy === 'title') {
      valA = a?.title?.toLowerCase() || ''
      valB = b?.title?.toLowerCase() || ''
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1
    if (valA > valB) return direction === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * 🔹 Filtering utilities
 */
export function filterProducts(
  products: Product[] = [],
  options: { category?: string; tags?: string[]; minPrice?: number; maxPrice?: number; searchTerm?: string }
): Product[] {
  return (products || []).filter((p) => {
    const title = p?.title || ""
    const description = p?.description || ""
    const category = p?.category || ""
    const tags = p?.tags || []

    if (options.category && category !== options.category) return false
    if (options.tags?.length) {
      const hasTag = options.tags.some((tag) => tags.includes(tag))
      if (!hasTag) return false
    }
    if (options.minPrice && p.price < options.minPrice) return false
    if (options.maxPrice && p.price > options.maxPrice) return false
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase()
      const matches =
        title.toLowerCase().includes(term) ||
        description.toLowerCase().includes(term) ||
        tags.some((t) => t.toLowerCase().includes(term))
      if (!matches) return false
    }
    return true
  })
}

