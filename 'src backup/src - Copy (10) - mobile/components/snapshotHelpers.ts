import { db } from '~/lib/firebase'
import { ref, get, remove, set } from 'firebase/database'
import type { Node, Edge } from '@xyflow/react'

/**
 * Recursively strip out any `undefined` values from objects/arrays.
 * Firebase Realtime Database does not allow `undefined` values.
 */
function stripUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined)
  } else if (obj && typeof obj === 'object') {
    const clean: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = stripUndefined(value)
      }
    }
    return clean
  }
  return obj
}

// ✅ Load all snapshots for a user
export const getSnapshots = async (userId: string) => {
  const snapshotRef = ref(db, `khmer-ai-chat/admins/${userId}/snapshots`)
  const snap = await get(snapshotRef)
  if (!snap.exists()) return []

  const data = snap.val()
  return Object.entries(data).map(([id, value]) => {
    if (typeof value === 'object' && value !== null) {
      return { id, ...value }
    } else {
      console.warn(`⚠️ Skipping malformed snapshot: ${id}`, value)
      return null
    }
  }).filter(Boolean)
}

// ✅ Delete a snapshot
export const deleteSnapshot = async (userId: string, snapshotId: string) => {
  const refToDelete = ref(db, `khmer-ai-chat/admins/${userId}/snapshots/${snapshotId}`)
  await remove(refToDelete)
}

// ✅ Save a new snapshot
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

  // Build payload and sanitize it
  const payload = stripUndefined({
    nodes,
    edges,
    label: label ?? 'Untitled',
    updatedAt: Date.now(),
  })

  const snapshotRef = ref(db, `khmer-ai-chat/admins/${userId}/snapshots/${snapshotId}`)
  try {
    await set(snapshotRef, payload)
    console.log('📸 Snapshot saved:', snapshotId)
    return snapshotId
  } catch (err) {
    console.error('❌ Snapshot save failed:', err)
  }
}
