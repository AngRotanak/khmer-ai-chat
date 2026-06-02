import type { ReactNode } from "react"

interface TooltipProps {
  label: string
  children: ReactNode
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <div className="relative group flex items-center justify-center">
      {children}
      <div
        className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 
                   transition-opacity duration-200 bg-dark-700 text-light-100 
                   text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
      >
        {label}
      </div>
    </div>
  )
}
