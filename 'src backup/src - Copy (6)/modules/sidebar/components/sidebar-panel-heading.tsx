import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '~@/utils/cn'

type SidebarPanelHeadingProps = Readonly<ComponentPropsWithoutRef<'div'>>

export default function SidebarPanelHeading({ children, className, ...props }: SidebarPanelHeadingProps) {
  return (
    <div
      className={cn(
        'flex items-center text-sm h-10 leading-none px-4 border-b select-none shrink-0',
        'border-dark-300 bg-dark-400/80 text-light-100/60',
        'dark:border-dark-600 dark:bg-dark-900/80 dark:text-light-100',
        'text-center gap-x-2 font-semibold',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
