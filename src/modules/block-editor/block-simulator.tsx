import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue } from 'firebase/database'

type Props = {
  pageId: string
  blockName: string
}

export function BlockSimulator({ pageId, blockName }: Props) {
  const [steps, setSteps] = useState<Record<string, any>>({})

  useEffect(() => {
    const db = getDatabase()
    const stepsRef = ref(db, `khmer-ai-chat/pages/${pageId}/blocks/${blockName}/steps`)
    const unsub = onValue(stepsRef, (snap) => {
      setSteps(snap.val() || {})
    })
    return () => unsub()
  }, [pageId, blockName])

  return (
    <div className="space-y-2 bg-dark-900 p-4 rounded border border-dark-700">
      <h2 className="text-sm text-light-400 mb-2">ការមើលជាមុន Messenger</h2>
      {Object.entries(steps).map(([id, step]) => {
        if (step.type === 'text') {
          return (
            <div key={id} className="bg-teal-600 text-white p-3 rounded max-w-xs ml-auto">
              {step.text}
            </div>
          )
        }
        if (step.type === 'image') {
          return (
            <div key={id} className="bg-dark-800 p-2 rounded max-w-xs ml-auto">
              <img src={step.url} alt="image" className="rounded" />
            </div>
          )
        }
        if (step.type === 'button') {
          return (
            <div key={id} className="bg-dark-800 p-2 rounded max-w-xs ml-auto space-y-1">
              {step.buttons?.map((btn: any, i: number) => (
                <button
                  key={i}
                  className="w-full bg-teal-500 text-white text-sm py-1 rounded"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
