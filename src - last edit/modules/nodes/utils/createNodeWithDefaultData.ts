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
  if (type === 'quick-menu') {
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
    return {
      id: nanoid(),
      type,
      position,
      selected,
      data: {
        name: `${type}_${nanoid().slice(0, 6)}`,
        blockType: type,
        is_active: true,
        kh: [
          {
            template_type: 'text',
            is_active: true,
            text: 'សួស្តី! 👋 សូមស្វាគមន៍មកកាន់បុតខ្មែរ។'
          }
        ],
        en: [
          {
            template_type: 'text',
            is_active: true,
            text: 'Hello! 👋 Welcome to KhmerAi.Chat.'
          }
        ],
        config: {},
        paths: [
          {
            id: nanoid(),
            label: 'Path 1',
            blockType: 'text-message',
            targetBlockId: null
          }
        ],
        metadata: {
          createdBy: 'admin',
          lastUpdated: new Date().toISOString(),
        },
      }
    }
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
