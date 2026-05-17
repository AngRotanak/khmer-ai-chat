import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue } from 'firebase/database'
import { useAuthStore } from '~/stores/auth-store'

export function usePageRole(pageId: string) {
  const { user } = useAuthStore()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    const db = getDatabase()
    const roleRef = ref(db, `khmer-ai-chat/pages/${pageId}/roles/${user.id}`)
    const unsub = onValue(roleRef, (snap) => {
      setRole(snap.val() || null)
    })
    return () => unsub()
  }, [pageId, user?.id])

  return role
}
