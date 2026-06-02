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
  const { activePanel, setActivePanel } = useApplicationState(s => ({
    activePanel: s.agentSidebar.active,
    setActivePanel: s.actions.agentSidebar.setActivePanel,
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

  if (loading || !token || (user?.role !== 'agent' && user?.role !== 'admin')) return null

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

      <div className="flex flex-col h-screen">
        <NavigationBarModule />

        {/* Desktop layout */}
        <div className="hidden md:flex flex-col grow overflow-hidden divide-y divide-light-300 dark:divide-dark-600">
          <div className="flex grow overflow-hidden divide-x divide-light-300 dark:divide-dark-600">
            <div className="flex flex-col flex-grow overflow-y-auto scrollbar-dark-teal">
              <AgentDashboard
                onSend={onSend}
                setActiveConversation={setActiveConversation}
                pageToken={pageToken ?? ''}
              />
            </div>
            <AgentSidebarFragment
              activePanel={activePanel}
              setActivePanel={setActivePanel}
              onSend={onSend}
              activeConversation={activeConversation}
            />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex md:hidden flex-col grow overflow-hidden">
          {/* Conversation full screen */}
          <div className="flex flex-col flex-grow overflow-y-auto scrollbar-dark-teal">
            <AgentDashboard
              onSend={onSend}
              setActiveConversation={setActiveConversation}
              pageToken={pageToken ?? ''}
            />
          </div>

          {/* Bottom navigation bar */}
          <div className="flex justify-around bg-dark-700 border-t border-dark-600 p-2">
            <button
              onClick={() => setActivePanel("templates")}
              className={`flex flex-col items-center text-xs ${
                activePanel === "templates" ? "text-teal-400" : "text-light-300"
              }`}
            >
              📑 Templates
            </button>
            <button
              onClick={() => setActivePanel("flows")}
              className={`flex flex-col items-center text-xs ${
                activePanel === "flows" ? "text-teal-400" : "text-light-300"
              }`}
            >
              🔀 Flows
            </button>
            <button
              onClick={() => setActivePanel("settings")}
              className={`flex flex-col items-center text-xs ${
                activePanel === "settings" ? "text-teal-400" : "text-light-300"
              }`}
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Active panel overlay */}
          {activePanel && (
            <div className="absolute inset-0 bg-dark-800 bg-opacity-90 flex flex-col">
              <AgentSidebarFragment
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                onSend={onSend}
                activeConversation={activeConversation}
              />
              <button
                onClick={() => setActivePanel(null)}
                className="p-2 text-light-300 text-xs self-center"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </HelmetProvider>
  )
}
