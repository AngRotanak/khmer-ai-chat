import type { InputHTMLAttributes } from 'react'
import { cn } from '~@/utils/cn'

type Props = {
  label?: string
  value: string
  onChange: (val: string) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>

export function Input({ label, value, onChange, className, ...props }: Props) {
  return (
    <div className="space-y-1">
      {label && <div className="text-xs font-medium text-light-50">{label}</div>}
      <input
        {...props}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'w-full rounded-md border border-dark-300 bg-dark-400 px-3 py-2 text-sm text-white placeholder:text-light-50/40 focus:(outline-none ring-2 ring-amber-600)',
          className
        )}
      />
    </div>
  )
}
