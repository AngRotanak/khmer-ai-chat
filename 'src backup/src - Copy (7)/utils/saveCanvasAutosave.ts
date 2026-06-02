import { db } from '~/lib/firebase'
import { ref, set } from 'firebase/database'
import type { Node, Edge } from '@xyflow/react'
import { sanitizeCanvas } from './sanitizeCanvas'

export const saveCanvasAutosave = async ({
  userId,
  nodes,
  edges,
}: {
  userId: string
  nodes: Node[]
  edges: Edge[]
}) => {
  if (!userId) {
    console.warn('⚠️ Autosave skipped: missing userId')
    return
  }

  // if (nodes.length === 0) {
  //   console.warn('⚠️ Autosave skipped: no nodes to save')
  //   return
  // }


  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    console.warn('⚠️ Skipping autosave: nodes or edges are not arrays')
    return
  }

  const payload = sanitizeCanvas({
    nodes,
    edges,
    updatedAt: Date.now(),
  })

  if (!Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
    console.warn('⚠️ Sanitized payload missing nodes or edges — skipping save')
    return
  }

  console.log('🧼 Sanitized autosave payload:', JSON.stringify(payload, null, 2))

  const autosaveRef = ref(db, `khmer-ai-chat/admins/${userId}/autosave`)
  try {
    await set(autosaveRef, payload)
    console.log('💾 Autosave complete:', payload)
  } catch (err) {
    console.error('❌ Autosave failed:', err)
  }
}
