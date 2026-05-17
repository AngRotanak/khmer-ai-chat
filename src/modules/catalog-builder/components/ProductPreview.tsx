/* eslint-disable */
// @ts-nocheck

import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'

interface ProductPreviewProps {
  product: any
}

/**
 * ProductPreview
 * Customer-facing preview card that shows how the product
 * will look in the public catalog.
 */
export default function ProductPreview({ product }: ProductPreviewProps) {
  const catalogUrl = `${window.location.origin}/smart-catalog/${product.pageId}/${product.id}`

  return (
    <div className="rounded-lg shadow bg-white dark:bg-dark-700 p-6">
      {/* Image */}
      {product.images?.[0] && (
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-48 object-cover rounded mb-4"
        />
      )}

      {/* Video */}
      {product.video && (
        <div className="mb-4">
          <video src={product.video} controls className="w-full rounded" />
        </div>
      )}

      {/* Title */}
      <h2 className="text-xl font-semibold mb-2">{product.title || 'Untitled Product'}</h2>

      {/* Price */}
      <p className="text-lg text-gray-900 dark:text-gray-200 mb-2">
        {product.discount ? (
          <>
            <span className="font-bold">${product.discount}</span>
            <span className="line-through ml-2 text-sm text-gray-500">${product.price}</span>
          </>
        ) : (
          <span className="font-bold">${product.price}</span>
        )}
      </p>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {product.description || 'No description provided.'}
      </p>

      {/* Tags */}
      <div className="flex gap-2 mb-4">
        {product.tags?.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs rounded bg-teal-100 text-teal-700"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center">
        <QRCodeCanvas value={catalogUrl} size={120} />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Scan to view product
        </p>
      </div>
    </div>
  )
}
