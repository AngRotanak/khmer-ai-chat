import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { toast } from 'sonner'

async function undoTrigger(pageId: string, target: string, block: string) {
  const db = getDatabase()
  const parts = target.split('/')
  if (parts.length !== 2) {
    toast.error('⚠️ Target មិនត្រឹមត្រូវទេ')
    return
  }

  const [type, trigger] = parts
  const refPath = ref(db, `khmer-ai-chat/pages/${pageId}/${type}/${trigger}`)
  await set(refPath, block)
  toast.success(`✅ ស្ដារឡើងវិញ "${trigger}"`)
}

export function ActivityLog({ pageId }: { pageId: string }) {
  const [logs, setLogs] = useState<Record<string, any>>({})

  useEffect(() => {
    const db = getDatabase()
    const logRef = ref(db, `khmer-ai-chat/pages/${pageId}/logs`)
    const unsub = onValue(logRef, (snap) => {
      setLogs(snap.val() || {})
    })
    return () => unsub()
  }, [pageId])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-light-100">ប្រវត្តិការកែប្រែ (Activity Log)</h2>
      {Object.entries(logs)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([ts, log]) => (
          <div key={ts} className="bg-dark-800 p-3 rounded border border-dark-600 text-light-100 space-y-1">
            <div className="text-xs text-light-400">
              {new Date(Number(ts)).toLocaleString()} • {log.userId}
            </div>
            <div className="flex justify-between items-center">
              <div>
                {log.action} → {log.target || log.block}
              </div>
              {log.action?.startsWith('delete_') && log.target && log.block && (
                <button
                  onClick={() => undoTrigger(pageId, log.target, log.block)}
                  className="text-xs text-teal-400 hover:underline"
                >
                  ស្ដារឡើងវិញ
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  )
}
