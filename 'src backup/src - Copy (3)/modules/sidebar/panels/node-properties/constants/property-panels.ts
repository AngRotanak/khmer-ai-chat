import type { ComponentType } from 'react'
import type { BuilderNodeType } from '~/modules/nodes/types'
import { NODES } from '~/modules/nodes'

// ✅ Shared prop type for all node property panels
export type NodePropertyPanelProps = {
  id: string
  type: BuilderNodeType
  selectedPathId?: string // ✅ Add this line
}

// ✅ Auto-register property panels from each node's metadata
export const NODE_PROPERTY_PANEL_COMPONENTS: Partial<
  Record<BuilderNodeType, ComponentType<NodePropertyPanelProps>>
> = {}

Object.assign(
  NODE_PROPERTY_PANEL_COMPONENTS,
  NODES.reduce((acc, node) => {
    if (node.propertyPanel) {
      acc[node.type] = node.propertyPanel
    }
    return acc
  }, {} as typeof NODE_PROPERTY_PANEL_COMPONENTS)
)
