import { useEffect, useState } from "react"
import { ref, onValue, get, update, push } from "firebase/database"
import { db } from "~/lib/firebase"
import { useFlowSession } from "~/stores/flow-session"
import { useFlowRunner } from "../hooks/useFlowRunner"
import { toast } from "sonner"
import { useApplicationState } from "~/stores/application-state"
import type { Conversation, Comment, PostData } from "~/modules/nodes/types"


interface ReplyHelpersProps {
  setDraft: (text: string) => void
  activePost?: PostData | null
  activeComment?: Comment | null
  activeConversation?: Conversation | null
}



export function ReplyHelpers({ setDraft, activePost, activeComment, activeConversation}: ReplyHelpersProps) {
  const { currentPageId } = useFlowSession()

  const { activeTab } = useApplicationState(s => ({
    activeTab: s.agentData.activeTab,
  }))

  const activeUserId = activeConversation?.user_id ?? activeComment?.id ?? null

  const [personalizeReplies, setPersonalizeReplies] = useState(false)



  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [templates, setTemplates] = useState<Record<string, string>>({})
  const [flowList, setFlowList] = useState<{ id: string; name: string; type: string; lastUpdated?: string }[]>([])
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null)
  const { runFlow } = useFlowRunner()
  const [toastMessage, setToastMessage] = useState<string | null>(null)


  // Show toast only once if no page selected
  useEffect(() => {
    if (!currentPageId) {
      toast.error("⚠️ No page selected")
    }
  }, [currentPageId])

  // Load helpers + flows
  useEffect(() => {
    if (!currentPageId) return
    const helpersRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/reply_helpers`)
    const flowRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/flow`)

    onValue(helpersRef, snapshot => {
      const data = snapshot.val() || {}
      setQuickReplies(data.quickReplies || [])
      setSuggestions(data.suggestions || [])
      setTemplates(data.templates || {})
    })

    get(flowRef).then(snapshot => {
      const data = snapshot.val() || {}
      const list: any[] = []
      if (data.feature_blocks_by_type) {
        for (const type of Object.keys(data.feature_blocks_by_type)) {
          for (const id of Object.keys(data.feature_blocks_by_type[type])) {
            const block = data.feature_blocks_by_type[type][id]
            list.push({ id, name: block.block_name, type, lastUpdated: block.updatedAt })
          }
        }
      }
      setFlowList(list)
    })
  }, [currentPageId])

  const handleRunFlow = async (
    selectedFlowId: string,
    activeUserId: string,
    currentPageId: string,
    activeConversation: Conversation
  ) => {
    try {
      const result = await runFlow(selectedFlowId, activeUserId)
      if (result?.status === "success") {
        toast.success(`✅ Flow "${selectedFlowId}" triggered for user ${activeUserId}`)

        const flowMeta = flowList.find(f => `${f.type}.${f.id}` === selectedFlowId)
        const logEntry = {
          id: selectedFlowId,
          name: flowMeta ? `${flowMeta.type}.${flowMeta.name}` : selectedFlowId,
          timestamp: Date.now() / 1000,
        }

        const logsRef = ref(
          db,
          `khmer-ai-chat/pages/${currentPageId}/conversations/${activeConversation.user_id}/flowLogs`
        )
        await push(logsRef, logEntry)

        const convRef = ref(
          db,
          `khmer-ai-chat/pages/${currentPageId}/conversations/${activeConversation.user_id}`
        )
        await update(convRef, { updatedAt: Date.now() / 1000 })
      } else {
        toast.error("❌ Failed to trigger flow")
      }
    } catch (err) {
      toast.error("❌ Exception while triggering flow")
      console.error("[RunFlow] Exception:", err)
    }
  }

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // ✅ Helper to apply personalization
  const applyPersonalization = (text: string) => {
    if (personalizeReplies && activeComment?.userName) {
      return `Hi ${activeComment.userName}, ${text}`
    }
    return text
  }
  return (
    <div className="border-t border-dark-600 bg-dark-700 flex flex-col">
      {!currentPageId ? (
        <div className="text-light-300 text-xs p-2">⚠️ No page selected</div>
      ) : (
        <>
          {/* Quick Replies */}
          <div className="p-2 space-y-3">
            <div>
              <span className="text-xs text-light-400">Quick Replies:</span>
              <div className="mt-1 max-h-20 overflow-y-auto flex flex-wrap gap-2">
                {quickReplies.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => setDraft(applyPersonalization(text))}
                    className="px-2 py-1 text-xs bg-dark-600 text-light-200 rounded hover:bg-dark-500"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <span className="text-xs text-light-400">AI Suggestions:</span>
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-center space-x-2 mt-1">
                    <button
                      onClick={() => setDraft(applyPersonalization(s))}
                      className="px-2 py-1 text-xs bg-dark-600 text-light-200 rounded hover:bg-dark-500"
                    >
                      Use
                    </button>
                    <span className="text-light-100 text-xs">{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ✅ Personalization toggle */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={personalizeReplies}
                onChange={() => setPersonalizeReplies(!personalizeReplies)}
                className="accent-teal-600"
              />
              <span className="text-xs text-light-400">
                Personalize replies with commenter name
              </span>
            </div>
          </div>

          {/* Templates + Flows Row */}
          <div className="flex items-end gap-4 p-2 border-t border-dark-600">
            {/* Templates */}
            <div className="flex-1">
              <select
                onChange={e => {
                  const key = e.target.value
                  if (key) setDraft(applyPersonalization(templates[key]))
                }}
                className="w-full px-2 py-1 text-xs bg-dark-600 text-light-100 rounded focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                <option value="">Select template...</option>
                {Object.keys(templates).map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            {/* Flows */}
            <div className="flex-1">
              <div className="flex gap-2">
                <select
                  value={selectedFlowId ?? ""}
                  onChange={e => setSelectedFlowId(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs bg-dark-600 text-light-100 rounded focus:outline-none focus:ring-1 focus:ring-teal-400"
                >
                  <option value="">Select a flow...</option>
                  {flowList
                    .filter(flow => flow.type !== "carousel")
                    .map(flow => (
                      <option key={flow.id} value={`${flow.type}.${flow.id}`}>
                        🧩 {flow.type} – {flow.name}
                      </option>
                    ))}
                </select>

                {activeTab === "messages" && activeConversation && (
                  <button
                    onClick={() => {
                      handleRunFlow(selectedFlowId!, activeUserId!, currentPageId!, activeConversation)
                      setSelectedFlowId("")
                      setToastMessage("✅ Flow triggered successfully")
                    }}
                    className="px-2 py-1 text-xs bg-teal-700 text-white rounded hover:bg-teal-600"
                    disabled={!selectedFlowId}
                  >
                    Run
                  </button>
                )}

                {(activeTab === "comments" && activeComment) ||
                  (activeTab === "posts" && (activeComment || activePost)) ? (
                  <button
                    onClick={() => {
                      const flowMeta = flowList.find(f => `${f.type}.${f.id}` === selectedFlowId)
                      const refString = flowMeta ? `${flowMeta.type}.${flowMeta.name}` : selectedFlowId
                      const referralUrl = `https://m.me/${currentPageId}?ref=${refString}`
                      setDraft(applyPersonalization(referralUrl))
                      setSelectedFlowId("")
                      setToastMessage("✅ Referral URL generated successfully")
                    }}
                    className="px-2 py-1 text-xs bg-teal-700 text-white rounded hover:bg-teal-600"
                    disabled={!selectedFlowId}
                  >
                    Ref
                  </button>
                ) : null}

              </div>
            </div>
          </div>
        </>
      )}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-teal-700 text-white px-4 py-2 rounded shadow-lg text-sm animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
