import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '~@/utils/cn'

type SidebarButtonItemProps = Readonly<ComponentPropsWithoutRef<'button'> & {
  active?: boolean;
}>

export default function SidebarButtonItem({ children, className, active, ...props }: SidebarButtonItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'size-8 flex items-center justify-center rounded-lg border border-transparent outline-none transition',
        active
          ? 'border-teal-700 bg-teal-700 text-white dark:border-teal-500 dark:bg-teal-600'
          : 'bg-transparent hover:bg-dark-200 active:(bg-dark-500 border-dark-300) dark:hover:bg-dark-700 dark:active:(bg-dark-800 border-dark-600)',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
