import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue, set, remove } from 'firebase/database'
import { toast } from 'sonner'
import { get } from 'firebase/database' 

type Props = {
  pageId: string
}

export function MessageTriggerList({ pageId }: Props) {
  const [triggers, setTriggers] = useState<Record<string, string>>({})
  const [newTrigger, setNewTrigger] = useState('')
  const [newBlock, setNewBlock] = useState('')

  useEffect(() => {
    const db = getDatabase()
    const refPath = ref(db, `khmer-ai-chat/pages/${pageId}/messages`)
    const unsub = onValue(refPath, (snap) => {
      setTriggers(snap.val() || {})
    })
    return () => unsub()
  }, [pageId])

const handleAdd = async () => {
  const trigger = newTrigger.trim()
  const block = newBlock.trim()
  if (!trigger || !block) return

  if (triggers[trigger]) {
    toast.error(`ពាក្យ "${trigger}" មានរួចហើយ`)
    return
  }

  const db = getDatabase()

  // 🧩 Block existence check
  const blockRef = ref(db, `khmer-ai-chat/pages/${pageId}/blocks/${block}`)
  const blockSnap = await get(blockRef)

  if (!blockSnap.exists()) {
    toast.warning(`⚠️ ប្លុក "${block}" មិនមានទេ`)
    // Optional: auto-create placeholder
    // await set(blockRef, { name: block, steps: [] })
    // toast.success(`🧩 បង្កើតប្លុក "${block}" រួចរាល់`)
  }

  const triggerRef = ref(db, `khmer-ai-chat/pages/${pageId}/messages/${trigger}`)
  await set(triggerRef, block)
  toast.success(`✅ បន្ថែមពាក្យ "${trigger}" រួចរាល់`)
  setNewTrigger('')
  setNewBlock('')
}


  const handleDelete = async (trigger: string) => {
    const db = getDatabase()
    const triggerRef = ref(db, `khmer-ai-chat/pages/${pageId}/messages/${trigger}`)
    await remove(triggerRef)
    toast.success(`🗑️ លុបពាក្យ "${trigger}" រួចរាល់`)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-light-100">ពាក្យបញ្ចេញសារ (Message Triggers)</h2>

      <div className="flex gap-2 items-end">
        <div className="flex flex-col w-1/3">
          <label className="text-sm text-light-100 mb-1">
            ពាក្យបញ្ចេញសារ
            <span className="text-light-400 ml-1" title="ពាក្យដែលអ្នកប្រើសរសេរមកដើម្បីបើកសារ">🛈</span>
          </label>
          <input
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            placeholder="ឧ. សួស្តី"
            className="rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
          />
        </div>
        <div className="flex flex-col w-1/2">
          <label className="text-sm text-light-100 mb-1">
            ឈ្មោះប្លុកដែលត្រូវឆ្លើយ
            <span className="text-light-400 ml-1" title="ឈ្មោះប្លុកដែលត្រូវឆ្លើយទៅអ្នកប្រើ">🛈</span>
          </label>
          <input
            value={newBlock}
            onChange={(e) => setNewBlock(e.target.value)}
            placeholder="ឧ. intro_block"
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

      {Object.entries(triggers).length === 0 ? (
        <p className="text-sm text-light-400">មិនទាន់មានពាក្យបញ្ចេញសារទេ។</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(triggers)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([trigger, block]) => (
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
                  លុប
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
