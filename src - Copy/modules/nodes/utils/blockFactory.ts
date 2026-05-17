import { nanoid } from 'nanoid'
import type { BotBlock, BotBlockType } from '~/modules/nodes/types'

export function createNewBlock(type: BotBlockType): BotBlock {
  return {
    id: nanoid(),
    type,
    content: {
      kh: { type: 'text', message_kh: '', image_url: '', buttons: [] },
      en: { type: 'text', message_en: '', image_url: '', buttons: [] }
    },
    config: {},
    metadata: {
      createdBy: 'admin',
      lastUpdated: new Date().toISOString()
    },
    data: type === 'smart-welcome'
      ? {
          buttons: [
            {
              id: nanoid(),
              label: '🛒 View Products',
              blockType: 'product',
              targetBlockId: null
            }
          ]
        }
      : {}
  }
}
