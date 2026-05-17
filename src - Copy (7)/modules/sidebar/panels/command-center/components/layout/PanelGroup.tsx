import type { ReactNode } from 'react'

import { cn } from '~@/utils/cn'

type PanelGroupProps = {
  title: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}

export function PanelGroup({ title, expanded, onToggle, children }: PanelGroupProps) {
  return (
    <div className="rounded-lg border border-dark-300 dark:border-dark-600 bg-dark-800 dark:bg-dark-900">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-light-100 hover:text-teal-300"
      >
        <span className="font-semibold">{title}</span>
        <div
          className={cn(
            'i-mynaui:chevron-down size-4 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 flex flex-col min-h-0">
          {children}
        </div>
      )}

    </div>
  )
}
