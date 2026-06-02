import { db } from '~/lib/firebase'
import { ref, get } from 'firebase/database'

export const loadCanvasAutosave = async (userId: string) => {
  if (!userId) return null

  const autosaveRef = ref(db, `khmer-ai-chat/admins/${userId}/autosave`)
  try {
    const snapshot = await get(autosaveRef)
    if (!snapshot.exists()) return null

    const data = snapshot.val()
    console.log('🔁 Restoring autosave:', data)

    return {
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
      edges: Array.isArray(data.edges) ? data.edges : [],
      updatedAt: data.updatedAt ?? Date.now(),
    }
  } catch (err) {
    console.error('❌ Failed to load autosave:', err)
    return null
  }
}
