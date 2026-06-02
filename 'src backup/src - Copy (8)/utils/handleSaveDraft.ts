import { sanitizeNodes, sanitizeEdges, sanitize } from '~/modules/flow-builder/constants/default-nodes-edges'
import { buildFlowExport } from '~/utils/exportFlow'
import { db } from '~/lib/firebase'
import { ref, update } from 'firebase/database'
import type { Node, Edge } from '@xyflow/react'

export const handleSaveDraft = async ({
  userId,
  currentPageId,
  nodes,
  edges,
}: {
  userId: string
  currentPageId: string
  nodes: Node[]
  edges: Edge[]
}): Promise<string | undefined> => {
  if (!userId || !currentPageId) return

  const syncedNodes = sanitizeNodes(nodes)
  const syncedEdges = sanitizeEdges(edges)

  if (syncedNodes.length === 0 || syncedEdges.length === 0) {
    alert('⚠️ No flow to save. Please build your flow first.')
    return
  }

  const rawExport = buildFlowExport(syncedNodes, syncedEdges, 'full')

  if (!rawExport || typeof rawExport !== 'object') {
    console.error('❌ buildFlowExport returned invalid structure:', rawExport)
    alert('❌ Failed to generate export. Please check your flow.')
    return
  }

  const exportKeys = Object.keys(rawExport)
  const firstKey = exportKeys[0]
  const rawBlock = rawExport[firstKey]

  if (!rawBlock || typeof rawBlock !== 'object') {
    console.error('❌ Draft block is missing or invalid:', rawBlock)
    alert('❌ Draft block is empty or malformed. Cannot save.')
    return
  }

  const sanitizedExport = sanitize({ [firstKey]: rawBlock })

  console.log('📦 Final sanitized block:', JSON.stringify(sanitizedExport[firstKey], null, 2))

  const flowRef = ref(db, `khmer-ai-chat/admins/${userId}/pages/${currentPageId}/flow`)
  try {
    await update(flowRef, { [firstKey]: sanitizedExport[firstKey] })
    alert(`✅ Draft saved as "${firstKey}". You can rename or publish it later.`)
    return firstKey
  } catch (err) {
    console.error('❌ Failed to save draft:', err)
    alert('❌ Draft save failed. Please try again.')
  }
}
