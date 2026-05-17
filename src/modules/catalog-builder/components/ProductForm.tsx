/* eslint-disable */
// @ts-nocheck

import React from 'react'
import ImageUploader from './ImageUploader'
import VideoUploader from './VideoUploader'
import RichTextEditor from './RichTextEditor'
import CategorySelector from './CategorySelector'
import TagSelector from './TagSelector'

interface ProductFormProps {
  product: any
  onChange: (updated: any) => void
}

/**
 * ProductForm
 * Admin input panel for creating/editing products.
 * Handles media, title, description, price, category, and tags.
 */
export default function ProductForm({ product, onChange }: ProductFormProps) {
  return (
    <form className="space-y-6">
      {/* Media Upload */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Media</h3>
        <ImageUploader
          images={product.images}
          onChange={(images) => onChange({ ...product, images })}
        />
        <VideoUploader
          video={product.video}
          onChange={(video) => onChange({ ...product, video })}
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={product.title}
          onChange={(e) => onChange({ ...product, title: e.target.value })}
          className="w-full border p-2 rounded"
          placeholder="Product Title"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <RichTextEditor
          value={product.description}
          onChange={(desc) => onChange({ ...product, description: desc })}
        />
      </div>

      {/* Price & Discount */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            value={product.price}
            onChange={(e) => onChange({ ...product, price: e.target.value })}
            className="w-full border p-2 rounded"
            placeholder="Price"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Discount Price</label>
          <input
            type="number"
            value={product.discount || ''}
            onChange={(e) => onChange({ ...product, discount: e.target.value })}
            className="w-full border p-2 rounded"
            placeholder="Discount Price"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <CategorySelector
          category={product.category}
          onChange={(cat) => onChange({ ...product, category: cat })}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <TagSelector
          tags={product.tags}
          onChange={(tags) => onChange({ ...product, tags })}
        />
      </div>
    </form>
  )
}
