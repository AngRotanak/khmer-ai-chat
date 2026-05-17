import { cn } from '~@/utils/cn'

export type TabGroupProps = {
  tabs: string[]
  selected: string
  onChange: (value: string) => void
  className?: string
}

export function TabGroup({
  tabs,
  selected,
  onChange,
  className,
}: TabGroupProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium',
            selected === tab
              ? 'bg-amber-600 text-white'
              : 'bg-dark-400 text-light-50/70 hover:bg-dark-300'
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
