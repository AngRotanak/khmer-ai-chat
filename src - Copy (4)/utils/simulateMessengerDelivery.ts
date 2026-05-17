import { validateTemplates } from './exportFlow'

export function simulateMessengerDelivery(blocksByType: Record<string, Record<string, any>>) {
  const delivered = new Set<string>()
  const missingKh: string[] = []
  const missingEn: string[] = []

  const traverseBlock = (blockId: string, block: any, depth = 0) => {
    const indent = '   '.repeat(depth + 1)
    if (!block || delivered.has(blockId)) return

    const templates = typeof block.templates === 'object' && block.templates !== null
      ? block.templates
      : {}

    // ✅ Log template issues
    validateTemplates(blockId, templates)

    let kh = ''
    let en = ''

    const usedTemplateIds = new Set<string>()
    const canvasPaths = Array.isArray(block.canvas?.paths) ? block.canvas.paths : []

    for (const path of canvasPaths) {
      const tid = path.template_id
      if (typeof tid === 'string') {
        usedTemplateIds.add(`${tid}_kh`)
        usedTemplateIds.add(`${tid}_en`)
      }
    }


    for (const templateId of usedTemplateIds) {
      const template = templates[templateId]

      if (
        !template ||
        typeof template !== 'object' ||
        typeof template.lang !== 'string' ||
        typeof template.template_type !== 'string'
      ) {
        console.warn(`${indent}❌ Skipping malformed or missing template "${templateId}"`, template)
        continue
      }

      const lang = template.lang
      const type = template.template_type
      let content = ''

      if (type === 'text' && typeof template.text === 'string') {
        content = template.text.trim()
      }

      if ((type === 'generic' || type === 'carousel') && Array.isArray(template.cards)) {
        for (const card of template.cards) {
          const title = typeof card.title_km === 'string' ? card.title_km :
            typeof card.title === 'string' ? card.title : ''
          const subtitle = typeof card.subtitle_km === 'string' ? card.subtitle_km :
            typeof card.subtitle === 'string' ? card.subtitle : ''

          let optionLabels = ''
          if (Array.isArray(card.options)) {
            for (const opt of card.options) {
              if (
                opt &&
                typeof opt === 'object' &&
                (typeof opt.label_kh === 'string' || typeof opt.label === 'string')
              ) {
                optionLabels += ` ${typeof opt.label_kh === 'string' ? opt.label_kh : opt.label
                  }`
              }
            }
            optionLabels = optionLabels.trim()
          } else {
            console.warn(`${indent}❌ card.options is not a valid array`, card.options)
            continue
          }

          const cardText = `${title} ${subtitle} ${optionLabels}`.trim()
          if (cardText) content += (content ? ' | ' : '') + cardText
        }
      }

      if (lang === 'kh' && content && !kh) kh = content
      if (lang === 'en' && content && !en) en = content

      console.log(`${indent}🧩 Template "${templateId}" → type: ${type}, lang: ${lang}, content: ${content ? '✅' : '❌ Missing'}`)
    }

    const trigger = block.entry_trigger || blockId

    console.log(`🧭 Traversing block "${blockId}"`)
    console.log(`${indent}➤ Trigger: "${trigger}"`)
    console.log(`${indent}➤ Khmer: ${kh ? '✅' : '❌ Missing'}`)
    console.log(`${indent}➤ English: ${en ? '✅' : '❌ Missing'}`)

    if (!kh) missingKh.push(blockId)
    if (!en) missingEn.push(blockId)

    delivered.add(blockId)

    // ✅ Traverse delivery paths
    for (const path of canvasPaths) {
      const targetId = path.targetBlockId || path.id
      const label = typeof path.label === 'string' ? path.label : '(unnamed path)'
      for (const type of Object.keys(blocksByType)) {
        const targetBlock = blocksByType[type]?.[targetId]
        if (targetBlock && !delivered.has(targetId)) {
          console.log(`${indent}➤ Path: "${label}" → target: "${targetId}"`)
          traverseBlock(targetId, targetBlock, depth + 1)
        }
      }
    }
  }

  for (const type of Object.keys(blocksByType)) {
    for (const blockId of Object.keys(blocksByType[type])) {
      traverseBlock(blockId, blocksByType[type][blockId])
    }
  }

  console.log('\n📊 Messenger Preview Summary:')
  console.log(`   ✅ Total blocks delivered: ${delivered.size}`)
  console.log(`   ⚠️ Blocks missing Khmer: ${missingKh.length}`)
  console.log(`   ⚠️ Blocks missing English: ${missingEn.length}`)
  if (missingKh.length > 0) console.log(`   🟥 Missing Khmer:`, missingKh)
  if (missingEn.length > 0) console.log(`   🟦 Missing English:`, missingEn)
}
