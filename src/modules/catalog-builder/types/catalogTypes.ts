/* eslint-disable */
// @ts-nocheck

export interface ProductImage {
  id?: string
  url: string
  isCover: boolean
  thumbnail?: string
}

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
