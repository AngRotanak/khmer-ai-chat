import type { BotBlock } from '~/modules/nodes'

export function BlockCard({ block }: { block: BotBlock }) {
  return (
    <div className="rounded border border-light-300 p-3 bg-dark-800">
      <div className="font-bold text-light-50">{block.type}</div>
      <div className="text-xs text-light-400">ID: {block.id}</div>
      <div className="text-sm text-light-300 mt-1">
        KH: {block.content.kh.message_kh || '—'}
      </div>
      <div className="text-sm text-light-300">
        EN: {block.content.en.message_en || '—'}
      </div>
    </div>
  )
}
