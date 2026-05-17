
import React from "react"
import type {ConversationMessage } from '~/modules/nodes/types'

export function MessageTimeline({ messages }: { messages: ConversationMessage[] }) {
  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <div key={m.id} className={`flex ${m.sender === "agent" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-xs px-3 py-2 rounded-lg ${
              m.sender === "agent" ? "bg-teal-600 text-white" : "bg-dark-700 text-light-300"
            }`}
          >
            {m.text}
            <div className="text-xs text-light-400 mt-1">
              {new Date(m.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
