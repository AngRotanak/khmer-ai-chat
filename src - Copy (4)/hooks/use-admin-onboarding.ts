import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { useAuthStore } from '~/stores/auth-store'

export function useAdminOnboarding() {
  const { user } = useAuthStore()
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const db = getDatabase()
    const onboardRef = ref(db, `khmer-ai-chat/admins/${user.id}/onboarded`)
    const unsub = onValue(onboardRef, (snap) => {
      setShowIntro(!snap.val())
    })
    return () => unsub()
  }, [user?.id])

  const markComplete = async () => {
    const db = getDatabase()
    const onboardRef = ref(db, `khmer-ai-chat/admins/${user?.id}/onboarded`)
    await set(onboardRef, true)
    setShowIntro(false)
  }

  return { showIntro, markComplete }
}
