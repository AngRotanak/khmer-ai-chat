/* eslint-disable */
// @ts-nocheck

import React from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (onChange) onChange(html)
    },
  })

  if (!editor) return null

  return (
    <div className="border rounded-md p-2 bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded transition ${
            editor.isActive('bold')
              ? 'bg-teal-600 text-white hover:bg-teal-700 dark:hover:bg-teal-500'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded transition ${
            editor.isActive('italic')
              ? 'bg-teal-600 text-white hover:bg-teal-700 dark:hover:bg-teal-500'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-2 py-1 rounded transition ${
            editor.isActive('underline')
              ? 'bg-teal-600 text-white hover:bg-teal-700 dark:hover:bg-teal-500'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Underline
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded transition ${
            editor.isActive('bulletList')
              ? 'bg-teal-600 text-white hover:bg-teal-700 dark:hover:bg-teal-500'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          • List
        </button>
        <button
          onClick={() => {
            const url = prompt('Enter URL')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`px-2 py-1 rounded transition ${
            editor.isActive('link')
              ? 'bg-teal-600 text-white hover:bg-teal-700 dark:hover:bg-teal-500'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Link
        </button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="min-h-[150px] p-2 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded"
      />
    </div>
  )
}
