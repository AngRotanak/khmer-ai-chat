import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue, set, remove } from 'firebase/database'
import { toast } from 'sonner'
import { logAction } from '~/utils/log-action'

type Props = {
  pageId: string
  blockName: string
}

export function BlockEditor({ pageId, blockName }: Props) {
  const [steps, setSteps] = useState<Record<string, any>>({})
  const [newText, setNewText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSteps, setSelectedSteps] = useState<string[]>([])

  useEffect(() => {
    const db = getDatabase()
    const stepsRef = ref(db, `khmer-ai-chat/pages/${pageId}/blocks/${blockName}/steps`)
    const unsub = onValue(stepsRef, (snap) => {
      setSteps(snap.val() || {})
    })
    return () => unsub()
  }, [pageId, blockName])

  const handleAddStep = async () => {
    if (!newText.trim()) {
      toast.error('⚠️ សារមិនអាចទទេ')
      return
    }

    if (newText.length > 640) {
      toast.error('⚠️ សារមិនអាចលើស 640 តួអក្សរ')
      return
    }

    const db = getDatabase()
    const stepId = `step${Object.keys(steps).length + 1}`
    const stepRef = ref(db, `khmer-ai-chat/pages/${pageId}/blocks/${blockName}/steps/${stepId}`)
    await set(stepRef, { type: 'text', text: newText.trim() })
    await logAction(pageId, 'add_step', {
      block: blockName,
      stepId,
      stepText: newText.trim(),
    })
    toast.success(`✅ បន្ថែមជំហានថ្មី`)
    setNewText('')
  }

  const handleBulkDelete = async () => {
    const db = getDatabase()
    for (const id of selectedSteps) {
      const stepRef = ref(db, `khmer-ai-chat/pages/${pageId}/blocks/${blockName}/steps/${id}`)
      await remove(stepRef)
      await logAction(pageId, 'delete_step', {
        block: blockName,
        stepId: id,
        stepText: steps[id]?.text,
      })
    }
    toast.success(`🗑️ លុប ${selectedSteps.length} ជំហាន`)
    setSelectedSteps([])
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-light-100">ប្លុក៖ {blockName}</h2>

      <div className="space-y-2">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ស្វែងរកជំហាន"
          className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
        />

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="សារថ្មី"
              className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
            />
            <p
              className={`text-xs mt-1 ${
                newText.length > 640
                  ? 'text-red-400'
                  : newText.length > 600
                  ? 'text-yellow-400'
                  : 'text-light-400'
              }`}
            >
              {newText.length}/640 តួអក្សរ
            </p>
          </div>

          <button
            onClick={handleAddStep}
            className="h-9 px-4 rounded bg-teal-500 text-white text-sm hover:bg-teal-600"
          >
            បន្ថែម
          </button>
        </div>
      </div>

      {Object.entries(steps).length === 0 ? (
        <p className="text-sm text-light-400">មិនទាន់មានជំហានទេ។</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(steps)
            .filter(([_, step]) => step.text?.includes(searchTerm))
            .map(([id, step]) => (
              <div
                key={id}
                className="flex justify-between items-center bg-dark-800 p-3 rounded border border-dark-600 text-light-100"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedSteps.includes(id)}
                    onChange={(e) => {
                      setSelectedSteps((prev) =>
                        e.target.checked
                          ? [...prev, id]
                          : prev.filter((s) => s !== id)
                      )
                    }}
                  />
                  <span>{step.text}</span>
                </label>
                <div className="text-xs text-light-400">{id}</div>
              </div>
            ))}
        </div>
      )}

      {selectedSteps.length > 0 && (
        <button
          onClick={handleBulkDelete}
          className="px-4 py-2 bg-red-500 text-white rounded text-sm"
        >
          លុបជាខ្ទង់ ({selectedSteps.length})
        </button>
      )}
    </div>
  )
}
