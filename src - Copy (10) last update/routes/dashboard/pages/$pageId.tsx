// import { createFileRoute } from '@tanstack/react-router'
// import { FlowBuilderModule } from '~/modules/flow-builder/flow-builder-module'

// export const Route = createFileRoute('/dashboard/pages/$pageId')({
//   component: PageDashboard,
// })

// function PageDashboard() {
//   const { pageId } = Route.useParams() // ✅ This must match the $pageId in the filename

//   return (
//     <div className="h-screen bg-dark-900 text-light-100">
//       <h1 className="text-xl font-bold p-4">Page ID: {pageId}</h1>
//       <FlowBuilderModule pageId={pageId} />
//     </div>
//   )
// }

import { AgentDashboard } from '~/modules/agent-dashboard/components/AgentDashboard'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { Conversation } from '~/modules/nodes/types'

export const Route = createFileRoute('/dashboard/pages/$pageId')({
  component: PageDashboard,
})

function PageDashboard() {
  const { pageId } = Route.useParams()
  const [, setActiveConversation] = useState<Conversation | null>(null)

  return (
    <div className="p-6 text-light-100">
      <h1 className="text-xl font-bold">Page ID: {pageId}</h1>
      <AgentDashboard
        setActiveConversation={setActiveConversation}
        pageToken={pageId}   // ✅ pass pageId as pageToken
      />
    </div>
  )
}
