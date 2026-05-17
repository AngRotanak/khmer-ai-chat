import { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { toast } from 'sonner'

export function FallbackEditor() {
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const db = getDatabase()
    const fallbackRef = ref(db, 'khmer-ai-chat/config/fallback')
    const unsubscribe = onValue(fallbackRef, (snapshot) => {
      const data = snapshot.val()
      setReply(data?.reply ?? '')
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const db = getDatabase()
    const fallbackRef = ref(db, 'khmer-ai-chat/config/fallback')
    await set(fallbackRef, { reply })
    toast.success('Fallback reply saved')
    setSaving(false)
  }

  return (
    <div className="rounded bg-dark-700 p-3 space-y-2">
      <label className="block text-sm font-medium text-light-100">
        Fallback Reply
      </label>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        disabled={loading || saving}
        rows={3}
        className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
        placeholder="Enter fallback reply for unmatched messages..."
      />
      <button
        onClick={handleSave}
        disabled={saving || loading}
        className="px-3 py-1 text-sm rounded bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
