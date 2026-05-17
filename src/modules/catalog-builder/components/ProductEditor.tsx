/* eslint-disable */
// @ts-nocheck

import React from 'react'
import { useProductEditor } from '../hooks/useProductEditor'
import RichTextEditor from './RichTextEditor'
import TagSelector from './TagSelector'
import VideoUploader from './VideoUploader'
import ImageUploader from './ImageUploader'

export default function ProductEditor({ productId }) {
  const {
    product,
    loading,
    error,
    saved,
    updateField,
    saveProduct,
    deleteProduct,
  } = useProductEditor(productId)

  return (
    <div className="border rounded-md p-4 bg-white dark:bg-gray-900">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        {productId ? 'Edit Product' : 'New Product'}
      </h2>

      {error && <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>}
      {saved && <p className="text-green-600 dark:text-green-400 mb-2">Product saved!</p>}

      {/* Title */}
      <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Title</label>
      <input
        type="text"
        value={product.title}
        onChange={(e) => updateField('title', e.target.value)}
        className="border p-2 rounded w-full mb-4 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      />

      {/* Price */}
      <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Price</label>
      <input
        type="number"
        value={product.price}
        onChange={(e) => updateField('price', parseFloat(e.target.value))}
        className="border p-2 rounded w-full mb-4 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      />

      {/* Discount */}
      <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Discount (%)</label>
      <input
        type="number"
        value={product.discount || 0}
        onChange={(e) => updateField('discount', parseFloat(e.target.value))}
        className="border p-2 rounded w-full mb-4 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      />

      {/* Rich Description */}
      <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Description</label>
      <RichTextEditor
        value={product.description}
        onChange={(html) => updateField('description', html)}
      />

      {/* Tags */}
      <label className="block mt-4 mb-2 font-semibold text-gray-700 dark:text-gray-300">Tags</label>
      <TagSelector
        availableTags={['New', 'Sale', 'Popular', 'Limited']}
        value={product.tags || []}
        onChange={(tags) => updateField('tags', tags)}
      />

      {/* Image Uploader */}
      <label className="block mt-4 mb-2 font-semibold text-gray-700 dark:text-gray-300">Product Images</label>
      <ImageUploader
        value={product.images || []}
        onChange={(files) => updateField('images', files)}
        uploadImage={async (file, onProgress) => {
          const total = 100
          for (let p = 0; p <= total; p += 20) {
            await new Promise((res) => setTimeout(res, 150))
            onProgress(p)
          }
          console.log('Uploaded image:', file.name)
        }}
      />

      {/* Video Uploader */}
      <label className="block mt-4 mb-2 font-semibold text-gray-700 dark:text-gray-300">Product Video</label>
      <VideoUploader
        value={product.video || null}
        onChange={(file) => updateField('video', file)}
        uploadVideo={async (file, onProgress, extraData) => {
          const total = 100
          for (let p = 0; p <= total; p += 10) {
            await new Promise((res) => setTimeout(res, 200))
            onProgress(p)
          }
          console.log('Uploaded video with metadata:', extraData)
        }}
      />

      {/* Actions */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={saveProduct}
          disabled={loading}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 dark:hover:bg-teal-500"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        {productId && (
          <button
            onClick={deleteProduct}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 dark:hover:bg-red-500"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
