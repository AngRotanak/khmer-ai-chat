import type { Node } from '@xyflow/react'
import { nanoid } from 'nanoid'

import { BuilderNode } from '~/modules/nodes/types'
import type { BuilderNodeType } from '~/modules/nodes/types'

import { NODES_METADATA } from '~/modules/nodes'



export function getNodeDetail(nodeType: BuilderNodeType | string | undefined) {
  const node = NODES_METADATA[nodeType as BuilderNodeType]
  if (!node) {
    throw new Error(`Node type "${nodeType}" not found`)
  }
  return node.__details
}

export function createNodeData<T extends BuilderNodeType>(type: T, data: any) {
  return {
    id: nanoid(),
    type,
    data,
  }
}


export function createNodeWithDefaultData(type: BuilderNodeType, overrides?: Partial<Node>) {
  const defaultData = NODES_METADATA[type]?.defaultData
  if (!defaultData) {
    throw new Error(`No default data found for node type "${type}"`)
  }

  // ✅ Inject default paths for feature-block nodes
  const enrichedData =
    type === 'feature-block'
      ? {
          ...defaultData,
          paths: [
            {
              id: nanoid(), // ✅ stable, unique ID
              label: 'Path 1',
              blockType: 'info',
              targetBlockId: null,
            },
          ],
        }
      : defaultData

  return {
    ...createNodeData(type, enrichedData),
    ...overrides,
  } as Node
}


export function createNodeWithData<T>(type: BuilderNode, data: T, overrides: Partial<Node> = {}) {
  return {
    ...createNodeData(type, data),
    ...overrides,
  } as Node
}

export function isFeatureBlockNode(node: Node): boolean {
  return node.type === 'feature-block'
}

import type { TextMessageNodeData, GenericTemplateNodeData } from '~/modules/nodes/types'

export function isTextMessageNode(node: Node): node is Node<TextMessageNodeData> {
  return node.type === BuilderNode.TEXT_MESSAGE
}

export function isGenericTemplateNode(node: Node): node is Node<GenericTemplateNodeData> {
  return node.type === BuilderNode.GENERIC_TEMPLATE
}

import type { EndNodeData } from '~/modules/nodes/types'

export function isEndNode(node: Node): node is Node<EndNodeData> {
  return node.type === BuilderNode.END
}
