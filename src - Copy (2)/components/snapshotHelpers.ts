import { db } from '~/lib/firebase'
import { ref, get, remove } from 'firebase/database'

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


export const deleteSnapshot = async (userId: string, snapshotId: string) => {
  const refToDelete = ref(db, `khmer-ai-chat/admins/${userId}/snapshots/${snapshotId}`)
  await remove(refToDelete)
}
