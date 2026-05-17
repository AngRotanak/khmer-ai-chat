import type { SelectHTMLAttributes } from 'react'
import { cn } from '~/utils/cn'

type Option<T extends string = string> = {
  label: string
  value: T
}

type Props<T extends string = string> = {
  label?: string
  options?: readonly Option<T>[] // ✅ accepts readonly tuples
  value: T
  onChange: (val: T) => void
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>

export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  children,
  ...props
}: Props<T>) {
  return (
    <div className="space-y-1">
      {label && <div className="text-xs font-medium text-light-50">{label}</div>}
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className={cn(
          'w-full rounded-md border border-dark-300 bg-dark-400 px-3 py-2 text-sm text-white focus:(outline-none ring-2 ring-amber-600)',
          className
        )}
        {...props}
      >
        {options?.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        )) ?? children}
      </select>
    </div>
  )
}
