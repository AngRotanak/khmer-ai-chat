import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import { db } from "~/lib/firebase"

interface UnreadCounts {
  messages: number
  comments: number
  posts: number
}

export function useUnreadCounts(pageId: string): UnreadCounts {
  const [counts, setCounts] = useState<UnreadCounts>({
    messages: 0,
    comments: 0,
    posts: 0,
  })

  useEffect(() => {
    if (!pageId) return

    const countsRef = ref(db, `pages/${pageId}/unreadCounts`)

    const unsubscribe = onValue(countsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Partial<UnreadCounts>
        setCounts({
          messages: data.messages ?? 0,
          comments: data.comments ?? 0,
          posts: data.posts ?? 0,
        })
      } else {
        setCounts({ messages: 0, comments: 0, posts: 0 })
      }
    })

    return () => unsubscribe()
  }, [pageId])

  return counts
}
