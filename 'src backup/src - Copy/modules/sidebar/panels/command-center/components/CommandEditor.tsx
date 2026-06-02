import { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { toast } from 'sonner'

type CommandEditorProps = {
  command: string // e.g. "info_skin_care"
}

export function CommandEditor({ command }: CommandEditorProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const db = getDatabase()
    const commandRef = ref(db, `khmer-ai-chat/config/commands/${command}`)
    const unsubscribe = onValue(commandRef, (snapshot) => {
      const data = snapshot.val()
      setValue(data?.value ?? '')
      setLoading(false)
    })
    return () => unsubscribe()
  }, [command])

  const handleSave = async () => {
    setSaving(true)
    const db = getDatabase()
    const commandRef = ref(db, `khmer-ai-chat/config/commands/${command}`)
    await set(commandRef, { value })
    toast.success(`Saved response for ${command}`)
    setSaving(false)
  }

  return (
    <div className="rounded bg-dark-700 p-3 space-y-2">
      <label className="block text-sm font-medium text-light-100">
        {command}
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading || saving}
        rows={3}
        className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
        placeholder="Enter bot response..."
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
