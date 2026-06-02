import { nanoid } from 'nanoid'
import type { BuilderNodeType } from '~/modules/nodes/types'
import type { XYPosition } from '@xyflow/react'

export function createNodeWithDefaultData(
  type: BuilderNodeType,
  options: { position: XYPosition; selected?: boolean }
) {
  const { position, selected = false } = options

  if (type === 'text-message') {
    return {
      id: nanoid(),
      type,
      position,
      selected,
      data: {
        is_active: true,
        channel: 'sms',
        message_en: '',
        message_kh: 'សូមស្វាគមន៍!',
        delay_seconds: 0,
        show_typing: true,
        tone: 'neutral',
        emoji_style: 'minimal',
        priority: 'normal',
        trigger_condition: '',
        created_by: 'admin001',
        last_updated: new Date().toISOString(),
      },
    }
  }

  // ✅ Special case: conversation-agent
  if (type === 'conversation-agent') {
    return {
      id: nanoid(),
      type,
      position,
      selected,
      data: {
        topic: '',
        trigger_keywords: [],
        trigger_intents: [],
        welcome_message: 'សួស្តី! 👋 សូមប្រាប់ខ្ញុំអំពីបំណងរបស់អ្នក។',
        fallback_message: 'សុំអភ័យទោស ខ្ញុំមិនយល់អំពីសំណួរនោះទេ។',
        context_lock: true,
        sub_intents: [],
        metadata: {
          createdBy: 'admin',
          lastUpdated: new Date().toISOString(),
        },
      },
    }
  }



  // ✅ Special case: smart-welcome
  if (type === 'smart-welcome') {
    return {
      id: nanoid(),
      type,
      position,
      selected,
      data: {
        language: 'km',
        afterInactivityHours: 24,
        introNode: null,
        metadata: {
          createdBy: 'admin',
          lastUpdated: new Date().toISOString(),
        },
      },
    }
  }

  // ✅ Special case: quick-menu
  if (type === 'menu') {
    return {
      id: nanoid(),
      type: 'quick-menu-node',
      position,
      selected,
      data: {
        buttons: [
          { title: '🏠 Home', targetNodeId: null },
          { title: '📦 Products', targetNodeId: null },
          { title: '🎁 Promo', targetNodeId: null },
        ],
        language: 'km',
        metadata: {
          createdBy: 'admin',
          lastUpdated: new Date().toISOString(),
        },
      },
    }
  }

  // ✅ Special case: carousel
  if (type === 'generic-template' || type === 'carousel') {
    return {
      id: nanoid(),
      type: 'generic-template',
      position,
      selected,
      data: {
        name: `carousel_${nanoid().slice(0, 6)}`,
        blockType: 'carousel',
        is_active: true,
        cards: [
          {
            title: 'tres',
            subtitle: 'tes',
            layout: 'hero',
            image_url: '',
            options: [
              {
                id: nanoid(),
                label_en: 'teste',
                label_kh: 'test',
                payload: '',
                type: 'postback',
              },
            ],
          },
        ],
        metadata: {
          createdBy: 'admin',
          lastUpdated: new Date().toISOString(),
        },
      },
    }
  }

  // ✅ Feature-block types with Messenger-safe defaults
  const featureBlockTypes = [
    'info',
    'product',
    'intent',
    'smart-welcome',
    'quick-menu',
    'carousel'
  ]

if (featureBlockTypes.includes(type)) {
  const nodeId = nanoid();

  return {
    id: nodeId,
    type,
    position,
    selected,
    data: {
      name: `${type}_${nodeId.slice(0, 6)}`,
      blockType: type,
      is_active: true,
      config: {},
      paths: [
        {
          id: nanoid(),
          label: 'Path 1',
          blockType: 'text-message',
          targetBlockId: null,
          template_id: nodeId, // ✅ match node.id
          trigger: 'immediate',
          detection_mode: 'keyword',
          expected_intent: '',
          intent_confidence: 0.85,
          condition: { match: 'includes', value: '' },
        },
      ],
      templates: {
        [`${nodeId}_en`]: {
          template_id: `${nodeId}_en`,
          lang: 'en',
          template_type: 'text',
          text: 'Hello! 👋 Welcome to KhmerAi.Chat.',
          is_active: true,
          show_typing: true,
          tone: 'neutral',
          delay_seconds: 0,
          emoji_style: 'minimal',
        },
        [`${nodeId}_kh`]: {
          template_id: `${nodeId}_kh`,
          lang: 'kh',
          template_type: 'text',
          text: 'សួស្តី! 👋 សូមស្វាគមន៍មកកាន់បុតខ្មែរ។',
          is_active: true,
          show_typing: true,
          tone: 'neutral',
          delay_seconds: 0,
          emoji_style: 'minimal',
        },
      },
      metadata: {
        createdBy: 'admin',
        lastUpdated: new Date().toISOString(),
      },
    },
  };
}


  // ✅ Fallback for unsupported types
  return {
    id: nanoid(),
    type,
    position,
    selected,
    data: {},
  }

}
