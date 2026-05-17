import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { ToasterModule } from '~/modules/toaster/toaster-module'
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
import { MobileAgentBar } from '~/modules/agent-dashboard/components/mobile-agent-bar'

export const Route = createFileRoute('/dashboard/agents')({
  component: AgentDashboardPage,
})

function AgentDashboardPage() {
  const {
    activePanel,
    setActivePanel,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    theme,
  } = useApplicationState((s) => ({
    activePanel: s.agentSidebar.active,
    setActivePanel: s.actions.agentSidebar.setActivePanel,
    activeTab: s.agentData.activeTab,
    setActiveTab: s.actions.agentData.setActiveTab,
    viewMode: s.agentData.viewMode,
    setViewMode: s.actions.agentData.setViewMode,
    theme: s.settings.theme,
  }))

  const [, setPages] = useState<{ id: string; name: string }[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)

  useAgentStats()
  const { currentPageId, pageToken } = useFlowSession()

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

  useEffect(() => {
    if (!user?.id) return
    const pagesRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages`)
    return onValue(pagesRef, (snapshot) => {
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

  if (loading || !token || (user?.role !== 'agent' && user?.role !== 'admin')) return null

  const onSend = (msg: any) => {
    if (!currentPageId || !msg.conversation) return
    console.log('Sending message:', msg)
    sendReplyBarMessage(currentPageId, msg.conversation, msg.text || '', msg)
  }


  return (
    <HelmetProvider>
      <Helmet>
        <title>KhmerAi.Chat Agent Dashboard</title>
      </Helmet>

      {/* Root wrapper with theme */}
      <div className={`flex flex-col h-screen ${theme === 'dark' ? 'dark' : 'light'}`}>
        <NavigationBarModule />

        {/* Main split area */}
        <div className="flex flex-col grow overflow-hidden divide-y divide-light-300 dark:divide-dark-600">
          <div className="flex grow overflow-hidden divide-x divide-light-300 dark:divide-dark-600">

            {/* Desktop: dashboard content */}
            <div className="hidden md:flex flex-col flex-grow overflow-y-auto scrollbar-dark-teal">
              <AgentDashboard
                activeConversation={activeConversation}   // pass value
                setActiveConversation={setActiveConversation} // pass setter
                pageToken={pageToken ?? ''}
              />
            </div>

            {/* Desktop: sidebar fragment with full height */}
            <aside className="hidden md:flex flex-col  border-l border-dark-600 bg-dark-900 h-full">
              <AgentSidebarFragment
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                onSend={onSend}
                activeConversation={activeConversation}
              />
            </aside>

            {/* Mobile layout */}
            <div className="flex md:hidden flex-col flex-grow overflow-y-auto">
              <AgentDashboard
                activeConversation={activeConversation}   // pass value
                setActiveConversation={setActiveConversation} // pass setter
                pageToken={pageToken ?? ''}
              />
            </div>
          </div>

          {/* Mobile floating bar */}
          {viewMode === "queue" && (
            <div className="md:hidden">
              <MobileAgentBar
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setViewMode={setViewMode}
              />
            </div>
          )}
        </div>
         {/* ✅ Add ToasterModule here so toast calls render */}
        <ToasterModule />
      </div>
    </HelmetProvider>
  )

}
