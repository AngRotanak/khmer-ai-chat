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

        if (opt.type === 'postback' && !opt.payload?.trim()) {
          errors.push(`${optLabel}: Missing payload`)
        }
      })
    })
  }

  if (node.type === 'text-message') {
    const { message_en, message_kh } = node.config
    if (!message_en?.trim() && !message_kh?.trim()) {
      errors.push(`${label}: Missing message content`)
    }
  }

  if (node.type === 'generic-template' || node.type === 'carousel') {
    validateCards(node.config.cards, node.type)
  }

  return { label, type: node.type, errors, warnings }
}
