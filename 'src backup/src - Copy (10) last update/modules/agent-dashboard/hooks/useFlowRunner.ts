import { useCallback } from "react"
import { useFlowSession } from "~/stores/flow-session"

export function useFlowRunner() {
  const { currentPageId } = useFlowSession()

  const runFlow = useCallback(
    async (flowId: string, userId: string, extraPayload?: Record<string, any>) => {
      if (!currentPageId || !flowId || !userId) {
        console.warn("Missing parameters for flow trigger")
        return { error: "Missing parameters" }
      }
        // 3️⃣ Deliver to Messenger via backend webhook
  // ⚠️ IMPORTANT: replace with your deployed Cloud Function URL


      try {
        const webhookUrl = "https://asia-east2-khmer-catalog.cloudfunctions.net/khmer_aichatbot"

        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page_id: currentPageId,
            user_id: userId,
            flow_id: flowId,
            // send_message_handler: true,
            ...extraPayload, // optional extra data
          }),
        })

        const data = await res.json()
        console.log("[🔀 Flow Trigger]", data)
        return data
      } catch (err) {
        console.error("Error triggering flow:", err)
        return { error: String(err) }
      }
    },
    [currentPageId]
  )

  return { runFlow }
}
