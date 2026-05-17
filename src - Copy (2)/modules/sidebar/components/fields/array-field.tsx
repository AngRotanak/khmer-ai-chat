import type { ReactNode } from 'react'

type Props<T> = {
  label: string
  items: T[]
  itemRenderer: (item: T, index: number) => ReactNode
}

function ArrayField<T>({ label, items, itemRenderer }: Props<T>) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium">{label}</label>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-center">
          {itemRenderer(item, index)}
        </div>
      ))}
    </div>
  )
}

export default ArrayField
