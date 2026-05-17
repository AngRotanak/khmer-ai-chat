import type { Node } from '@xyflow/react'
import { nanoid } from 'nanoid'

import { BuilderNode } from '~/modules/nodes/types'
import type {
  BuilderNodeType,
  ConversationAgentNodeData,
  TextMessageNodeData,
  GenericTemplateNodeData,
  ButtonTemplateNodeData,
  MediaTemplateNodeData,
  QuickRepliesNodeData,
  EndNodeData
} from '~/modules/nodes/types'


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


export function createNodeWithDefaultData(
  type: BuilderNodeType,
  overrides?: Partial<Node>
) {
  const defaultData = NODES_METADATA[type]?.defaultData;
  if (!defaultData) {
    throw new Error(`No default data found for node type "${type}"`);
  }

  const nodeId = overrides?.id ?? nanoid();
  // ❌ remove "_intro" suffix
  const templateId = nodeId;

  const defaultPaths = [
    {
      id: nanoid(),
      label: 'Path 1',
      blockType: 'text-message',
      targetBlockId: null,
      template_ref: templateId,   // ✅ now matches shared_templates key
      send_immediately: true,
      trigger: 'immediate',
      detection_mode: 'keyword',
      expected_intent: '',
      intent_confidence: 0.85,
      condition: { match: 'includes', value: '' },
      delay: { seconds: 0 },
      payload: type === 'feature-block'
        ? undefined
        : { node_id: '', template_type: 'text-message', lang: 'en' }
    }
  ];

  const enrichedData =
    type === 'feature-block'
      ? {
          block_id: nodeId,
          block_name: '',
          block_type: (overrides as any)?.data?.blockType || 'info',
          is_active: true,
          tags: [],
          linked_pages: [],
          created_by: 'admin',
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
          deletable: true
        }
      : {
          ...defaultData,
          block_type: type,
          template_ref: templateId,   // ✅ no suffix
          message_en: 'Welcome to KhmerAi.Chat!',
          message_kh: 'សូមស្វាគមន៍មកកាន់ KhmerAi.Chat!',
          tone: 'friendly',
          emoji_style: 'minimal',
          delay_seconds: 0,
          show_typing: true,
          canvas: {
            layout: 'vertical',
            paths: []
          },
          paths: []
        };

  return {
    ...createNodeData(type, enrichedData),
    id: nodeId,
    ...overrides
  } as Node;
}



export function createNodeWithData<T>(type: BuilderNode, data: T, overrides: Partial<Node> = {}) {
  return {
    ...createNodeData(type, data),
    ...overrides,
  } as Node
}

export function isFeatureBlockNode(node: Node): boolean {
  return node.type === BuilderNode.FEATURE_BLOCK
}

export function isConversationAgentNode(node: Node): node is Node<ConversationAgentNodeData> {
  return node.type === BuilderNode.CONVERSATION_AGENT
}

export function isTextMessageNode(node: Node): node is Node<TextMessageNodeData> {
  return node.type === BuilderNode.TEXT_MESSAGE
}

export function isGenericTemplateNode(node: Node): node is Node<GenericTemplateNodeData> {
  return node.type === BuilderNode.GENERIC_TEMPLATE
}

export function isButtonTemplateNode(node: Node): node is Node<ButtonTemplateNodeData> {
  return node.type === BuilderNode.BUTTON_TEMPLATE
}

export function isMediaTemplateNode(node: Node): node is Node<MediaTemplateNodeData> {
  return node.type === BuilderNode.MEDIA_TEMPLATE
}

export function isQuickRepliesNode(node: Node): node is Node<QuickRepliesNodeData> {
  return node.type === BuilderNode.QUICK_REPLIES
}

export function isEndNode(node: Node): node is Node<EndNodeData> {
  return node.type === BuilderNode.END
}


