import { useState } from 'react'
import { PanelGroup } from './components/layout/PanelGroup'
import { FeatureToggle } from './components/FeatureToggle'
import { CommandEditor } from './components/CommandEditor'
import { CommentTriggerEditor } from './components/CommentTriggerEditor'
import { FallbackEditor } from './components/FallbackEditor'
import { SystemSettingEditor } from './components/SystemSettingEditor'
import { ActivatePageEditor } from './components/ActivatePageEditor'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'

export function CommandCenterPanel() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (key: string) => {
    setExpanded(expanded === key ? null : key)
  }

  return (
    <SidebarPanelWrapper>
      <div className="mt-4 flex flex-col items-center p-4 text-center">
        <div className="size-12 flex items-center justify-center rounded-full bg-teal-800 dark:bg-teal-600">
          <div className="i-lucide:settings size-6 text-white dark:text-light-100" />
        </div>

        <div className="mt-4 text-balance font-medium text-light-100 dark:text-light-100">
          Command Center
        </div>

        <div className="mt-1 w-2/3 text-xs font-medium leading-normal text-light-50/40 dark:text-light-100/40">
          Manage bot features, message commands, comment triggers, fallbacks, and page activation.
        </div>
      </div>

      <div className="w-full h-full overflow-y-auto px-4 py-6 space-y-6 text-light-100">
        <PanelGroup title="🔘 Feature Toggles" expanded={expanded === 'features'} onToggle={() => toggle('features')}>
          <FeatureToggle
            label="Promo Mode"
            path="features/promo"
            tooltip="Enable promotional replies and broadcast-style messaging for campaigns"
          />
          <FeatureToggle
            label="Intro Message"
            path="features/intro"
            tooltip="Show a welcome message when users first open the chat or flow"
          />
          <FeatureToggle
            label="Message Reply"
            path="features/auto_reply"
            tooltip="Automatically reply to inbox messages"
          />
          <FeatureToggle
            label="Comment Reply"
            path="features/auto_reply_comments"
            tooltip="Automatically reply to Facebook post comments"
          />
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
      </div>
    </SidebarPanelWrapper>
  )
}
