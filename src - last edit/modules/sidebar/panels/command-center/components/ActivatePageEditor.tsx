import { useState, useEffect } from 'react'
import { useAuthStore } from '~/stores/auth-store'
import { db } from '~/lib/firebase'
import { ref, set, remove, get } from 'firebase/database'

export function ActivatePageEditor() {
  const user = useAuthStore(s => s.user)
  if (!user) {
    return <div className="p-4 text-light-100">⏳ កំពុងផ្ទុកអ្នកប្រើ...</div>
  }

  const [pages, setPages] = useState<{ id: string; name: string; status: string }[]>([])
  const [newPageId, setNewPageId] = useState('')
  const [newPageName, setNewPageName] = useState('')
  const [newPageStatus, setNewPageStatus] = useState<'active' | 'draft' | 'disabled'>('draft')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    if (!user?.id) return
    loadPages()
  }, [user?.id])

  const loadPages = async () => {
    const pagesRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages`)
    const snapshot = await get(pagesRef)
    const data = snapshot.val()
    if (!data) {
      setPages([])
      return
    }

    const loaded = await Promise.all(
      Object.entries(data).map(async ([id, value]) => {
        const flowRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${id}/flow`)
        const flowSnap = await get(flowRef)
        const hasFlow = flowSnap.exists()

        const status = (value as any).status ?? 'draft'
        const autoStatus = hasFlow ? status : 'disabled'

        if (autoStatus !== status) {
          const statusRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${id}/status`)
          await set(statusRef, autoStatus)
        }

        return {
          id,
          name: (value as any).name,
          status: autoStatus,
        }
      })
    )

    setPages(loaded)
  }


  const handleAddPage = async () => {
    if (!user?.id || !newPageId.trim()) return

    const id = newPageId.trim()
    const pageRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${id}`)

    await set(pageRef, {
      name: newPageName || `Page ${id}`,
      status: newPageStatus,
      createdAt: Date.now(),
    })

    const flowRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${id}/flow`)
    await set(flowRef, {
      nodes: [],
      edges: [],
      createdAt: Date.now(),
    })

    setNewPageId('')
    setNewPageName('')
    setNewPageStatus('draft')

    await loadPages() // ← refresh UI
  }


  const handleRenamePage = async (id: string, newName: string) => {
    if (!user?.id || !newName.trim()) return
    const nameRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${id}/name`)
    await set(nameRef, newName)
    await loadPages()
  }


  const handleDeletePage = async (id: string) => {
    if (!user?.id) return
    const pageRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${id}`)
    await remove(pageRef)
    await loadPages()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-light-100">🔘 Activate Page</h3>

      <div className="space-y-2">
        <input
          value={newPageId}
          onChange={(e) => setNewPageId(e.target.value)}
          placeholder="Facebook Page ID"
          className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
        />
        <input
          value={newPageName}
          onChange={(e) => setNewPageName(e.target.value)}
          placeholder="Page Name (optional)"
          className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
        />
        <select
          value={newPageStatus}
          onChange={(e) => setNewPageStatus(e.target.value as any)}
          className="w-full rounded bg-dark-900 border border-dark-500 text-light-100 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <button
          onClick={handleAddPage}
          className="w-full rounded bg-teal-700 py-2 text-sm text-white hover:bg-teal-600"
        >
          ➕ បន្ថែមទំព័រ
        </button>
      </div>

      <ul className="space-y-2">
        {pages.map(p => (
          <li key={p.id} className="rounded bg-dark-600 px-3 py-2 text-sm">
            <div className="grid grid-cols-[1fr_auto] gap-4 items-start">

              {/* Left: Name + Status + Flow Warning */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-light-100 break-words">{p.name}</span>
                  <span className={`rounded px-2 py-0.5 text-xs ${p.status === 'active' ? 'bg-green-700 text-white' :
                      p.status === 'draft' ? 'bg-yellow-600 text-white' :
                        'bg-gray-600 text-white'
                    }`}>
                    {p.status}
                  </span>
                  {p.status === 'disabled' && (
                    <span className="text-yellow-400 text-xs whitespace-nowrap">⚠️ No flow</span>
                  )}
                </div>

                <div className="text-xs text-light-100/50 mt-1">ID: {p.id}</div>

                {p.status === 'disabled' && (
                  <div className="flex items-center gap-1 text-xs text-yellow-400 mt-1 whitespace-nowrap">
                    <span>⚠️</span>
                    <span>This page has no flow and will be marked as <span className="font-semibold">disabled</span>.</span>
                  </div>
                )}
              </div>

              {/* Right: Actions — fixed width */}
              <div className="flex flex-col items-end gap-2 w-[200px] shrink-0">
                {renamingId === p.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (renameValue.trim()) {
                        handleRenamePage(p.id, renameValue.trim())
                      }
                      setRenamingId(null)
                    }}
                    className="flex flex-col items-end gap-2 w-full"
                  >
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="w-full rounded bg-dark-900 border border-dark-500 text-light-100 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="text-xs text-teal-400 hover:underline">Save</button>
                      <button type="button" onClick={() => setRenamingId(null)} className="text-xs text-light-100/50 hover:underline">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setRenamingId(p.id)
                          setRenameValue(p.name)
                        }}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete page "${p.name}"?`)) {
                            handleDeletePage(p.id)
                          }
                        }}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>

                    <select
                      value={p.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as 'active' | 'draft' | 'disabled'
                        const statusRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${p.id}/status`)
                        set(statusRef, newStatus).then(() => loadPages())
                      }}

                      className="w-[110px] rounded bg-dark-900 border border-dark-500 text-xs text-light-100 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>


    </div>
  )
}
