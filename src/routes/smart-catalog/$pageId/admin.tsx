/* eslint-disable */
// @ts-nocheck

import React, { useState } from 'react'
import { useCatalog } from '~/modules/catalog-builder/hooks/useCatalog'
import ProductEditor from '~/modules/catalog-builder/components/ProductEditor'
import { createFileRoute } from '@tanstack/react-router'
import { useFlowSession } from '~/stores/flow-session'

export default function AdminDashboard() {
  const { currentPageId } = useFlowSession()
  const { items, loading, error } = useCatalog(currentPageId) // 🔹 pass pageId here
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!currentPageId) {
    return (
      <div className="flex justify-center items-start h-screen bg-gray-900">
        <div className="w-80 bg-gray-800 rounded-lg shadow-lg p-6 mt-24 text-center space-y-4">
          <h2 className="text-gray-100 text-base font-medium">Select a page to continue</h2>
          {/* You can reuse PageSelector here if you want */}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-teal-400">Catalog Admin</h1>

      {error && <p className="text-red-400">{error}</p>}
      {loading && <p className="text-teal-400">Loading...</p>}

      {/* Product Table */}
      <table className="w-full border-collapse border border-gray-700 mb-6">
        <thead>
          <tr className="bg-gray-800 text-gray-100">
            <th className="border border-gray-700 p-2">Title</th>
            <th className="border border-gray-700 p-2">Category</th>
            <th className="border border-gray-700 p-2">Price</th>
            <th className="border border-gray-700 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td className="border border-gray-700 p-2">{p.title}</td>
              <td className="border border-gray-700 p-2">{p.category}</td>
              <td className="border border-gray-700 p-2">{p.price}</td>
              <td className="border border-gray-700 p-2">
                <button
                  onClick={() => setEditingId(p.id)}
                  className="bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add New Product */}
      <button
        onClick={() => setEditingId(null)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-6"
      >
        Add New Product
      </button>

      {/* Product Editor */}
      <ProductEditor productId={editingId || undefined} pageId={currentPageId} />
    </div>
  )
}

/**
 * 🔹 Required Route export for TanStack Router
 */
export const Route = createFileRoute('/smart-catalog/$pageId/admin')({
  component: AdminDashboard,
})
