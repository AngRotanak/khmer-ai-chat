import { ref, push, update } from "firebase/database"
import { db } from "~/lib/firebase"
import type { Conversation } from '~/modules/nodes/types'

export async function logFlowTrigger(pageId: string, conversation: Conversation, flowId: string, flowName: string) {
  if (!conversation || !pageId || !flowId) return

  const logsRef = ref(
    db,
    `khmer-ai-chat/pages/${pageId}/conversations/${conversation.user_id}/flowLogs`
  )

  // 1️⃣ Store flow log in Firebase
  await push(logsRef, {
    id: flowId,
    name: flowName,
    timestamp: Date.now() / 1000
  })

  // 2️⃣ Update conversation metadata
  const convRef = ref(db, `khmer-ai-chat/pages/${pageId}/conversations/${conversation.user_id}`)
  await update(convRef, {
    updatedAt: Date.now() / 1000
  })
}
