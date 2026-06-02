import type { TextareaHTMLAttributes } from 'react'
import { cn } from '~@/utils/cn'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
}

export function Textarea({ label, className, ...props }: Props) {
  return (
    <div className="space-y-1">
      {label && <div className="text-xs font-medium text-light-50">{label}</div>}
      <textarea
        className={cn(
          'w-full rounded-md border border-dark-300 bg-dark-400 px-3 py-2 text-sm text-white placeholder:text-light-50/40 resize-none focus:(outline-none ring-2 ring-amber-600)',
          className
        )}
        {...props}
      />
    </div>
  )
}
