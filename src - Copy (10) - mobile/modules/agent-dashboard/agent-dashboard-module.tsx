// import { useEffect, useState } from "react"
// import { ref, onValue, onChildAdded, off } from "firebase/database"
// import { db } from "~/lib/firebase"
// import { useFlowSession } from "~/stores/flow-session"
// import type {
//   Conversation,
//   ConversationMessage,
//   FlowLog,
//   PostData,
// } from "~/modules/nodes/types"
// import { ConversationQueue } from "~/modules/agent-dashboard/components/conversation-queue"
// import { ConversationView } from "~/modules/agent-dashboard/components/conversation-view"
// import { CommentTimeline } from "~/modules/agent-dashboard/components/comment-timeline"
// import { ReplyBar } from "~/modules/agent-dashboard/components/reply-bar"
// import { ReplyHelpers } from "~/modules/agent-dashboard/components/reply-helpers"
// import { sendMessage, sendCommentReply } from "~/modules/agent-dashboard/hooks/useSendMessage"


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
import type { Conversation, ConversationMessage, FlowLog, PostData, ConversationStatus } from '~/modules/nodes/types'
import { PageSelector } from '~/modules/shared/components/PageSelector'
import { CommentTimeline } from "./components/CommentTimeline"
import { sendCommentReply } from "./hooks/sendCommentReply"

export function AgentDashboardModule({
  onSend,
  setActiveConversation,
  pageToken,
}: {
  onSend: (msg: any) => void
  setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>
  pageToken: string
}) {
  const [activeConversation, _setActiveConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showHelpers, setShowHelpers] = useState(false)
  const { currentPageId } = useFlowSession()
  const [activeTab, setActiveTab] = useState<"messages" | "comments">("messages")
  const [draft, setDraft] = useState("")

  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [selectedCommentText, setSelectedCommentText] = useState<string | null>(null)
  const [selectedPostTitle, setSelectedPostTitle] = useState<string | null>(null)

  const handleCancelReply = () => {
    setSelectedCommentId(null)
    setSelectedPostId(null)
    setSelectedCommentText(null)
    setSelectedPostTitle(null)
  }

  function normalizeStatus(raw: string | undefined): ConversationStatus {
    switch (raw) {
      case "WAITING_CONVERSATION":
      case "Waiting":
        return "Waiting"
      case "AGENT_HANDLING":
      case "Agent active":
        return "Agent active"
      case "BOT_HANDLING":
      case "Bot active":
        return "Bot active"
      case "PENDING":
      case "Pending":
        return "Pending"
      default:
        return "Waiting" // fallback
    }
  }


  // ✅ Queue listener
  useEffect(() => {
    if (!currentPageId) return
    const queueRef = ref(db, `khmer-ai-chat/agent_queue/${currentPageId}`)
    const convListeners: Record<string, () => void> = {}

    const unsubscribeQueue = onValue(queueRef, snapshot => {
      const queueData = snapshot.val() || {}

      Object.values(queueData).forEach((conv: any) => {
        const conversationId = conv.conversation_id
        if (!conversationId) return

        // Avoid duplicate listeners
        if (convListeners[conversationId]) return

        // ✅ Use conversation_id here, not user_id
        const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conversationId}`)
        const unsubscribeConv = onValue(convRef, snap => {
          const convData = snap.val() || {}

          // 🔹 Debug logs
          console.log("📥 Raw convData:", convData)
          console.log("➡️ meta:", convData.meta)
          console.log("➡️ lastMessage:", convData.lastMessage)
          console.log("➡️ status:", convData.status, "state:", conv.state)

          setConversations(prev => {
            const others = prev.filter(c => c.id !== conversationId)
            const newConv: Conversation = {
              id: conversationId,
              user_id: conv.user_id,
              customerName: convData.meta?.name || conv.user_id,
              avatar: convData.meta?.avatar || null,
              lastMessage: convData.lastMessage || "(no messages yet)",
              status: normalizeStatus(convData.status || conv.state),
              timestamp: convData.updatedAt ?? Date.now() / 1000,
              routing: conv.routing,
              priority: conv.priority,
              type: conv.type,
              messages: Object.values(convData.messages || {}),
              flowLogs: Object.values(convData.flowLogs || {}),
              posts: Object.values(convData.posts || {}),
            }

            console.log("✅ Built Conversation:", newConv)

            return [...others, newConv]
          })
        })


        convListeners[conversationId] = unsubscribeConv
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

    if (activeMsgRef) {
      off(activeMsgRef)
      activeMsgRef = null
    }
    if (activeLogsRef) {
      off(activeLogsRef)
      activeLogsRef = null
    }

    const initialConv: Conversation = { ...conv, messages: [], flowLogs: [], posts: [] }
    _setActiveConversation(initialConv)
    setActiveConversation(initialConv)

    // Posts + Comments listener
    const postsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}/posts`)
    onValue(postsRef, snapshot => {
      const postsData = snapshot.val() || {}
      const posts: PostData[] = Object.entries(postsData).map(([postId, postData]: any) => ({
        id: postId,
        post: postData.post || { id: postId, title: "Untitled" },
        comments: Object.entries(postData.comments || {}).map(([commentId, c]: any) => ({
          id: commentId,
          userName: c.userName,
          text: c.text,
          timestamp: c.timestamp ?? Date.now() / 1000,
          permalink: c.permalink,
          parent_id: c.parent_id,
          post_id: c.post_id,
          replies: Object.entries(c.replies || {}).map(([rid, r]: any) => ({
            id: rid,
            userName: r.userName,
            text: r.text,
            timestamp: r.timestamp ?? Date.now() / 1000,
            permalink: r.permalink,
            replies: [],
          })),
        })),
      }))
      _setActiveConversation(prev => prev ? { ...prev, posts } : { ...conv, posts, messages: [], flowLogs: [] })
      setActiveConversation(prev => prev ? { ...prev, posts } : { ...conv, posts, messages: [], flowLogs: [] })
    })

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
        images: m.images || [],
        videos: m.videos || [],
        audios: m.audios || [],
        timestamp: m.timestamp ?? Date.now() / 1000,
        time: m.timestamp ? new Date(m.timestamp * 1000).toLocaleTimeString() : undefined,
      }))
      _setActiveConversation(prev => prev ? { ...prev, messages: msgs } : { ...conv, messages: msgs, flowLogs: [], posts: [] })
      setActiveConversation(prev => prev ? { ...prev, messages: msgs } : { ...conv, messages: msgs, flowLogs: [], posts: [] })
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
        images: m.images || [],
        videos: m.videos || [],
        audios: m.audios || [],
        timestamp: m.timestamp ?? Date.now() / 1000,
        time: m.timestamp ? new Date(m.timestamp * 1000).toLocaleTimeString() : undefined,
      }
      _setActiveConversation(prev =>
        prev ? { ...prev, messages: prev.messages.some(msg => msg.id === newMsg.id) ? prev.messages : [...prev.messages, newMsg] }
          : { ...conv, messages: [newMsg], flowLogs: [], posts: [] }
      )
      setActiveConversation(prev =>
        prev ? { ...prev, messages: prev.messages.some(msg => msg.id === newMsg.id) ? prev.messages : [...prev.messages, newMsg] }
          : { ...conv, messages: [newMsg], flowLogs: [], posts: [] }
      )
    })

    // ✅ FlowLogs listener
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
        prev ? { ...prev, flowLogs: logs } : { ...conv, flowLogs: logs, messages: [], posts: [] }
      )
      setActiveConversation(prev =>
        prev ? { ...prev, flowLogs: logs } : { ...conv, flowLogs: logs, messages: [], posts: [] }
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
        <div className="w-80 flex-shrink-0 overflow-y-auto border-t border-dark-600 bg-dark-800">
          <ConversationQueue
            conversations={conversations}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Conversation + Reply */}
        <div className="flex flex-col flex-grow h-full bg-dark-900">
          {/* Tab bar */}
          <div className="flex border-b border-dark-600">
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex-1 py-2 text-center ${activeTab === "messages"
                ? "text-teal-400 border-b-2 border-teal-400"
                : "text-light-400 hover:text-teal-400"
                }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`flex-1 py-2 text-center ${activeTab === "comments"
                ? "text-teal-400 border-b-2 border-teal-400"
                : "text-light-400 hover:text-teal-400"
                }`}
            >
              Comments
            </button>
          </div>

          {/* Timeline */}
          <div className="flex-grow overflow-y-auto p-4">
            {activeTab === "messages" ? (
              <ConversationView
                conversation={activeConversation}
                currentPageId={currentPageId}
                onSend={handleSend}
              />
            ) : (
              <div className="space-y-8">
                {activeConversation?.posts?.map((p) => (
                  <CommentTimeline
                    key={p.id}
                    post={p.post}
                    comments={p.comments}
                    onSelectComment={(commentId, postId, commentText) => {
                      setSelectedCommentId(commentId)
                      setSelectedPostId(postId)
                      setSelectedCommentText(commentText)
                      setSelectedPostTitle(p.post.title)
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Reply helpers toggle + bar */}
          <div className="sticky bottom-0 bg-dark-900 border-t border-dark-600">
            {showHelpers && (
              <ReplyHelpers
                setDraft={setDraft}
                activeConversation={activeConversation}
              />
            )}

            <div className="flex justify-center">
              <button
                onClick={() => setShowHelpers(!showHelpers)}
                className="appearance-none bg-transparent border-none outline-none cursor-pointer text-light-400 hover:text-teal-400 transition-transform duration-300"
                aria-label="Toggle reply helpers"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transform transition-transform duration-300 ${showHelpers ? "rotate-180" : "rotate-0"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>

            <ReplyBar
              draft={draft}
              setDraft={setDraft}
              pageId={currentPageId!}
              pageToken={pageToken}
              activeConversation={activeConversation}
              activeTab={activeTab}
              selectedCommentId={selectedCommentId}
              postId={selectedPostId}
              postTitle={selectedPostTitle}
              commentText={selectedCommentText}
              onSendMessage={sendMessage}
              onSendCommentReply={(commentId, msg, token, postId) => {
                if (!activeConversation || !postId) return
                sendCommentReply(
                  commentId,
                  msg,
                  token,
                  currentPageId!,
                  activeConversation.user_id,
                  postId
                )
              }}
              onCancelReply={handleCancelReply}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
