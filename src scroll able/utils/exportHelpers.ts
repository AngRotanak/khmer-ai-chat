
import type { Node} from '@xyflow/react'
import { isTextMessageNode } from '~/modules/nodes/utils'

import type { ExportedTemplate, ExportedOption, ExportedCard } from '~/modules/nodes/types'
import type { Option } from '~/modules/nodes/types'


// 🔧 Export a text-message node by ID
export function exportTextBlockById(id: string, nodes: Node[]): any {
  const node = nodes.find(n => n.id === id && isTextMessageNode(n))
  if (!node) return null

  const khText =
    typeof node.data.message_kh === 'string'
      ? node.data.message_kh.trim()
      : typeof node.data.message === 'string'
      ? node.data.message.trim()
      : ''

  const enText =
    typeof node.data.message_en === 'string'
      ? node.data.message_en.trim()
      : typeof node.data.message === 'string'
      ? node.data.message.trim()
      : ''

  return {
    kh: [
      {
        template_type: 'text',
        is_active: !!khText,
        text: khText || '⚠️ មិនមានមាតិកាភាសាខ្មែរ',
      },
    ],
    en: [
      {
        template_type: 'text',
        is_active: !!enText,
        text: enText || '⚠️ No English content available',
      },
    ],
    metadata: {
      blockType: 'text',
      name: id,
      config: {},
      linked_pages: ['708759082319392'],
      created_by: 'admin001',
      last_updated: new Date().toISOString(),
      is_active: true,
    },
    linked_blocks: [],
  }
}


export function extractGenericTemplate(
  node: Node,
  allNodes: Node[]
): { kh: ExportedTemplate; en: ExportedTemplate } | null {
  const cards = node.data?.cards
  if (!Array.isArray(cards) || cards.length === 0) return null

  const khCards: ExportedCard[] = cards.map(card => {
    const khOptions: ExportedOption[] = Array.isArray(card.options)
      ? card.options.map((opt: Option): ExportedOption => {
          const type = ['postback', 'web_url', 'phone_number'].includes(opt.type)
            ? (opt.type as 'postback' | 'web_url' | 'phone_number')
            : 'postback'

          const option: ExportedOption = {
            type,
            payload: opt.payload || ''
          }

          if (typeof opt.label_kh === 'string') {
            option.label_kh = opt.label_kh
          }

          if (type === 'web_url' && typeof opt.url === 'string') {
            option.url = opt.url
          }

          // ✅ Handle linked text-message fallback
          const targetNode = allNodes.find(n => n.id === opt.payload)
          if (targetNode?.type === 'text-message') {
            const message = typeof targetNode.data?.message === 'string' ? targetNode.data.message.trim() : ''
            if (message) {
             return {
                type: 'text',
                text: message,
                label_kh: opt.label_kh || '',
                label_en: opt.label_en || ''
              }

            }
          }

          return option
        })
      : []

    return {
      title: card.title_km || '',
      subtitle: card.subtitle_km || '',
      layout: card.layout || 'hero',
      image_url: card.image_url || '',
      options: khOptions
    }
  })

  const enCards: ExportedCard[] = cards.map(card => {
    const enOptions: ExportedOption[] = Array.isArray(card.options)
      ? card.options.map((opt: Option): ExportedOption => {
          const type = ['postback', 'web_url', 'phone_number'].includes(opt.type)
            ? (opt.type as 'postback' | 'web_url' | 'phone_number')
            : 'postback'

          const option: ExportedOption = {
            type,
            payload: opt.payload || ''
          }

          if (typeof opt.label_en === 'string') {
            option.label_en = opt.label_en
          }

          if (type === 'web_url' && typeof opt.url === 'string') {
            option.url = opt.url
          }

          // ✅ Handle linked text-message fallback
          const targetNode = allNodes.find(n => n.id === opt.payload)
          if (targetNode?.type === 'text-message') {
            const message = typeof targetNode.data?.message === 'string' ? targetNode.data.message.trim() : ''
            if (message) {
             return {
                type: 'text',
                text: message,
                label_kh: opt.label_kh || '',
                label_en: opt.label_en || ''
              }

            }
          }

          return option
        })
      : []

    return {
      title: card.title || '',
      subtitle: card.subtitle || '',
      layout: card.layout || 'hero',
      image_url: card.image_url || '',
      options: enOptions
    }
  })

  return {
    kh: {
      template_type: 'generic',
      silent: false,
      is_active: true,
      cards: khCards
    },
    en: {
      template_type: 'generic',
      silent: false,
      is_active: true,
      cards: enCards
    }
  }
}
