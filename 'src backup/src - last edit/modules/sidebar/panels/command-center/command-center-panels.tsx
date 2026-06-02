import { useState } from 'react'
import { PanelGroup } from './components/layout/PanelGroup'
import { FeatureToggle } from './components/FeatureToggle'
import { CommandEditor } from './components/CommandEditor'
import { CommentTriggerEditor } from './components/CommentTriggerEditor'
import { FallbackEditor } from './components/FallbackEditor'
import { SystemSettingEditor } from './components/SystemSettingEditor'
import { ActivatePageEditor } from './components/ActivatePageEditor'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { useApplicationState } from '~/stores/application-state'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { defaultOverlayScrollbarsOptions } from '~/utils/overlayscrollbars.ts'

export function CommandCenterPanel() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const { setActivePanel } = useApplicationState(s => ({
    isMobileView: s.view.mobile,
    setActivePanel: s.actions.sidebar.setActivePanel,
  }))

  const toggle = (key: string) => {
    setExpanded(expanded === key ? null : key)
  }

  return (
    <SidebarPanelWrapper>
      {/* Close Button */}
      <div className="flex justify-end px-3 pt-3">
        <button
          onClick={() => setActivePanel('none')}
          className="text-xs text-light-100/50 hover:text-light-100 dark:text-light-100/40 dark:hover:text-white transition"
          title="Close"
        >
          <div className="i-mynaui:x size-4" />
        </button>
      </div>

      {/* Header */}
      <div className="mt-4 flex flex-col items-center px-4 text-center">
        <div className="size-12 flex items-center justify-center rounded-full bg-teal-800 dark:bg-teal-600">
          <div className="i-lucide:settings size-6 text-white dark:text-light-100" />
        </div>

        <div className="mt-4 font-medium text-light-100 dark:text-light-100">
          Command Center
        </div>

        <div className="mt-1 w-2/3 text-xs font-medium leading-normal text-light-50/40 dark:text-light-100/40">
          Manage bot features, message commands, comment triggers, fallbacks, and page activation.
        </div>
      </div>

      {/* Scrollable Panel List */}
      <OverlayScrollbarsComponent
        className="flex-1 min-h-0 bg-dark-400 dark:bg-dark-900 px-4 py-6 space-y-6"
        defer
        options={defaultOverlayScrollbarsOptions}
      >
        <PanelGroup title="🔘 Feature Toggles" expanded={expanded === 'features'} onToggle={() => toggle('features')}>
          <FeatureToggle label="Promo Mode" path="features/promo" tooltip="Enable promotional replies and broadcast-style messaging for campaigns" />
          <FeatureToggle label="Intro Message" path="features/intro" tooltip="Show a welcome message when users first open the chat or flow" />
          <FeatureToggle label="Message Reply" path="features/auto_reply" tooltip="Automatically reply to inbox messages" />
          <FeatureToggle label="Comment Reply" path="features/auto_reply_comments" tooltip="Automatically reply to Facebook post comments" />
        </PanelGroup>

        <PanelGroup title="💬 Message Commands" expanded={expanded === 'commands'} onToggle={() => toggle('commands')}>
          <CommandEditor command="info_skin_care" />
          <CommandEditor command="info_shipping" />
          <CommandEditor command="info_contact" />
        </PanelGroup>

        <PanelGroup title="💡 Comment Triggers" expanded={expanded === 'comments'} onToggle={() => toggle('comments')}>
          <CommentTriggerEditor trigger="thanks" />
          <CommentTriggerEditor trigger="price" />
          <CommentTriggerEditor trigger="location" />
        </PanelGroup>

        <PanelGroup title="🧩 Fallbacks" expanded={expanded === 'fallbacks'} onToggle={() => toggle('fallbacks')}>
          <FallbackEditor />
        </PanelGroup>

        <PanelGroup title="🛠️ System Settings" expanded={expanded === 'settings'} onToggle={() => toggle('settings')}>
          <SystemSettingEditor label="Bot Name" path="settings/bot_name" />
          <SystemSettingEditor label="Messenger Preview" path="settings/preview_enabled" />
          <ActivatePageEditor />
        </PanelGroup>
      </OverlayScrollbarsComponent>
    </SidebarPanelWrapper>
  )
}
