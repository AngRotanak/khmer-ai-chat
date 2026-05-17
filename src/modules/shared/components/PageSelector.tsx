import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '~/lib/firebase'
import { useAuthStore } from '~/stores/auth-store'
import { useFlowSession } from '~/stores/flow-session'
import { getPageToken } from "~/lib/tokenManager"

interface Page {
  id: string
  name: string
}

export function PageSelector() {
  const { currentPageId, setCurrentPageId, setPageToken } = useFlowSession()
  const { user } = useAuthStore()
  const [pages, setPages] = useState<Page[]>([])

  // ✅ Load available pages from Firebase
  useEffect(() => {
    if (!user?.id) return
    const pagesRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages`)
    return onValue(pagesRef, snapshot => {
      const data = snapshot.val()
      if (data) {
        const loaded = Object.entries(data).map(([id, value]) => ({
          id,
          name: (value as any).name,
        }))
        setPages(loaded)
      }
    })
  }, [user?.id])

  // ✅ Load page_access_token when currentPageId changes
useEffect(() => {
  if (!currentPageId) {
    setPageToken("")
    console.log(`⚠️ No currentPageId, cannot load page_access_token`)
    return
  }
  const tokenRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/meta/page_access_token`)
  const unsubscribe = onValue(tokenRef, snapshot => {
    const token = snapshot.val() || ""
    setPageToken(token)
    if (token) {
      console.log(`🔑 Loaded page_access_token for ${currentPageId}:`, token)
    } else {
      console.warn(`⚠️ No page_access_token found for ${currentPageId}`)
    }
  })

  return () => unsubscribe()
}, [currentPageId, setPageToken])

const handleSelectPage = async (pageId: string) => {
  setCurrentPageId(pageId)
  console.log(`✅ Agent Dashboard switched to page: ${pageId}`)

  try {
    const token = await getPageToken(pageId)
    setPageToken(token)
    console.log(`🔑 Loaded page_access_token for ${pageId}:`, token)
  } catch (err) {
    console.error(`❌ Failed to load page_access_token for ${pageId}:`, err)
    setPageToken("")
  }
}
  return (
    <div className="mb-3">
      <select
        value={currentPageId ?? ''}
        onChange={e => handleSelectPage(e.target.value)}
        className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400 text-center"
      >
        <option value="">-- Select a Page --</option>
        {pages.map(page => (
          <option key={page.id} value={page.id}>
            {page.name}
          </option>
        ))}
      </select>
    </div>
  )
}
