/* eslint-disable */
// @ts-nocheck

import React, { useState } from 'react'
import { useCatalog } from '~/modules/catalog-builder/hooks/useCatalog'
import { sortProducts, filterProducts, calculateFinalPrice, getCoverImage } from '~/modules/catalog-builder/utils/catalogHelpers'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useFlowSession } from '~/stores/flow-session'
import { PageSelector } from "~/modules/shared/components/PageSelector"
import { CategorySelector } from "~/modules/catalog-builder/components/CategorySelector"

export default function SmartCatalog() {
  const { currentPageId } = useFlowSession()

  // ✅ Always call hooks at the top level
  const { items = [], loading, error } = useCatalog(currentPageId || "default")

  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState<'price' | 'title' | 'createdAt'>('createdAt')

  // ✅ Safe defaults for helpers
  const filtered = filterProducts(items || [], { category, searchTerm })
  const sorted = sortProducts(filtered || [], sortBy, 'asc')

  // If no page selected, show selector
  if (!currentPageId) {
    return (
      <div className="flex justify-center items-start h-screen bg-gray-900">
        <div className="w-80 bg-gray-800 rounded-lg shadow-lg p-6 mt-24 text-center space-y-4">
          <h2 className="text-gray-100 text-base font-medium">Select a page to continue</h2>
          <PageSelector />
        </div>
      </div>
    )
  }

  // 🔹 Example categories (could later be fetched dynamically)
  const categories = ["Shoes", "Hats", "Accessories"]

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-teal-400">Smart Catalog</h1>

      <div className="mb-6">
        <Link
          to="/smart-catalog/$pageId/admin"
          params={{ pageId: currentPageId }}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
        >
          Manage Catalog (Admin)
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-teal-500 bg-gray-800 text-gray-100 p-2 rounded w-1/3"
        />

        <CategorySelector
          categories={categories}
          selected={category}
          onChange={setCategory}
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-teal-500 bg-gray-800 text-gray-100 p-2 rounded"
        >
          <option value="createdAt">Newest</option>
          <option value="price">Price</option>
          <option value="title">Title</option>
        </select>
      </div>

      {loading && <p className="text-teal-400">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sorted.map((p) => {
          const cover = getCoverImage(p.images || [])
          return (
            <div
              key={p.id}
              className="border border-gray-700 rounded-md p-4 bg-gray-800 shadow hover:border-teal-400 transition"
            >
              {cover && (
                <img
                  src={cover.thumbnail || cover.url}
                  alt={p.title || "Untitled"}
                  className="w-full h-40 object-cover mb-2 rounded"
                />
              )}
              <h2 className="font-semibold text-teal-300">{p.title || "Untitled"}</h2>
              <p className="text-sm text-gray-400">{p.category || "Uncategorized"}</p>
              <p className="mt-2 font-bold text-teal-200">
                {calculateFinalPrice(p.price || 0, p.discount || 0)} USD
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/smart-catalog')({
  component: SmartCatalog,
})
