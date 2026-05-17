import { FeatureToggleGroup } from '~/modules/feature-toggle/feature-toggle-group'
import { PageHeader } from './page-header'
import { usePageRole } from '~/hooks/use-page-role'
import { FallbackSelector } from '~/modules/page-dashboard/fallback-selector'
// import { TriggerEditor } from '~/modules/shared/trigger-editor'
import { RoleManager } from '~/modules/page-dashboard/role-manager'
import { BlockEditor } from '~/modules/block-editor/block-editor'
import { ActivityLog } from '~/modules/page-dashboard/activity-log'
import { AdminIntro } from '~/modules/onboarding/admin-intro'
import { BlockSimulator } from '~/modules/block-editor/block-simulator'
import { useState } from 'react'
import { ExportSummary } from '~/modules/page-dashboard/export-summary'
import { PageSwitcher } from '~/modules/page-dashboard/page-switcher'
import { useAuthStore } from '~/stores/auth-store'


type Props = {
  pageId: string
}

export function PageDashboard({ pageId }: Props) {
  const role = usePageRole(pageId)
  const [selectedBlockName] = useState<string | null>('intro_block')
  const { user } = useAuthStore()

  if (role !== 'admin') {
    return (
      <div className="p-6 text-light-400">
        You don’t have admin access to this Page.
      </div>
    )
  }

  if (!user?.id) {
      return <p className="text-light-400 p-4">កំពុងផ្ទុកព័ត៌មានអ្នកប្រើ...</p>
    }

    

  return (
    <div className="space-y-6">
      <AdminIntro />
      <PageHeader pageId={pageId} />
      <FeatureToggleGroup pageId={pageId} />
      <FallbackSelector pageId={pageId} />
      <RoleManager pageId={pageId} />
      {/* <TriggerEditor pageId={pageId} type="comments" label="ពាក្យបញ្ចេញមតិ (Comment Triggers)" />
      <TriggerEditor pageId={pageId} type="messages" label="ពាក្យបញ្ចេញសារ (Message Triggers)" /> */}

      {selectedBlockName && (
        <div className="space-y-4">
          <BlockEditor pageId={pageId} blockName={selectedBlockName} />
          <BlockSimulator pageId={pageId} blockName={selectedBlockName} />
        </div>
      )}

      <ActivityLog pageId={pageId} />
      <ExportSummary pageId={pageId} />
      <PageSwitcher uid={user.id} />
    </div>
  )
}
