import { cn } from '~/utils/cn'

import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({
  className,
  children,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const base =
    'px-3 py-1 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'

  const styles: Record<Variant, string> = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700',
    secondary: 'bg-dark-300 text-light-50 hover:bg-dark-400',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  return (
    <button
      {...props}
      className={cn(base, styles[variant], className)}
    >
      {children}
    </button>
  )
}
