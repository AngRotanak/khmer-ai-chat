import type { InputHTMLAttributes } from 'react'
import { cn } from '~@/utils/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  value: number
  onChange: (val: number) => void
}

export function InputNumber({ label, value, onChange, className, ...props }: Props) {
  return (
    <div className="space-y-1">
      {label && <div className="text-xs font-medium text-light-50">{label}</div>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={cn(
          'w-full rounded-md border border-dark-300 bg-dark-400 px-3 py-2 text-sm text-white placeholder:text-light-50/40 focus:(outline-none ring-2 ring-amber-600)',
          className
        )}
        {...props}
      />
    </div>
  )
}
