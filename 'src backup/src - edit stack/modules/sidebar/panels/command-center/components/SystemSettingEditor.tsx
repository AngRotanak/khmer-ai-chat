import { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { toast } from 'sonner'

type SystemSettingEditorProps = {
  label: string
  path: string // e.g. "settings/bot_name" or "settings/preview_enabled"
}

export function SystemSettingEditor({ label, path }: SystemSettingEditorProps) {
  const [value, setValue] = useState<string | boolean>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const db = getDatabase()
    const settingRef = ref(db, `khmer-ai-chat/config/${path}`)
    const unsubscribe = onValue(settingRef, (snapshot) => {
      const data = snapshot.val()
      setValue(data ?? '')
      setLoading(false)
    })
    return () => unsubscribe()
  }, [path])

  const handleSave = async () => {
    setSaving(true)
    const db = getDatabase()
    const settingRef = ref(db, `khmer-ai-chat/config/${path}`)
    await set(settingRef, value)
    toast.success(`Saved setting: ${label}`)
    setSaving(false)
  }

  const isBoolean = typeof value === 'boolean'

  return (
    <div className="rounded bg-dark-700 p-3 space-y-2">
      <label className="block text-sm font-medium text-light-100">
        {label}
      </label>

      {isBoolean ? (
        <button
          onClick={() => {
            setValue(!value)
            handleSave()
          }}
          disabled={loading || saving}
          className="w-10 h-6 rounded-full bg-dark-400 relative transition"
        >
          <div
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${
              value ? 'translate-x-4 bg-teal-400' : 'translate-x-0 bg-gray-400'
            }`}
          />
        </button>
      ) : (
        <>
          <input
            type="text"
            value={String(value)}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading || saving}
            className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
            placeholder="Enter value..."
          />
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-3 py-1 text-sm rounded bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </>
      )}
    </div>
  )
}
