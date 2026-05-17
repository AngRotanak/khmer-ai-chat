

import type { BuilderNodeType, RegisterNodeMetadata } from '~/modules/nodes/types'

export const NODES: RegisterNodeMetadata[] = Object.values(import.meta.glob('~/modules/nodes/nodes/**/*.node.tsx',
  { eager: true })).map((module: any) => module.metadata).filter(Boolean)

// ✅ Add debug log here 
console.log("Loaded nodes:", NODES.map(n => n.type))

export const NODE_TYPES = NODES.reduce((acc, { type, node }) => {
  acc[type] = node
  return acc
}, {} as Record<string, any>)

export const NODES_METADATA = NODES.reduce((acc, current) => {
  acc[current.type] = { ...current, __details: { type: current.type, ...current.detail } }
  return acc
}, {} as Record<BuilderNodeType, RegisterNodeMetadata & { __details: { type: RegisterNodeMetadata['type'] } & RegisterNodeMetadata['detail'] }>)

export const AVAILABLE_NODES = NODES.filter(node => node.available === undefined || node.available).map(node => ({
  type: node.type,
  icon: node.detail.icon,
  title: node.detail.title,
  description: node.detail.description,
}))
export type { BotBlock, BotBlockType, QuickMenuButton } from './types'


import { nanoid } from 'nanoid';
import type { FeatureBlock, PathItem } from '~/modules/blocks/types/feature-block';

export function getPreviewFeatureBlockData(): FeatureBlock {
  const previewId = 'preview-id'
  const templateRef = 'preview_intro'

  const defaultPaths: PathItem[] = [
    {
      id: nanoid(),
      template_ref: templateRef,
      label: 'Path 1',
      blockType: 'text-message',
      targetBlockId: null,
      send_immediately: true,
      trigger: 'immediate',
      condition: { match: 'includes', value: '' },
      detection_mode: 'keyword',
      expected_intent: '',
      intent_confidence: 0.85,
      delay: { seconds: 0 },
      payload: {
        node_id: previewId,
        template_type: 'text-message',
        lang: 'en'
      }
    }
  ]

  return {
    block_id: previewId,
    block_name: 'Preview Block',
    block_type: 'info',
    is_active: true,
    tags: [],
    linked_pages: [],
    created_by: 'preview',
    last_updated: new Date().toISOString(),
    version: 1,
    entry_trigger: 'message',
    entry_condition: { match: 'includes', value: 'hello' },
    config: {},
    canvas: {
      layout: 'vertical',
      paths: defaultPaths
    },
    paths: defaultPaths,
    deletable: false
  }
}
