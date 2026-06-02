import { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { toast } from 'sonner'

type CommandEditorProps = {
  pageId: string
  blockId: string
  block: any
  lang: 'en' | 'kh'   // ✅ explicitly typed
}

export function CommandEditor({ pageId, blockId, block, lang }: CommandEditorProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Each info block points to a template_ref
  const templateId = block?.canvas?.paths?.[0]?.template_ref

  useEffect(() => {
    if (!pageId || !templateId) return
    const db = getDatabase()
    const templateRef = ref(
      db,
      `khmer-ai-chat/pages/${pageId}/flow/shared_templates/${templateId}/locales/${lang}`
    )

    const unsubscribe = onValue(templateRef, (snapshot) => {
      const data = snapshot.val()
      // In Firebase, `locales/en` is an object { lang: 'en', text: '...' }
      setValue(data?.text ?? '')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [pageId, templateId, lang])

  const handleSave = async () => {
    if (!pageId || !templateId) return
    setSaving(true)
    const db = getDatabase()
    const templateRef = ref(
      db,
      `khmer-ai-chat/pages/${pageId}/flow/shared_templates/${templateId}/locales/${lang}/text`
    )
    await set(templateRef, value)
    toast.success(`Saved ${lang.toUpperCase()} response for block "${block.block_name}"`)
    setSaving(false)
  }

  return (
    <div className="rounded bg-dark-700 p-3 space-y-2">
      <label className="block text-sm font-medium text-light-100">
        {block.block_name} ({lang.toUpperCase()})
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading || saving}
        rows={3}
        className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
        placeholder={`Enter ${lang.toUpperCase()} bot response...`}
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
