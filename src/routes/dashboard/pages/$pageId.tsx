import { AgentDashboard } from '~/modules/agent-dashboard/components/AgentDashboard'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { Conversation } from '~/modules/nodes/types'

export const Route = createFileRoute('/dashboard/pages/$pageId')({
  component: PageDashboard,
})

function PageDashboard() {
  const { pageId } = Route.useParams()
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)

  return (
    <div className="p-6 text-light-100">
      <h1 className="text-xl font-bold">Page ID: {pageId}</h1>
      <AgentDashboard
        activeConversation={activeConversation}          // ✅ pass state value
        setActiveConversation={setActiveConversation}    // ✅ pass setter
        pageToken={pageId}                               // ✅ pass pageId as pageToken
      />
    </div>
  )
}
