import { nanoid } from 'nanoid'
import type { Node } from '@xyflow/react'
import type { BotBlockType } from '~/modules/nodes/types'
import { createNewBlock } from '~/modules/nodes/utils/blockFactory'

interface SmartWelcomeButton {
  id: string
  label: string
  blockType: BotBlockType
  targetBlockId: string | null
}

interface Props {
  node: Node
  updateNode: (node: Node) => void
  setBlocks: (fn: (prev: Node[]) => Node[]) => void
  addEdge: (edge: any) => void
}

export function SmartWelcomeConfig({ node, updateNode, setBlocks, addEdge }: Props) {
  const buttons: SmartWelcomeButton[] = (node.data?.buttons || []) as SmartWelcomeButton[]

  function updateButton(index: number, changes: Partial<SmartWelcomeButton>) {
    const updated = [...buttons]
    updated[index] = { ...updated[index], ...changes }

    if (changes.blockType) {
      const newBlock = createNewBlock(changes.blockType as BotBlockType)

      const reactFlowNode: Node = {
        id: newBlock.id,
        type: newBlock.type,
        position: { x: 300, y: 300 + index * 120 },
        data: newBlock.data
      }

      setBlocks(prev => [...prev, reactFlowNode])
      updated[index].targetBlockId = newBlock.id

      addEdge({
        id: nanoid(),
        source: node.id,
        sourceHandle: updated[index].id,
        target: newBlock.id,
        type: 'default'
      })
    }

    updateNode({ ...node, data: { ...node.data, buttons: updated } })
  }

  function addNewButton() {
    const newButton: SmartWelcomeButton = {
      id: nanoid(),
      label: 'ប៊ូតុងថ្មី',
      blockType: 'intent',
      targetBlockId: null
    }

    updateNode({
      ...node,
      data: {
        ...node.data,
        buttons: [...buttons, newButton]
      }
    })
  }

  return (
    <div className="space-y-4 p-4">
      {buttons.map((btn, index) => (
        <div key={btn.id} className="space-y-2 border p-2 rounded bg-dark-300">
          <input
            value={btn.label}
            onChange={e => updateButton(index, { label: e.target.value })}
            className="input"
            placeholder="Button label"
          />

          <select
            value={btn.blockType}
            onChange={e => updateButton(index, { blockType: e.target.value as BotBlockType })}
            className="input"
          >
            <option value="quick-menu-node">📋 មឺនុយរហ័ស (Quick Menu)</option>
            <option value="intent">🎯 បំណង (Intent)</option>
            <option value="info">ℹ️ ព័ត៌មាន (Info)</option>
            <option value="product">🛍️ ផលិតផល (Product)</option>
          </select>

          <div className="text-xs text-light-400">
            → {btn.targetBlockId ? btn.blockType : 'មិនទាន់ភ្ជាប់'}
          </div>
        </div>
      ))}

      <button
        className="btn btn-sm bg-teal-700 text-white"
        onClick={addNewButton}
      >
        + បន្ថែមប៊ូតុង
      </button>
    </div>
  )
}
