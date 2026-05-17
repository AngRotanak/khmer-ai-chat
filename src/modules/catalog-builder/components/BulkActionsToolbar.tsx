/* eslint-disable */
// @ts-nocheck

import React from 'react'

interface BulkActionsToolbarProps {
  selectedCount: number
  onDelete: () => void
  onMoveCategory: () => void
  onApplyDiscount: () => void
}

/**
 * BulkActionsToolbar
 * Appears when multiple products are selected in the grid.
 * Provides quick bulk actions: delete, move, apply discount.
 */
export default function BulkActionsToolbar({
  selectedCount,
  onDelete,
  onMoveCategory,
  onApplyDiscount,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-800 shadow-lg border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
      <span className="text-sm font-medium">
        {selectedCount} product{selectedCount > 1 ? 's' : ''} selected
      </span>

      <div className="flex gap-3">
        <button
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Delete
        </button>
        <button
          onClick={onMoveCategory}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
        >
          Move to Category
        </button>
        <button
          onClick={onApplyDiscount}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
        >
          Apply Discount
        </button>
      </div>
    </div>
  )
}
