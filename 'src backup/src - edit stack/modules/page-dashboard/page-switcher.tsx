import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue } from 'firebase/database'
import { useRouter } from 'next/router'

type Props = {
  uid: string | undefined
}

export function PageSwitcher({ uid }: Props) {
  const [pages, setPages] = useState<Record<string, string>>({})
  const router = useRouter()

  // ✅ Defensive check for missing UID
  if (!uid) {
    return <p className="text-light-400 p-4">⚠️ មិនអាចទាញ UID អ្នកប្រើបានទេ។</p>
  }

  useEffect(() => {
    const db = getDatabase()
    const refPath = ref(db, `khmer-ai-chat/admins/${uid}/pages`)
    const unsub = onValue(refPath, (snap) => {
      setPages(snap.val() || {})
    })
    return () => unsub()
  }, [uid])

  return (
    <div className="space-y-2 bg-dark-900 p-4 rounded border border-dark-700">
      <h2 className="text-sm text-light-400 mb-2">ជ្រើសរើសទំព័រ (Select a Page)</h2>
      {Object.entries(pages).map(([id, name]) => (
        <button
          key={id}
          onClick={() => router.push(`/dashboard/${id}`)}
          className="w-full text-left px-3 py-2 rounded bg-dark-800 text-light-100 hover:bg-dark-700"
        >
          {name}
        </button>
      ))}
    </div>
  )
}
