import { useState, useEffect } from "react"
import { ref, onValue, set } from "firebase/database"
import { db } from "~/lib/firebase"
import { useFlowSession } from "~/stores/flow-session"

export function ReplyHelpersAdmin() {
  const { currentPageId } = useFlowSession()   // ✅ shared page context
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [templates, setTemplates] = useState<Record<string, string>>({})
  const [newQuick, setNewQuick] = useState("")
  const [newTemplateKey, setNewTemplateKey] = useState("")
  const [newTemplateValue, setNewTemplateValue] = useState("")

  // ✅ Load helpers from Firebase for the current page
  useEffect(() => {
    if (!currentPageId) return
    const helpersRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/reply_helpers`)
    return onValue(helpersRef, snapshot => {
      const data = snapshot.val() || {}
      setQuickReplies(data.quickReplies || [])
      setTemplates(data.templates || {})
    })
  }, [currentPageId])

  // Add quick reply
  const addQuickReply = () => {
    if (!newQuick.trim() || !currentPageId) return
    const updated = [...quickReplies, newQuick.trim()]
    set(ref(db, `khmer-ai-chat/pages/${currentPageId}/reply_helpers/quickReplies`), updated)
    setNewQuick("")
  }

  // Remove quick reply
  const removeQuickReply = (index: number) => {
    if (!currentPageId) return
    const updated = quickReplies.filter((_, i) => i !== index)
    set(ref(db, `khmer-ai-chat/pages/${currentPageId}/reply_helpers/quickReplies`), updated)
  }

  // Add template
  const addTemplate = () => {
    if (!newTemplateKey.trim() || !newTemplateValue.trim() || !currentPageId) return
    const updated = { ...templates, [newTemplateKey]: newTemplateValue }
    set(ref(db, `khmer-ai-chat/pages/${currentPageId}/reply_helpers/templates`), updated)
    setNewTemplateKey("")
    setNewTemplateValue("")
  }

  // Remove template
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
    <div className="p-4 bg-dark-800 text-light-100 space-y-6">
      {/* Quick Replies */}
      <div>
        <h2 className="text-lg font-bold">Quick Replies</h2>
        <div className="space-y-2 mt-2">
          {quickReplies.map((qr, i) => (
            <div key={i} className="flex items-center space-x-2">
              <span className="flex-1">{qr}</span>
              <button
                onClick={() => removeQuickReply(i)}
                className="px-2 py-1 text-xs bg-red-600 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <div className="flex space-x-2 mt-2">
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
      <div>
        <h2 className="text-lg font-bold">Templates</h2>
        <div className="space-y-2 mt-2">
          {Object.entries(templates).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <span className="flex-1 font-semibold">{key}:</span>
              <span className="flex-1">{value}</span>
              <button
                onClick={() => removeTemplate(key)}
                className="px-2 py-1 text-xs bg-red-600 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <div className="flex space-x-2 mt-2">
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
    </div>
  )
}
