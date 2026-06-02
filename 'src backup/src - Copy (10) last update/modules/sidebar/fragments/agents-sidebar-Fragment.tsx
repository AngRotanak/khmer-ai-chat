import type { ApplicationState } from '~/stores/application-state'
import { useApplicationState } from '~/stores/application-state'
import SidebarButtonItem from '~/modules/sidebar/components/sidebar-button-item'
import { MetricsPanel } from '~/modules/agent-dashboard/components/metrics-panel'
import { ConversationsPanel } from '~/modules/agent-dashboard/components/conversations-panel'
import { AgentGalleryPanel } from '~/modules/agent-dashboard/components/gallery-panel'
import type { Conversation } from '~/modules/nodes/types'
import { AgentSettings } from '~/modules/agent-dashboard/components/AgentSettings'
import { useFlowSession } from '~/stores/flow-session'
// import { useLocalizedMessage } from "~/modules/agent-dashboard/hooks/useLocalizedMessage"
// import { PageSelector } from "~/modules/shared/components/PageSelector"

type AgentSidebarFragmentProps = {
  activePanel: ApplicationState['agentSidebar']['active']
  setActivePanel: (panel: ApplicationState['agentSidebar']['active']) => void
  onSend: (msg: any) => void
  activeConversation: Conversation | null   // ✅ new prop
}

export function AgentSidebarFragment({
  activePanel,
  setActivePanel,
  onSend,
  activeConversation,
}: AgentSidebarFragmentProps) {
  const { currentPageId } = useFlowSession()


  const { conversations, metrics } = useApplicationState(s => ({
    conversations: s.agentData.conversations,
    metrics: s.agentData.metrics,
  }))

  const togglePanel = (panel: ApplicationState['agentSidebar']['active']) => {
    setActivePanel(activePanel === panel ? 'none' : panel)
  }

  // ✅ Local wrapper to attach activeConversation
  const handleSend = (msg: any) => {
    if (!activeConversation) {
      console.warn("No activeConversation, cannot send:", msg)
      return
    }
    onSend({ ...msg, conversation: activeConversation })
  }

  if (!currentPageId) {
    return
  }

  return (
    <div className="relative max-w-sm w-fit flex shrink-0 divide-x divide-dark-300">
      {activePanel !== 'none' && (
        <div className="min-w-xs grow bg-dark-500 dark:bg-dark-900">
          {activePanel === 'conversations' && (
            <ConversationsPanel
              activeCount={conversations.active}
              waitingCount={conversations.waiting}
              resolvedCount={conversations.resolved}
            />
          )}

          {activePanel === 'metrics' && (
            <MetricsPanel
              responseTime={metrics.responseTime}
              resolutionRate={metrics.resolutionRate}
              satisfaction={metrics.satisfaction}
            />
          )}

          {activePanel === 'gallery' && (
            <AgentGalleryPanel
              onSelect={(url, type) => {
                if (type === 'image') {
                  handleSend({ type: 'image', imageUrl: url })
                } else if (type === 'video') {
                  handleSend({ type: 'video', videoUrl: url })
                } else if (type === 'audio') {
                  handleSend({ type: 'voice', audioUrl: url })
                }
              }}
            />
          )}
          {activePanel === 'settings' && (
            <AgentSettings currentPageId={currentPageId} />
          )}
        </div>
      )}

      {/* Sidebar buttons */}
      <div className="shrink-0 bg-dark-400 dark:bg-dark-800 p-1.5">
        <div className="h-full flex flex-col gap-2">
          <SidebarButtonItem
            active={activePanel === 'conversations'}
            onClick={() => togglePanel('conversations')}
            title="Conversations"
          >
            <div className="i-mynaui:chat size-5 text-white dark:text-teal-300" />
          </SidebarButtonItem>

          <SidebarButtonItem
            active={activePanel === 'metrics'}
            onClick={() => togglePanel('metrics')}
            title="Metrics"
          >
            <div className="i-mynaui:chart-bar size-5 text-white dark:text-teal-300" />
          </SidebarButtonItem>

          <SidebarButtonItem
            active={activePanel === 'gallery'}
            onClick={() => togglePanel('gallery')}
            title="Media Gallery"
          >
            <div className="i-mynaui:image size-5 text-white dark:text-teal-300" />
          </SidebarButtonItem>

          <div className="mx-auto h-px w-4 bg-dark-100 dark:bg-dark-600" />

          {/* new settings button */}
          <SidebarButtonItem
            active={activePanel === 'settings'}
            onClick={() => togglePanel('settings')}
            title="Settings"
          >
            <div className="i-tabler:settings size-5 text-white dark:text-teal-300" />
          </SidebarButtonItem>

          <SidebarButtonItem
            active={false}
            onClick={() => {
              console.log('Logging out...')
              // hook into your logout logic here
            }}
            title="Logout"
          >
            <div className="i-tabler:logout size-5 text-white dark:text-red-300" />
          </SidebarButtonItem>
        </div>
      </div>
    </div>
  )
}
