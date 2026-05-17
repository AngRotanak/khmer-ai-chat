import { db } from '~/lib/firebase'
import { ref, set } from 'firebase/database'
import type { Node, Edge } from '@xyflow/react'

export const saveCanvasSnapshot = async ({
  userId,
  nodes,
  edges,
  label,
}: {
  userId: string
  nodes: Node[]
  edges: Edge[]
  label?: string
}) => {
  if (!userId) return

  const snapshotId = `snapshot_${Date.now()}`
  const payload = {
    nodes,
    edges,
    label: label ?? 'Untitled',
    updatedAt: Date.now(),
  }
  

  const snapshotRef = ref(db, `khmer-ai-chat/admins/${userId}/snapshots/${snapshotId}`)
  try {
    await set(snapshotRef, payload)
    console.log('📸 Snapshot saved:', snapshotId)
    return snapshotId
  } catch (err) {
    console.error('❌ Snapshot save failed:', err)
  }
}
