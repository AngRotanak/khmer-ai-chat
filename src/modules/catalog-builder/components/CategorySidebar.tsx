/* eslint-disable */
// @ts-nocheck

import React from 'react'

interface CategorySidebarProps {
  categories: any[]
  onSelect: (categoryId: string) => void
  onAddCategory: () => void
  onMoveCategory?: (dragId: string, dropId: string) => void
}

/**
 * CategorySidebar
 * Displays a tree of categories with drag-and-drop support.
 * Allows admins to select, add, and reorder categories.
 */
export default function CategorySidebar({
  categories,
  onSelect,
  onAddCategory,
  onMoveCategory,
}: CategorySidebarProps) {
  return (
    <aside className="w-full lg:w-64 bg-light-50 dark:bg-dark-900 border-r border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold mb-4">Categories</h3>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="cursor-pointer px-3 py-2 rounded hover:bg-teal-100 dark:hover:bg-dark-700"
            onClick={() => onSelect(cat.id)}
            draggable={!!onMoveCategory}
            onDragStart={(e) => e.dataTransfer.setData('catId', cat.id)}
            onDrop={(e) => {
              e.preventDefault()
              const dragId = e.dataTransfer.getData('catId')
              if (onMoveCategory) onMoveCategory(dragId, cat.id)
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {cat.name}
            {cat.children && cat.children.length > 0 && (
              <ul className="ml-4 mt-1 space-y-1">
                {cat.children.map((child) => (
                  <li
                    key={child.id}
                    className="cursor-pointer px-2 py-1 rounded hover:bg-teal-50 dark:hover:bg-dark-800"
                    onClick={() => onSelect(child.id)}
                  >
                    {child.name}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <button
        onClick={onAddCategory}
        className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded"
      >
        + New Category
      </button>
    </aside>
  )
}
