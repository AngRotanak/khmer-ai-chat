import { useState } from 'react'
import { createNewBlock } from '~/modules/nodes/utils/blockFactory'
import type { BotBlock, BotBlockType } from '~/modules/nodes'
import { Select } from '~/components/ui/select'
import { BlockCard } from './cards/BlockCard'

export function BlockManager() {
  const [blocks, setBlocks] = useState<BotBlock[]>([])
  const [selectedType, setSelectedType] = useState<BotBlockType>('quick-menu')

  function handleCreateBlock() {
    const newBlock = createNewBlock(selectedType)
    console.log('🧱 Creating block:', newBlock)
    setBlocks(prev => [...prev, newBlock])
  }

  return (
    <div className="space-y-4">
      <Select
        label="Block Type"
        value={selectedType}
        onChange={val => {
          console.log('🔀 Selected type:', val)
          setSelectedType(val as BotBlockType)
        }}
        options={[
          { label: 'Smart Welcome', value: 'smart_welcome' },
          { label: 'Quick Menu', value: 'quick_menu' },
          { label: 'Intent', value: 'intent' },
          { label: 'Info', value: 'info' },
          { label: 'Product', value: 'product' }
        ]}
      />

      <button onClick={handleCreateBlock} className="btn btn-primary">
        ➕ Create {selectedType} Block
      </button>

      <div className="space-y-2">
        {!blocks.length && (
          <div className="text-light-400 text-sm">No blocks created yet</div>
        )}
        {blocks.map(block => (
          <BlockCard key={block.id} block={block} />
        ))}
      </div>
    </div>
  )
}
