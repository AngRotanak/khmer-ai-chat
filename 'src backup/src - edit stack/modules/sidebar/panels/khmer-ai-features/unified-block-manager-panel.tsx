import { useState } from 'react'
import type { BotBlock } from '~/modules/nodes/types'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { BlockList } from './components/block-list'
import { BlockEditor } from './components/block-editor'

export function UnifiedBlockManagerPanel() {
  const [blocks, setBlocks] = useState<BotBlock[]>([])
  const [selectedBlock, setSelectedBlock] = useState<BotBlock | null>(null)

  return (
    <SidebarPanelWrapper>
      <div className="p-4">
        <h2 className="text-lg font-bold text-light-50 mb-2">📦 Manage Unified Blocks</h2>
        <p className="text-xs text-light-50/60 mb-4">
          Select a block to edit or delete. All content is multilingual and admin-safe.
        </p>

        <BlockList blocks={blocks} onSelect={setSelectedBlock} />

        {selectedBlock && (
          <div className="mt-4">
            <BlockEditor
              block={selectedBlock}
              onSave={updated => {
                setBlocks(prev =>
                  prev.map(b => (b.id === updated.id ? updated : b))
                )
                setSelectedBlock(null)
              }}
              onDelete={id => {
                setBlocks(prev => prev.filter(b => b.id !== id))
                setSelectedBlock(null)
              }}
            />
          </div>
        )}
      </div>
    </SidebarPanelWrapper>
  )
}
