import { useState } from 'react'
import { getDatabase, ref, set } from 'firebase/database'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '~/stores/auth-store'

type Props = {
  onClose: () => void
}

export function ActivatePageForm({ onClose }: Props) {
  const [pageId, setPageId] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleActivate = async () => {
    // ✅ 1. Prevent empty input
    if (!pageId.trim()) return
    setSaving(true

    )

    // ✅ 2. Validate user ID
    if (typeof user?.id !== 'string') {
      toast.error('⚠️ អ្នកប្រើមិនទាន់បាន Authenticate')
      setSaving(false)
      return
    }

    const db = getDatabase()

    // ✅ 3. Create page config under khmer-ai-chat/pages/{pageId}/config
    const pageRef = ref(db, `khmer-ai-chat/pages/${pageId}/config`)
    await set(pageRef, {
      name: 'Unnamed Page', // Khmer name can be added later
      createdAt: Date.now(),
      createdBy: user.id,
    })

    // ✅ 4. Assign current user as admin under khmer-ai-chat/pages/{pageId}/roles/{user.id}
    const roleRef = ref(db, `khmer-ai-chat/pages/${pageId}/roles/${user.id}`)
    await set(roleRef, 'admin')

    // ✅ 5. Link page to admin dashboard under khmer-ai-chat/admins/{user.id}/pages/{pageId}
    const adminPageRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${pageId}`)
    await set(adminPageRef, 'Unnamed Page') // This name will show in PageList

    // ✅ 6. Show success toast and redirect
    toast.success(`✅ Page activated: ${pageId}`)
    setSaving(false)
    onClose()
    navigate({ to: `/dashboard/pages/${pageId}` })
  }

  return (
    <div className="rounded bg-dark-800 p-4 space-y-3 border border-dark-600">
      <label className="block text-sm text-light-100">បញ្ចូល Page ID</label>
      <input
        type="text"
        value={pageId}
        onChange={(e) => setPageId(e.target.value)}
        placeholder="e.g. 123456789"
        className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
      />
      <div className="flex gap-2">
        <button
          onClick={handleActivate}
          disabled={!pageId || saving}
          className="px-4 py-2 rounded bg-teal-500 text-white text-sm hover:bg-teal-600 disabled:opacity-50"
        >
          Activate
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-dark-600 text-light-200 text-sm hover:bg-dark-500"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
