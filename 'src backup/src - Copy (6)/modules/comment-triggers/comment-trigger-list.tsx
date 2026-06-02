import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue, set, remove } from 'firebase/database'

type Props = {
  pageId: string
}

export function CommentTriggerList({ pageId }: Props) {
  const [triggers, setTriggers] = useState<Record<string, string>>({})
  const [newTrigger, setNewTrigger] = useState('')
  const [newBlock, setNewBlock] = useState('')

  useEffect(() => {
    const db = getDatabase()
    const refPath = ref(db, `khmer-ai-chat/pages/${pageId}/comments`)
    const unsub = onValue(refPath, (snap) => {
      setTriggers(snap.val() || {})
    })
    return () => unsub()
  }, [pageId])

  const handleAdd = async () => {
    if (!newTrigger.trim() || !newBlock.trim()) return
    const db = getDatabase()
    const triggerRef = ref(db, `khmer-ai-chat/pages/${pageId}/comments/${newTrigger}`)
    await set(triggerRef, newBlock)
    setNewTrigger('')
    setNewBlock('')
  }

  const handleDelete = async (trigger: string) => {
    const db = getDatabase()
    const triggerRef = ref(db, `khmer-ai-chat/pages/${pageId}/comments/${trigger}`)
    await remove(triggerRef)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-light-100">Comment Triggers</h2>

      <div className="flex gap-2">
        <input
          value={newTrigger}
          onChange={(e) => setNewTrigger(e.target.value)}
          placeholder="Trigger word"
          className="w-1/3 rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
        />
        <input
          value={newBlock}
          onChange={(e) => setNewBlock(e.target.value)}
          placeholder="Block name"
          className="w-1/2 rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 rounded bg-teal-500 text-white text-sm hover:bg-teal-600"
        >
          Add
        </button>
      </div>

      {Object.entries(triggers).length === 0 ? (
        <p className="text-sm text-light-400">No comment triggers yet.</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(triggers).map(([trigger, block]) => (
            <div
              key={trigger}
              className="flex justify-between items-center bg-dark-800 p-3 rounded border border-dark-600"
            >
              <div>
                <div className="text-light-100">{trigger}</div>
                <div className="text-xs text-light-400">{block}</div>
              </div>
              <button
                onClick={() => handleDelete(trigger)}
                className="text-sm text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
