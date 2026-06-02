import { ref, update, remove, onValue } from "firebase/database"
import { db } from "~/lib/firebase"
import type { Conversation } from '~/modules/nodes/types'

// 🔹 Agent takes over conversation
export function takeOverConversation(pageId: string, conversation: Conversation) {
  if (!pageId || !conversation?.user_id) return
  const convRef = ref(db, `khmer-ai-chat/pages/${pageId}/conversations/${conversation.user_id}`)
  update(convRef, {
    state: "AGENT_HANDLING",
    updatedAt: Date.now() / 1000
  })
}

// 🔹 Return control to bot
export function returnToBot(pageId: string, conversation: Conversation) {
  if (!pageId || !conversation?.user_id) return
  const convRef = ref(db, `khmer-ai-chat/pages/${pageId}/conversations/${conversation.user_id}`)
  update(convRef, {
    state: "BOT_HANDLING",
    updatedAt: Date.now() / 1000
  })
}

// 🔹 Close conversation (mark resolved + cleanup queue)
export function closeConversation(pageId: string, conversation: Conversation) {
  if (!pageId || !conversation?.user_id) return
  const convRef = ref(db, `khmer-ai-chat/pages/${pageId}/conversations/${conversation.user_id}`)
  update(convRef, {
    state: "BOT_HANDLING",
    updatedAt: Date.now() / 1000
  })

  // Optionally remove from queue
  const queueRef = ref(db, `khmer-ai-chat/agent_queue/${pageId}/${conversation.user_id}`)
  remove(queueRef)
}
