import { isMessengerSafePayload } from '~/utils/messenger'

export function validateNodeExport(node: {
  id: string
  name?: string
  type: string
  config: Record<string, any>
}) {
  const errors: string[] = []
  const warnings: string[] = []

  const label = node.name?.trim() || node.id

  const validateCards = (cards: any[], typeLabel: string) => {
    if (!cards || cards.length === 0) {
      errors.push(`${label}: No cards in ${typeLabel}`)
      return
    }

    cards.forEach((card: any, index: number) => {
      const cardLabel = `${label} → Card ${index + 1}`

      if (!card.title?.trim() && !card.title_km?.trim()) {
        warnings.push(`${cardLabel}: Missing title`)
      }

      if (!card.subtitle?.trim() && !card.subtitle_km?.trim()) {
        warnings.push(`${cardLabel}: Missing subtitle`)
      }

      card.options?.forEach((opt: any, optIndex: number) => {
        const optLabel = `${cardLabel} → Option ${optIndex + 1}`

        if (!opt.label_en?.trim() && !opt.label_kh?.trim()) {
          warnings.push(`${optLabel}: Missing label`)
        }

        if (!opt.type || !['postback', 'web_url', 'phone_number'].includes(opt.type)) {
          errors.push(`${optLabel}: Invalid or missing type`)
        }

        if (opt.type === 'postback') {
          const payload = opt.payload?.trim()
          if (!payload) {
            errors.push(`${optLabel}: Missing payload`)
          } else if (!isMessengerSafePayload(payload)) {
            warnings.push(`${optLabel}: Payload may not be Messenger-safe`)
          }
        }
      })
    })
  }

  if (node.type === 'text') {
    const { message_en, message_kh } = node.config
    if (!message_en && !message_kh) {
      errors.push(`${label}: Missing message content`)
    }
    if (message_en && !isMessengerSafePayload(message_en)) {
      warnings.push(`${label}: English message may not be Messenger-safe`)
    }
    if (message_kh && !isMessengerSafePayload(message_kh)) {
      warnings.push(`${label}: Khmer message may not be Messenger-safe`)
    }
  }

  if (node.type === 'generic-template') {
    validateCards(node.config.cards, 'generic-template')
  }

  if (node.type === 'carousel') {
    validateCards(node.config.cards, 'carousel')
  }

  if (node.type === 'quick-menu') {
    const { options } = node.config
    if (!Array.isArray(options) || options.length === 0) {
      errors.push(`${label}: No options in quick-menu`)
    }

    options?.forEach((opt: any, index: number) => {
      const optLabel = `${label} → Option ${index + 1}`

      if (!opt.label_en?.trim() && !opt.label_kh?.trim()) {
        warnings.push(`${optLabel}: Missing label`)
      }

      if (!opt.type || !['postback', 'web_url', 'phone_number'].includes(opt.type)) {
        errors.push(`${optLabel}: Invalid or missing type`)
      }

      if (opt.type === 'postback') {
        const payload = opt.payload?.trim()
        if (!payload) {
          errors.push(`${optLabel}: Missing payload`)
        } else if (!isMessengerSafePayload(payload)) {
          warnings.push(`${optLabel}: Payload may not be Messenger-safe`)
        }
      }
    })
  }

  if (node.type === 'intent') {
    const { intent_name } = node.config
    if (!intent_name?.trim()) {
      errors.push(`${label}: Missing intent name`)
    }
  }

  if (node.type === 'start') {
    const { trigger } = node.config
    if (!trigger?.trim()) {
      errors.push(`${label}: Missing trigger`)
    } else if (!isMessengerSafePayload(trigger)) {
      warnings.push(`${label}: Trigger may not be Messenger-safe`)
    }
  }

  return { label, type: node.type, errors, warnings }
}
