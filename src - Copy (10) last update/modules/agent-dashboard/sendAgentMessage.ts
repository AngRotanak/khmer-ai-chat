import { ref, push, set } from "firebase/database"
import { db } from "~/lib/firebase"

export async function sendAgentMessage(pageId: string, userId: string, text: string) {
  const msgRef = push(ref(db, `pages/${pageId}/conversations/${userId}/messages`))

  await set(msgRef, {
    sender: "agent",
    text,
    timestamp: Date.now()
  })
}
