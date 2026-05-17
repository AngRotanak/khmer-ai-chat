import { useState, useEffect } from "react"
import { ref, onValue, set } from "firebase/database"
import { db } from "~/lib/firebase"
import { useFlowSession } from "~/stores/flow-session"
import { useNavigate } from "@tanstack/react-router"

export function ReplyHelpersAdmin() {
  const { currentPageId } = useFlowSession()
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [templates, setTemplates] = useState<Record<string, string>>({})
  const [newQuick, setNewQuick] = useState("")
  const [newTemplateKey, setNewTemplateKey] = useState("")
  const [newTemplateValue, setNewTemplateValue] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentPageId) return
    const helpersRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/reply_helpers`)
    return onValue(helpersRef, snapshot => {
      const data = snapshot.val() || {}
      setQuickReplies(data.quickReplies || [])
      setTemplates(data.templates || {})
    })
  }, [currentPageId])

  const addQuickReply = () => {
    if (!newQuick.trim() || !currentPageId) return
    const updated = [...quickReplies, newQuick.trim()]
    set(ref(db, `khmer-ai-chat/pages/${currentPageId}/reply_helpers/quickReplies`), updated)
    setNewQuick("")
  }

  const removeQuickReply = (index: number) => {
    if (!currentPageId) return
    const updated = quickReplies.filter((_, i) => i !== index)
    set(ref(db, `khmer-ai-chat/pages/${currentPageId}/reply_helpers/quickReplies`), updated)
  }

  const addTemplate = () => {
    if (!newTemplateKey.trim() || !newTemplateValue.trim() || !currentPageId) return
    const updated = { ...templates, [newTemplateKey]: newTemplateValue }
    set(ref(db, `khmer-ai-chat/pages/${currentPageId}/reply_helpers/templates`), updated)
    setNewTemplateKey("")
    setNewTemplateValue("")
  }

  const removeTemplate = (key: string) => {
    if (!currentPageId) return
    const updated = { ...templates }
    delete updated[key]
    set(ref(db, `khmer-ai-chat/pages/${currentPageId}/reply_helpers/templates`), updated)
  }

  if (!currentPageId) {
    return <div className="p-4 text-light-400">⚠️ Please select a page first.</div>
  }

  return (
    <div className="p-4 bg-dark-900 text-light-100 space-y-6">
      {/* Quick Replies */}
      <div className="bg-dark-800 rounded-lg p-4 shadow">
        <h2 className="text-lg font-bold text-teal-400 border-b border-dark-600 pb-2">
          Quick Replies
        </h2>
        <div className="space-y-2 mt-2">
          {quickReplies.map((qr, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="flex-1 break-words">{qr}</span>
              <button
                onClick={() => removeQuickReply(i)}
                className="px-2 py-1 text-xs bg-red-600 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <input
            value={newQuick}
            onChange={e => setNewQuick(e.target.value)}
            placeholder="New quick reply..."
            className="flex-1 px-2 py-1 text-sm rounded bg-dark-700"
          />
          <button
            onClick={addQuickReply}
            className="px-3 py-1 bg-teal-600 rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-dark-800 rounded-lg p-4 shadow">
        <h2 className="text-lg font-bold text-teal-400 border-b border-dark-600 pb-2">
          Templates
        </h2>
        <div className="space-y-2 mt-2">
          {Object.entries(templates).map(([key, value]) => (
            <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="font-semibold text-teal-300">{key}:</span>
              <span className="flex-1 break-words">{value}</span>
              <button
                onClick={() => removeTemplate(key)}
                className="px-2 py-1 text-xs bg-red-600 rounded self-end sm:self-auto"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <input
            value={newTemplateKey}
            onChange={e => setNewTemplateKey(e.target.value)}
            placeholder="Template name..."
            className="flex-1 px-2 py-1 text-sm rounded bg-dark-700"
          />
          <input
            value={newTemplateValue}
            onChange={e => setNewTemplateValue(e.target.value)}
            placeholder="Template text..."
            className="flex-1 px-2 py-1 text-sm rounded bg-dark-700"
          />
          <button
            onClick={addTemplate}
            className="px-3 py-1 bg-teal-600 rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* ✅ Mobile Navigation */}
      <div className="sm:hidden mt-6 space-y-3">
        <button
          onClick={() => navigate({ to: "/dashboard/flow" })}
          className="w-full px-3 py-2 rounded bg-teal-700 text-white hover:bg-teal-600"
        >
          Flow Builder
        </button>
        <button
          onClick={() => navigate({ to: "/dashboard/agents" })}
          className="w-full px-3 py-2 rounded bg-teal-700 text-white hover:bg-teal-600"
        >
          Agent Dashboard
        </button>
        <button
          onClick={() => navigate({ to: "/smart-catalog" })}
          className="w-full px-3 py-2 rounded bg-teal-700 text-white hover:bg-teal-600"
        >
          Smart e‑Catalog
        </button>
      </div>
    </div>
  )
}
