import { useEffect, useState } from "react"
import { ref, onChildAdded, onValue, off } from "firebase/database"
import { db } from "~/lib/firebase"
import { useFlowSession } from '~/stores/flow-session'

import { ConversationQueue } from "./components/ConversationQueue"
import { ConversationView } from "./components/ConversationView"
import { AgentMetrics } from "./components/AgentMetrics"
import { ReplyBar } from "./components/ReplyBar"
import { ReplyHelpers } from "./components/ReplyHelpers"   // ✅ import helpers
import { sendMessage } from "./hooks/useSendMessage"
import type { Conversation, ConversationMessage, FlowLog } from '~/modules/nodes/types'
import { PageSelector } from '~/modules/shared/components/PageSelector'

interface Stats {
  active: number
  avgResponse: string
  resolutionRate: number
  satisfaction: string
}

export function AgentDashboardModule({
  onSend,
  setActiveConversation,
}: {
  onSend: (msg: any) => void
  setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>
}) {

  const [activeConversation, _setActiveConversation] = useState<Conversation | null>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showHelpers, setShowHelpers] = useState(false)
  const [stats] = useState<Stats>({ active: 1, avgResponse: "1m", resolutionRate: 92, satisfaction: "★★★★☆" })
  const { currentPageId } = useFlowSession()
const [activeTab, setActiveTab] = useState<"messages" | "comments">("messages")
  // ✅ Local draft state for ReplyBar + ReplyHelpers
  const [draft, setDraft] = useState("")

  // ✅ Queue listener
  useEffect(() => {
    if (!currentPageId) return
    const queueRef = ref(db, `khmer-ai-chat/agent_queue/${currentPageId}`)
    const convListeners: Record<string, () => void> = {}

    const unsubscribeQueue = onValue(queueRef, snapshot => {
      const queueData = snapshot.val() || {}
      Object.values(queueData).forEach((conv: any) => {
        const userId = conv.user_id
        if (convListeners[userId]) return

        const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${userId}`)
        const unsubscribeConv = onValue(convRef, snap => {
          const convData = snap.val() || {}
          let lastMessage = ""
          if (convData.messages && Object.keys(convData.messages).length > 0) {
            const keys = Object.keys(convData.messages)
            const lastKey = keys[keys.length - 1]
            lastMessage = convData.messages[lastKey]?.text || ""
          }

          setConversations(prev => {
            const others = prev.filter(c => c.user_id !== userId)
            return [
              ...others,
              {
                id: conv.conversation_id,
                user_id: userId,
                customerName: convData.meta?.name || userId,
                avatar: convData.meta?.avatar || null,
                lastMessage: lastMessage || "(no messages yet)",
                status: convData.state || conv.state || "Waiting",
                timestamp: convData.updatedAt ?? Date.now() / 1000, // ✅ number
                routing: conv.routing,
                priority: conv.priority,
                messages: [] as ConversationMessage[],              // ✅ typed empty array
                flowLogs: [] as FlowLog[],                          // optional, but safe
              }
            ]
          })


        })
        convListeners[userId] = unsubscribeConv
      })
    })

    return () => {
      unsubscribeQueue()
      Object.values(convListeners).forEach(unsub => unsub())
    }
  }, [currentPageId])

  let activeMsgRef: ReturnType<typeof ref> | null = null
  let activeLogsRef: ReturnType<typeof ref> | null = null

  const handleSelectConversation = (conv: Conversation) => {
    console.log("▶️ handleSelectConversation called with conv:", conv)

    // Clean up old listeners
    if (activeMsgRef) {
      off(activeMsgRef)
      activeMsgRef = null
    }
    if (activeLogsRef) {
      off(activeLogsRef)
      activeLogsRef = null
    }

    // Reset active conversation
    const initialConv: Conversation = { ...conv, messages: [], flowLogs: [] }
    _setActiveConversation(initialConv)
    setActiveConversation(initialConv)

    // Messages listener
    const msgsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}/messages`)
    activeMsgRef = msgsRef

    onValue(msgsRef, snapshot => {
      const msgs: ConversationMessage[] = Object.entries(snapshot.val() || {}).map(([id, m]: any) => ({
        id,
        sender: m.sender,
        text: m.text,
        imageUrl: m.imageUrl,
        videoUrl: m.videoUrl,
        audioUrl: m.audioUrl,
        images: m.images || [],   // ✅ new grouped arrays
        videos: m.videos || [],
        audios: m.audios || [],
        timestamp: m.timestamp ?? Date.now() / 1000,
        time: m.timestamp ? new Date(m.timestamp * 1000).toLocaleTimeString() : undefined,
      }))
      console.log("📩 Parsed msgs:", msgs)

      const updated = (prev: Conversation | null) =>
        prev ? { ...prev, messages: msgs, flowLogs: prev.flowLogs } : { ...conv, messages: msgs, flowLogs: [] }

      _setActiveConversation(updated(activeConversation))
      setActiveConversation(updated(activeConversation))
    })

    onChildAdded(msgsRef, snapshot => {
      const m = snapshot.val()
      if (!m) return

      const newMsg: ConversationMessage = {
        id: snapshot.key!,
        sender: m.sender,
        text: m.text,
        imageUrl: m.imageUrl,
        videoUrl: m.videoUrl,
        audioUrl: m.audioUrl,
        images: m.images || [],   // ✅ new grouped arrays
        videos: m.videos || [],
        audios: m.audios || [],
        timestamp: m.timestamp ?? Date.now() / 1000,
        time: m.timestamp ? new Date(m.timestamp * 1000).toLocaleTimeString() : undefined,
      }
      console.log("➕ New message object:", newMsg)

      _setActiveConversation(prev =>
        prev
          ? {
            ...prev,
            messages: prev.messages.some(msg => msg.id === newMsg.id)
              ? prev.messages
              : [...prev.messages, newMsg],
            flowLogs: prev.flowLogs,
          }
          : { ...conv, messages: [newMsg], flowLogs: [] }
      )

      setActiveConversation(prev =>
        prev
          ? {
            ...prev,
            messages: prev.messages.some(msg => msg.id === newMsg.id)
              ? prev.messages
              : [...prev.messages, newMsg],
            flowLogs: prev.flowLogs,
          }
          : { ...conv, messages: [newMsg], flowLogs: [] }
      )
    })

    // FlowLogs listener
    const logsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}/flowLogs`)
    activeLogsRef = logsRef

    onValue(logsRef, snapshot => {
      const logs: FlowLog[] = Object.entries(snapshot.val() || {}).map(([id, l]: any) => ({
        id,
        name: l.name,
        timestamp: l.timestamp ?? Date.now() / 1000,
      }))
      console.log("📜 Parsed logs:", logs)

      _setActiveConversation(prev =>
        prev ? { ...prev, flowLogs: logs, messages: prev.messages ?? [] } : { ...conv, flowLogs: logs, messages: [] }
      )

      setActiveConversation(prev =>
        prev ? { ...prev, flowLogs: logs, messages: prev.messages ?? [] } : { ...conv, flowLogs: logs, messages: [] }
      )
    })
  }


  const handleSend = (msg: {
    type: "text" | "image" | "video" | "voice"
    text?: string
    imageUrl?: string
    videoUrl?: string
    audioUrl?: string
  }) => {
    if (!activeConversation) return
    const payload = {
      sender: "agent",
      type: msg.type,
      text: msg.text || "",
      imageUrl: msg.imageUrl,
      videoUrl: msg.videoUrl,
      audioUrl: msg.audioUrl,
      conversation: activeConversation,
    }
    onSend(payload)
  }


  if (!currentPageId) {
    return (
      <div className="flex justify-center items-start h-screen bg-dark-900">
        <div className="w-80 bg-dark-800 rounded-lg shadow-lg p-6 mt-24 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="i-mynaui:alert-circle text-teal-400 size-5" />
            <h2 className="text-light-100 text-base font-medium">
              Select a page to continue
            </h2>
          </div>
          <p className="text-light-300 text-xs">
            Choose from your available pages below
          </p>
          <PageSelector />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex grow h-0">
        {/* Queue Sidebar */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-t border-dark-600 bg-dark-800">
          <ConversationQueue
            conversations={conversations}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Conversation + Reply */}
        <div className="flex flex-col flex-grow h-full bg-dark-900">
          {/* Scrollable conversation view */}
          <div className="flex-grow overflow-y-auto">
            <ConversationView
              conversation={activeConversation}
              currentPageId={currentPageId}
              onSend={handleSend}
            />
          </div>

          {/* Reply helpers toggle + bar */}
          <div className="sticky bottom-0 bg-dark-900 border-t border-dark-600">
            {/* Helpers (hidden until toggle) */}
            {showHelpers && (
              <ReplyHelpers
                setDraft={setDraft}
                activeConversation={activeConversation}
              />
            )}

            {/* Toggle helpers */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowHelpers(!showHelpers)}
                className="appearance-none bg-transparent border-none outline-none cursor-pointer text-light-400 hover:text-teal-400 transition-transform duration-300"
                aria-label="Toggle reply helpers"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transform transition-transform duration-300 ${showHelpers ? "rotate-180" : "rotate-0"
                    }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>


{/* Tab bar */}
    <div className="flex border-b border-dark-600">
      <button
        onClick={() => setActiveTab("messages")}
        className={`flex-1 py-2 text-center ${
          activeTab === "messages"
            ? "text-teal-400 border-b-2 border-teal-400"
            : "text-light-400 hover:text-teal-400"
        }`}
      >
        Messages
      </button>
      <button
        onClick={() => setActiveTab("comments")}
        className={`flex-1 py-2 text-center ${
          activeTab === "comments"
            ? "text-teal-400 border-b-2 border-teal-400"
            : "text-light-400 hover:text-teal-400"
        }`}
      >
        Comments
      </button>
    </div>

    {/* Timeline */}
    {/* <div className="flex-1 overflow-y-auto p-4">
      {activeTab === "messages" ? (
        <MessageTimeline messages={conversation.messages} />
      ) : (
        <CommentTimeline comments={conversation.comments} />
      )}
    </div> */}


            {/* Reply bar */}
            <ReplyBar
              draft={draft}
              setDraft={setDraft}
              onSend={msg => {
                if (activeConversation) {
                  sendMessage(currentPageId, activeConversation, msg)
                  setDraft("") // clear after sending
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

