import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'

import { db } from '~/lib/firebase'
import { NavigationBarModule } from '~/modules/navigation-bar/navigation-bar-module'
import { AgentSidebarFragment } from '~/modules/sidebar/fragments/agents-sidebar-Fragment'
import { AgentDashboard } from '~/modules/agent-dashboard/components/AgentDashboard'
import { useAuthStore } from '~/stores/auth-store'
import { useApplicationState } from '~/stores/application-state'
import { useAgentStats } from '~/modules/agent-dashboard/hooks/useAgentStats'
import { sendReplyBarMessage } from '~/modules/agent-dashboard/hooks/useSendMessage'
import { useFlowSession } from '~/stores/flow-session'
import type { Conversation } from '~/modules/nodes/types'

export const Route = createFileRoute('/dashboard/agents')({
  component: AgentDashboardPage,
})


function AgentDashboardPage() {
  // 🔹 Sidebar state (which panel is active)
  const { activePanel, setActivePanel } = useApplicationState(s => ({
    activePanel: s.agentSidebar.active,
    setActivePanel: s.actions.agentSidebar.setActivePanel,
  }))
  

  // 🔹 Pages loaded from Firebase
  const [, setPages] = useState<{ id: string; name: string }[]>([])

  // 🔹 Currently selected conversation
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  // 🔹 Agent stats hook
  useAgentStats()

  // 🔹 Current page context (for sending messages)
  const { currentPageId, pageToken,  } = useFlowSession()

  const navigate = useNavigate()
  const { user, token, restore } = useAuthStore()
  const [loading, setLoading] = useState(true)

  // 🔹 Restore auth state on mount
  useEffect(() => {
    restore()
    const timeout = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timeout)
  }, [])

  // 🔹 Redirect if not logged in or unauthorized
  useEffect(() => {
    if (!loading) {
      if (!token) {
        navigate({ to: '/login' })
      } else if (user?.role !== 'agent' && user?.role !== 'admin') {
        navigate({ to: '/unauthorized' })
      }
    }
  }, [loading, token, user?.role, navigate])

  // 🔹 Load available pages from Firebase
  useEffect(() => {
    if (!user?.id) return
    const pagesRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages`)
    return onValue(pagesRef, snapshot => {
      const data = snapshot.val()
      if (data) {
        const loaded = Object.entries(data).map(([id, value]) => ({
          id,
          name: (value as any).name,
        }))
        setPages(loaded)
      }
    })
  }, [user?.id])

  // 🔹 Block rendering until auth is ready
  if (loading || !token || (user?.role !== 'agent' && user?.role !== 'admin')) return null

  // 🔹 Central send function (used by dashboard + sidebar)
  const onSend = (msg: any) => {
    if (!currentPageId || !msg.conversation) return
    console.log("Sending message:", msg)
    sendReplyBarMessage(currentPageId, msg.conversation, msg.text || "", msg)
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>KhmerAi.Chat Agent Dashboard</title>
      </Helmet>

      {/* 🔹 Full height layout */}
      <div className="flex flex-col h-screen">
        <NavigationBarModule />

        {/* 🔹 Main split layout: dashboard + sidebar */}
        <div className="flex flex-col grow overflow-hidden divide-y divide-light-300 dark:divide-dark-600">
          <div className="flex grow overflow-hidden divide-x divide-light-300 dark:divide-dark-600">
            {/* Conversation workspace (Messenger-style scroll) */}
            <div className="flex flex-col flex-grow overflow-y-auto scrollbar-dark-teal">
               <AgentDashboard
              onSend={onSend}
              setActiveConversation={setActiveConversation}
              pageToken={pageToken ?? ''}
            />
            </div>

            {/* Sidebar tools (scrollable if tall) */}
            <AgentSidebarFragment
              activePanel={activePanel}
              setActivePanel={setActivePanel}
              onSend={onSend}
              activeConversation={activeConversation}
            />
          </div>
        </div>
      </div>
    </HelmetProvider>
  )



  // return (
  //   <HelmetProvider>
  //     <Helmet>
  //       <title>KhmerAi.Chat Agent Dashboard</title>
  //     </Helmet>

  //     {/* Full height layout, no global scroll */}
  //     <div className="flex flex-col h-screen overflow-hidden">
  //       <NavigationBarModule />

  //       {/* Main split layout */}
  //       <div className="flex grow divide-x divide-light-300 dark:divide-dark-600 overflow-hidden">
  //         {/* Conversation workspace */}
  //         <div className="flex flex-col flex-grow bg-dark-900 overflow-hidden">
  //           <AgentDashboard
  //             onSend={onSend}
  //             setActiveConversation={setActiveConversation}
  //             pageToken={pageToken ?? ''}
  //           />
  //         </div>

  //         {/* Sidebar tools (fixed) */}
  //         <div className="shrink-0 h-screen">
  //           <AgentSidebarFragment
  //             activePanel={activePanel}
  //             setActivePanel={setActivePanel}
  //             onSend={onSend}
  //             activeConversation={activeConversation}
  //           />
  //         </div>
  //       </div>
  //     </div>
  //   </HelmetProvider>
  // )

}
