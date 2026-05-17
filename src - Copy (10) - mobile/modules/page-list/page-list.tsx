import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue } from 'firebase/database'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '~/stores/auth-store'

type PageMeta = {
  name: string
  createdAt: number
}

export function PageList() {
  const [pages, setPages] = useState<Record<string, PageMeta>>({})
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.id) return

    const db = getDatabase()
    const refPath = ref(db, `khmer-ai-chat/admins/${user.id}/pages`)
    const unsubscribe = onValue(refPath, (snapshot) => {
      const data = snapshot.val() || {}
      setPages(data)
    })

    return () => unsubscribe()
  }, [user?.id])

  if (!user) {
    return <p className="text-sm text-light-400">កំពុងផ្ទុកព័ត៌មានអ្នកប្រើ...</p>
  }

  if (!user.id) {
    return <p className="text-sm text-red-400">⚠️ មិនអាចទាញ ID អ្នកប្រើបានទេ។</p>
  }

  if (!Object.keys(pages).length) {
    return <p className="text-sm text-light-400">មិនមានទំព័រដែលបានភ្ជាប់ទេ។</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(pages).map(([pageId, config]) => (
        <button
          key={pageId}
          onClick={() => navigate({ to: `/dashboard/pages/${pageId}` })}
          className="text-left p-4 rounded bg-dark-800 border border-dark-600 hover:bg-dark-700 transition"
        >
          <div className="text-lg font-semibold text-light-100">{config.name || 'Unnamed Page'}</div>
          <div className="text-xs text-light-400">Page ID: {pageId}</div>
        </button>
      ))}
    </div>
  )
}
