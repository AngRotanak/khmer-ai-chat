import { useState } from 'react'
import { cn } from '~@/utils/cn'

type FloatingToolsPanelProps = {
  className?: string
  actions: {
    label: string
    icon?: string
    onClick: () => void
  }[]
}

export function FloatingToolsPanel({ className, actions }: FloatingToolsPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('fixed top-4 left-4 z-50', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full bg-dark-700/80 dark:bg-dark-900/80 px-3 py-1 text-xs text-white hover:text-teal-300 shadow backdrop-blur-md"
      >
        ⚙️ Tools
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="mt-2 w-[260px] rounded-lg bg-dark-800/80 dark:bg-dark-900/80 backdrop-blur-md shadow-lg ring-1 ring-dark-600 p-4 space-y-3 text-sm text-light-100">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="flex items-center gap-2 hover:text-teal-300"
            >
              {action.icon && <div className={cn('size-4', action.icon)} />}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
