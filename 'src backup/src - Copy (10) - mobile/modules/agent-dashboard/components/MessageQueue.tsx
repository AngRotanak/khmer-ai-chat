import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import { db } from "~/lib/firebase"
import { PageSelector } from '~/modules/shared/components/PageSelector'

interface MessageQueueProps {
  pageId: string
  setActiveConversation: (conv: any) => void
}

interface MessageQueueProps {
  conversations: Conversation[]
  onSelect: (conv: Conversation) => void
}

export function MessageQueue({ conversations, onSelect }: MessageQueueProps) {

export function MessageQueue({ pageId, setActiveConversation }: MessageQueueProps) {
  const [conversations, setConversations] = useState<any[]>([])

  useEffect(() => {
    const convRef = ref(db, `khmer-ai-chat/pages/${pageId}/conversations`)
    const unsubscribe = onValue(convRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        const convList = Object.entries(data).map(([userId, conv]) => {
          // 🔹 Find last message from messages branch
          let lastMessage = ""
          if (conv.messages) {
            const msgEntries = Object.entries(conv.messages)
            if (msgEntries.length > 0) {
              const [msgId, msg] = msgEntries[msgEntries.length - 1]
              lastMessage = msg.text || ""
            }
          }

          return {
            userId,
            ...conv,
            lastMessage,
          }
        })
        setConversations(convList)
      } else {
        setConversations([])
      }
    })
    return () => unsubscribe()
  }, [pageId])

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Page selector header */}
      <div className="p-2 border-b border-teal-700 bg-dark-800">
        <PageSelector />
      </div>

      {conversations.map((conv) => (
        <button
          key={conv.userId}
          onClick={() => setActiveConversation(conv)} // ✅ pass full conv object
          className="p-3 border-b border-dark-700 hover:bg-dark-600 text-left"
        >
          <div className="font-semibold text-light-100">
            {conv.meta?.name || conv.userId}
          </div>
          <div className="text-sm text-light-400 truncate">
            {conv.lastMessage || "…"}
          </div>
        </button>
      ))}
    </div>
  )
}
