import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue } from 'firebase/database'
import { useExportJson } from '~/hooks/use-export-json'
import { toast } from 'sonner'

type Props = {
  pageId: string
}

export function ExportSummary({ pageId }: Props) {
  const [fallback, setFallback] = useState('')
  const [comments, setComments] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [blocks, setBlocks] = useState<Record<string, any>>({})

  useEffect(() => {
    const db = getDatabase()

    onValue(ref(db, `khmer-ai-chat/pages/${pageId}/config/fallback_block`), (snap) =>
      setFallback(snap.val() || '')
    )
    onValue(ref(db, `khmer-ai-chat/pages/${pageId}/comments`), (snap) =>
      setComments(snap.val() || {})
    )
    onValue(ref(db, `khmer-ai-chat/pages/${pageId}/messages`), (snap) =>
      setMessages(snap.val() || {})
    )
    onValue(ref(db, `khmer-ai-chat/pages/${pageId}/blocks`), (snap) =>
      setBlocks(snap.val() || {})
    )
  }, [pageId])

  return (
    <div className="space-y-4 bg-dark-900 p-4 rounded border border-dark-700">
      <h2 className="text-lg font-semibold text-light-100">សង្ខេបការបញ្ជូន (Export Summary)</h2>

      <div className="text-sm text-light-400">
        <strong>Fallback Block:</strong> {fallback || 'មិនបានកំណត់'}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-light-100 mt-4">Comment Triggers</h3>
        {Object.entries(comments).map(([trigger, block]) => (
          <div key={trigger} className="text-sm text-light-400">
            <strong>{trigger}</strong> → {block} ({blocks[block]?.steps ? Object.keys(blocks[block].steps).length : 0} steps)
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-light-100 mt-4">Message Triggers</h3>
        {Object.entries(messages).map(([trigger, block]) => (
          <div key={trigger} className="text-sm text-light-400">
            <strong>{trigger}</strong> → {block} ({blocks[block]?.steps ? Object.keys(blocks[block].steps).length : 0} steps)
          </div>
        ))}
      </div>

     <button
      onClick={async () => {
        const data = await useExportJson(pageId)
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `khmerai-${pageId}-export.json`
        a.click()
        toast.success('✅ JSON បានបញ្ជូន')
      }}
      className="px-4 py-2 rounded bg-teal-500 text-white text-sm hover:bg-teal-600"
    >
      បញ្ជូន JSON
    </button>

    </div>
  )
}
