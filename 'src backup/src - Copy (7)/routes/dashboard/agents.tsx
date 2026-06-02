import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'

import { db } from '~/lib/firebase'
import { NavigationBarModule } from '~/modules/navigation-bar/navigation-bar-module'
import { AgentSidebarFragment } from '~/modules/sidebar/fragments/agents-sidebar-Fragment'
import { AgentDashboardModule } from '~/modules/agent-dashboard/agent-dashboard-module'
import { useAuthStore } from '~/stores/auth-store'
import { useApplicationState } from '~/stores/application-state'
import { useAgentStats } from '~/modules/agent-dashboard/hooks/useAgentStats'
import { sendMessage } from '~/modules/agent-dashboard/hooks/useSendMessage'   // ✅ import your sendMessage
import { useFlowSession } from '~/stores/flow-session'   // ✅ import this
import type { Conversation } from '~/modules/nodes/types'

export const Route = createFileRoute('/dashboard/agents')({
  component: AgentDashboardPage,
})


function AgentDashboardPage() {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)

  const { activePanel, setActivePanel } = useApplicationState(s => ({
    activePanel: s.agentSidebar.active,
    setActivePanel: s.actions.agentSidebar.setActivePanel,
  }))
  const [, setPages] = useState<{ id: string; name: string }[]>([])

  useAgentStats()
  const { currentPageId } = useFlowSession()


  const navigate = useNavigate()
  const { user, token, restore } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restore()
    const timeout = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!loading) {
      if (!token) {
        navigate({ to: '/login' })
      } else if (user?.role !== 'agent' && user?.role !== 'admin') {
        navigate({ to: '/unauthorized' })
      }
    }
  }, [loading, token, user?.role, navigate])

  // ✅ Load available pages from Firebase
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

  // ✅ Central send function
  const onSend = (msg: any) => {
    if (!currentPageId || !msg.conversation) return
    console.log("Sending message:", msg)
    sendMessage(currentPageId, msg.conversation, msg.text || "", msg)
  }


  if (loading || !token || (user?.role !== 'agent' && user?.role !== 'admin')) return null

  return (
    <HelmetProvider>
      <Helmet>
        <title>KhmerAi.Chat Agent Dashboard</title>
      </Helmet>

      <div className="flex flex-col h-screen">
        <NavigationBarModule />

        <div className="flex flex-col grow overflow-hidden divide-y divide-light-300 dark:divide-dark-600">
          {/* Main content */}
          <div className="flex grow overflow-hidden divide-x divide-light-300 dark:divide-dark-600">
            <div className="flex flex-col flex-grow">
              {/* Conversation workspace */}
              <AgentDashboardModule
                onSend={onSend}
                setActiveConversation={setActiveConversation}
              />

            </div>

            {/* Sidebar tools */}
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
}
