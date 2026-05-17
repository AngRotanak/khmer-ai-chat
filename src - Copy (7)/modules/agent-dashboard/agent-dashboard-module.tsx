import { useEffect, useState } from "react"
import { ref, onChildAdded, onValue, off } from "firebase/database"
import { db } from "~/lib/firebase"
import { useFlowSession } from '~/stores/flow-session'

import { ConversationQueue } from "./components/ConversationQueue"
import { ConversationView } from "./components/ConversationView"
import { AgentMetrics } from "./components/AgentMetrics"
import { ReplyBar } from "./components/ReplyBar"
import { ReplyHelpers } from "./components/ReplyHelpers"
import type { Conversation } from '~/modules/nodes/types'
import { toast } from "sonner"
import { PageSelector } from '~/modules/shared/components/PageSelector'
import { useRef } from "react"

interface Stats {
  active: number
  avgResponse: string
  resolutionRate: number
  satisfaction: string
}

export function AgentDashboardModule({
  onSend,
  setActiveConversation,   // parent callback
}: {
  onSend: (msg: any) => void
  setActiveConversation: (conv: Conversation | null) => void
}) {
  const [activeConversation, _setActiveConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [stats] = useState<Stats>({
    active: 1,
    avgResponse: "1m",
    resolutionRate: 92,
    satisfaction: "★★★★☆",
  })
  const { currentPageId } = useFlowSession()
  const [draft, setDraft] = useState("")

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

  useEffect(() => {
    if (activeConversation) {
      setActiveConversation(activeConversation) // ✅ safe: runs after render
    }
  }, [activeConversation])

useEffect(() => {
  if (activeConversation) {
    setActiveConversation(activeConversation) // parent update after render
  }
}, [activeConversation])


  useEffect(() => {
    toast.success("✅ Test toast from AgentDashboardModule")
  }, [])

  // Queue listener
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
                timestamp: convData.updatedAt ?? Date.now() / 1000,  // ✅ number
                routing: conv.routing,
                priority: conv.priority,
                messages: [],
              },
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
  const _latestConvRef = useRef<Conversation | null>(null)

const [, setLocalConversation] = useState<Conversation | null>(null)

const handleSelectConversation = (conv: Conversation) => {
  console.log("▶️ handleSelectConversation called with:", conv)
  setLocalConversation(conv) // local only

  if (!currentPageId) {
    console.warn("No currentPageId available")
    return
  }

  const msgsRef = ref(
    db,
    `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/messages`
  )

  onValue(msgsRef, snapshot => {
    const msgs = Object.entries(snapshot.val() || {}).map(([id, m]: any) => ({
      id,
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp ?? Math.floor(Date.now() / 1000),
    }))
    const updatedConv = { ...conv, messages: msgs }
    setLocalConversation(updatedConv) // local only
  })
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
        {/* Queue */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-t border-dark-600">
          <ConversationQueue
            conversations={conversations}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Conversation + Reply */}
        <div className="flex flex-col grow h-full">
          <div className="flex-grow overflow-y-auto">
            <ConversationView
              conversation={activeConversation}
              currentPageId={currentPageId}
              onSend={handleSend}
            />
          </div>

          <div className="sticky bottom-0 bg-dark-900 border-t border-dark-600">
            <ReplyHelpers
              setDraft={setDraft}
              activeConversation={activeConversation}
            />
            <ReplyBar
              draft={draft}
              setDraft={setDraft}
              onSend={(msg) => handleSend(msg)}
            />
          </div>
        </div>
      </div>

      <AgentMetrics stats={stats} />
    </div>
  )
}
