import type { ConversationReport, Conversation } from "~/modules/nodes/types"

export function exportToCSV(conversations: Conversation[]) {
  const reports: ConversationReport[] = conversations.map(conv => ({
    id: conv.id,
    customerName: conv.customerName,
    agentName: "Agent A", // or from metadata
    startTime: conv.messages[0]?.timestamp ?? Date.now()/1000,
    endTime: conv.messages.at(-1)?.timestamp ?? Date.now()/1000,
    status: "open", // ✅ fixed: no conv.state
    messages: conv.messages
  }))

  // then use reports in your CSV logic
  const header = ["Conversation ID","Customer","Agent","Status","Start","End","Message Count"]
  const rows = reports.map(c => [
    c.id,
    c.customerName,
    c.agentName,
    c.status,
    new Date(c.startTime * 1000).toLocaleString(),
    new Date(c.endTime * 1000).toLocaleString(),
    c.messages.length
  ])

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [header.join(","), ...rows.map(r => r.join(","))].join("\n")

  const link = document.createElement("a")
  link.href = encodeURI(csvContent)
  link.download = "conversation_report.csv"
  link.click()
}
