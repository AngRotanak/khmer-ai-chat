/* eslint-disable */
// @ts-nocheck

import React, { useState } from 'react'

export default function TagSelector({ availableTags = [], value = [], onChange }) {
  const [inputValue, setInputValue] = useState('')

  const addTag = (tag) => {
    if (!value.includes(tag)) {
      const updated = [...value, tag]
      if (onChange) onChange(updated)
    }
    setInputValue('')
  }

  const removeTag = (tag) => {
    const updated = value.filter((t) => t !== tag)
    if (onChange) onChange(updated)
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addTag(inputValue.trim())
    }
  }

  return (
    <div className="border rounded-md p-2 bg-white dark:bg-gray-900">
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-teal-100 text-teal-800 dark:bg-teal-700 dark:text-white px-2 py-1 rounded"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Input for new tags */}
      <input
        type="text"
        placeholder="Add a tag..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyDown}
        className="border p-2 rounded w-full mb-2 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
      />

      {/* Available Tags */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className={`px-2 py-1 rounded transition ${
                value.includes(tag)
                  ? 'bg-teal-600 text-white hover:bg-teal-700 dark:hover:bg-teal-500'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
