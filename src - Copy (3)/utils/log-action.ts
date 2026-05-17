import { getDatabase, ref, set } from 'firebase/database'
import { useAuthStore } from '~/stores/auth-store'

export async function logAction(pageId: string, action: string, data: Record<string, any>) {
  const { user } = useAuthStore.getState()
  const db = getDatabase()
  const timestamp = Date.now()
  const logRef = ref(db, `khmer-ai-chat/pages/${pageId}/logs/${timestamp}`)
  await set(logRef, {
    ...data,
    action,
    userId: user?.id ?? 'unknown',
    time: timestamp,
  })
}
