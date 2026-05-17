import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import { db } from "~/lib/firebase"

export function useUnreadCountsByConversation(pageId: string): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!pageId) return

    // 🔹 Firebase path should store unread counts keyed by conversation ID
    const countsRef = ref(db, `pages/${pageId}/conversationsUnread`)

    const unsubscribe = onValue(countsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, number | { unread: number }>
        // Normalize: handle both plain numbers and objects with { unread }
        const normalized = Object.fromEntries(
          Object.entries(data).map(([id, val]) => [
            id,
            typeof val === "number" ? val : val.unread ?? 0,
          ])
        )
        setCounts(normalized)
      } else {
        setCounts({})
      }
    })

    return () => unsubscribe()
  }, [pageId])

  return counts
}
