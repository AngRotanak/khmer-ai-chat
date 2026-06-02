export function simulateMessengerDelivery(exportPayload: Record<string, any>) {
  const delivered = new Set<string>()
  const missingKh: string[] = []
  const missingEn: string[] = []
  const fallbackBlocks: string[] = []

  const traversePaths = (nodeId: string, depth = 0) => {
    const indent = '   '.repeat(depth + 1)
    const block = exportPayload[nodeId]
    if (!block || delivered.has(nodeId)) return

    const flow = block.flow_data
    const kh = flow.kh?.[0]?.text || ''
    const en = flow.en?.[0]?.text || ''
    const trigger = flow.metadata?.trigger || nodeId

    console.log(`🧭 Traversing block "${nodeId}"`)
    console.log(`${indent}➤ Trigger: "${trigger}"`)
    console.log(`${indent}➤ Khmer: ${kh ? '✅' : '❌ Missing'}`)
    console.log(`${indent}➤ English: ${en ? '✅' : '❌ Missing'}`)

    if (!kh) {
      console.warn(`${indent}⚠️ Block "${nodeId}" missing Khmer content — fallback warning will be shown`)
      missingKh.push(nodeId)
    }
    if (!en) {
      console.warn(`${indent}⚠️ Block "${nodeId}" missing English content — fallback warning will be shown`)
      missingEn.push(nodeId)
    }

    if (nodeId === 'fallback_menu') {
      fallbackBlocks.push(nodeId)
    }

    delivered.add(nodeId)

    // Postback options
    const options = flow.kh?.[0]?.options || []
    for (const opt of options) {
      const target = opt.payload
      if (typeof target === 'string' && !delivered.has(target)) {
        console.log(`${indent}➤ Button: "${opt.label}" → payload: "${target}"`)
        if (exportPayload[target]) {
          traversePaths(target, depth + 1)
        } else {
          console.warn(`${indent}❌ Payload "${target}" not found in export`)
        }
      }
    }

    // .paths traversal
    const canvasNodes = block.canvas?.nodes || []
    for (const node of canvasNodes) {
      const paths = node.data?.paths || []
      for (const path of paths) {
        const targetId = path.targetBlockId || path.id
        if (typeof targetId === 'string' && !delivered.has(targetId)) {
          console.log(`${indent}➤ Path: "${path.label}" → target: "${targetId}"`)
          if (exportPayload[targetId]) {
            traversePaths(targetId, depth + 1)
          } else {
            console.warn(`${indent}❌ Path target "${targetId}" not found in export`)
          }
        }
      }
    }
  }

  // Start traversal from all top-level blocks
  for (const key of Object.keys(exportPayload)) {
    traversePaths(key)
  }

  // ✅ Summary
  console.log('\n📊 Messenger Preview Summary:')
  console.log(`   ✅ Total blocks delivered: ${delivered.size}`)
  console.log(`   ⚠️ Blocks missing Khmer: ${missingKh.length}`)
  console.log(`   ⚠️ Blocks missing English: ${missingEn.length}`)
  console.log(`   🛠️ Fallback blocks generated: ${fallbackBlocks.length}`)
}
