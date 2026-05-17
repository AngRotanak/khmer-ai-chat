import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue, set, remove } from 'firebase/database'
import { toast } from 'sonner'

type Props = {
  pageId: string
}

export function RoleManager({ pageId }: Props) {
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [newUid, setNewUid] = useState('')

  useEffect(() => {
    const db = getDatabase()
    const rolesRef = ref(db, `khmer-ai-chat/pages/${pageId}/roles`)
    const unsub = onValue(rolesRef, (snap) => {
      setRoles(snap.val() || {})
    })
    return () => unsub()
  }, [pageId])

  const handleAdd = async () => {
    const uid = newUid.trim()

    if (!uid) {
      toast.error('⚠️ សូមបញ្ចូល UID')
      return
    }

    if (!/^[a-zA-Z0-9]{6,}$/.test(uid)) {
      toast.error('⚠️ UID មិនត្រឹមត្រូវទេ')
      return
    }

    if (roles[uid]) {
      toast.error('⚠️ អ្នកនេះមានរួចហើយ')
      return
    }

    const db = getDatabase()
    const roleRef = ref(db, `khmer-ai-chat/pages/${pageId}/roles/${uid}`)
    await set(roleRef, 'admin')
    toast.success(`✅ បន្ថែមអ្នកគ្រប់គ្រង: ${uid}`)
    setNewUid('')
  }


  const handleRemove = async (uid: string) => {
    const db = getDatabase()
    const roleRef = ref(db, `khmer-ai-chat/pages/${pageId}/roles/${uid}`)
    await remove(roleRef)
    toast.success(`🗑️ Removed admin: ${uid}`)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-light-100">អ្នកគ្រប់គ្រងទំព័រ (Admins)</h2>

      <div className="flex gap-2 items-end">
        <div className="flex flex-col w-2/3">
          <label className="text-sm text-light-100 mb-1">
            បញ្ចូល UID របស់អ្នកប្រើ <span className="text-light-400 ml-1" title="UID របស់អ្នកប្រើដែលអ្នកចង់បន្ថែមជាអ្នកគ្រប់គ្រង">🛈</span>
          </label>
          <input
            value={newUid}
            onChange={(e) => setNewUid(e.target.value)}
            placeholder="ឧ. 8xYz123abc456"
            className="rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
          />
        </div>
        <button
          onClick={handleAdd}
          className="h-9 px-4 rounded bg-teal-500 text-white text-sm mt-5 hover:bg-teal-600"
        >
          បន្ថែម
        </button>
      </div>

      {Object.entries(roles).length === 0 ? (
        <p className="text-sm text-light-400">មិនទាន់មានអ្នកគ្រប់គ្រងទេ។</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(roles).map(([uid, role]) => (
            <div
              key={uid}
              className="flex justify-between items-center bg-dark-800 p-3 rounded border border-dark-600"
            >
              <div>
                <div className="text-light-100">{uid}</div>
                <div className="text-xs text-light-400">{role}</div>
              </div>
              <button
                onClick={() => handleRemove(uid)}
                className="text-sm text-red-400 hover:underline"
              >
                លុប
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
