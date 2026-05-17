/* eslint-disable */
// @ts-nocheck

import React from 'react'

interface DualPreviewLayoutProps {
  children: React.ReactNode   // Admin form panel
  preview: React.ReactNode    // Customer preview panel
}

/**
 * DualPreviewLayout
 * Splits the screen into two panels (form + preview).
 * - Desktop: side-by-side (flex-row)
 * - Mobile: stacked (flex-col)
 */
export default function DualPreviewLayout({ children, preview }: DualPreviewLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row h-full w-full">
      {/* Left Panel: Admin Form */}
      <div className="flex-1 p-4 overflow-y-auto bg-light-50 dark:bg-dark-900">
        {children}
      </div>

      {/* Right Panel: Customer Preview */}
      <div className="flex-1 p-4 overflow-y-auto bg-light-100 dark:bg-dark-800 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
        {preview}
      </div>
    </div>
  )
}
