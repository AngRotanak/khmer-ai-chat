/* eslint-disable */
// @ts-nocheck

import React from "react"

interface CategorySelectorProps {
  categories: string[]
  selected: string
  onChange: (value: string) => void
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selected,
  onChange,
}) => {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="border border-teal-500 bg-gray-800 text-gray-100 p-2 rounded"
    >
      <option value="">All Categories</option>
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  )
}
