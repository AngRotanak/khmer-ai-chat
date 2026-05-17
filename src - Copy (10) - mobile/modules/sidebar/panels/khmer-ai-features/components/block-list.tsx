import type { BotBlock } from '~/modules/nodes/types'
import { Button } from '~/components/ui/button'
import { cn } from '~@/utils/cn'

type BlockListProps = {
  blocks: BotBlock[]
  onSelect: (block: BotBlock) => void
}

export function BlockList({ blocks, onSelect }: BlockListProps) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-md border border-dark-300 bg-dark-400 p-4 text-center text-sm text-light-50/40">
        No blocks available. Please create one.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {blocks.map(block => (
        <Button
          key={block.id}
          className={cn(
            'w-full justify-start rounded-md border border-dark-300 bg-dark-400 px-3 py-2 text-left text-sm text-white hover:(bg-dark-300 ring-2 ring-amber-600)'
          )}
          onClick={() => onSelect(block)}
        >
          <div className="font-medium">{block.title_kh ?? block.title_en ?? 'Untitled Block'}</div>
          <div className="text-xs text-light-50/40">
            {block.type} • {block.id}
          </div>
        </Button>
      ))}
    </div>
  )
}
