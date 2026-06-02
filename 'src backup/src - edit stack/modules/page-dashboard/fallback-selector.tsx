import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'

export function FallbackSelector({ pageId }: { pageId: string }) {
  const [fallback, setFallback] = useState('')
  const [input, setInput] = useState('')

  useEffect(() => {
    const db = getDatabase()
    const fallbackRef = ref(db, `khmer-ai-chat/pages/${pageId}/config/fallback_block`)
    const unsub = onValue(fallbackRef, (snap) => {
      setFallback(snap.val() || '')
      setInput(snap.val() || '')
    })
    return () => unsub()
  }, [pageId])

  const handleSave = async () => {
    const db = getDatabase()
    const fallbackRef = ref(db, `khmer-ai-chat/pages/${pageId}/config/fallback_block`)
    await set(fallbackRef, input.trim())
  }

  return (
    <div className="space-y-2">
      <label className="text-sm text-light-100">Fallback Block</label>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g. default_fallback"
        className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
      />
      <button
        onClick={handleSave}
        className="px-4 py-2 rounded bg-teal-500 text-white text-sm hover:bg-teal-600"
      >
        Save Fallback
      </button>
    </div>
  )
}
