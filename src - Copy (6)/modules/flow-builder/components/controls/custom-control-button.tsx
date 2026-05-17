import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '~@/utils/cn'

type CustomControlButtonProps = Readonly<ComponentPropsWithoutRef<'button'>>

export default function CustomControlButton({ children, className, ...props }: CustomControlButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'border-none flex items-center justify-center size-7 rounded-md bg-transparent text-light-50 dark:text-light-100 transition',
        'hover:bg-dark-300 dark:hover:bg-dark-700',
        'active:bg-dark-200 dark:active:bg-dark-600',
        'disabled:pointer-events-none disabled:opacity-30 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
