import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '~/lib/firebase'
import { useAuthStore } from '~/stores/auth-store'
import { useFlowSession } from '~/stores/flow-session'

interface Page {
  id: string
  name: string
}

export function PageSelector() {
  const { currentPageId, setCurrentPageId } = useFlowSession()
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

const handleSelectPage = (pageId: string) => {
  if (!pageId) {
    setCurrentPageId('')
    return
  }
  setCurrentPageId(pageId)
  console.log(`✅ Agent Dashboard switched to page: ${pageId}`)
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
