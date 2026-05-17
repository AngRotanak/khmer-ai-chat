import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { useEffect, useState } from 'react'

import { NavigationBarModule } from '~/modules/navigation-bar/navigation-bar-module'
// import { AgentSidebarFragment } from '~/modules/sidebar/fragments/agents-sidebar-Fragment'
import { ReplyHelpersAdmin } from '~/modules/agent-dashboard/components/ReplyHelpersAdmin'
import { useAuthStore } from '~/stores/auth-store'
// import { useApplicationState } from '~/stores/application-state'
import { PageSelector } from '~/modules/shared/components/PageSelector'

export const Route = createFileRoute('/dashboard/admin/reply-helpers')({
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  // const { activePanel, setActivePanel } = useApplicationState(s => ({
  //   activePanel: s.agentSidebar.active,
  //   setActivePanel: s.actions.agentSidebar.setActivePanel,
  // }))

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
      } else if (user?.role !== 'admin') {
        navigate({ to: '/unauthorized' })
      }
    }
  }, [loading, token, user?.role, navigate])

  if (loading || !token || user?.role !== 'admin') return null

  return (
    <HelmetProvider>
      <Helmet>
        <title>KhmerAi.Chat Admin Dashboard</title>
      </Helmet>

      <div className="flex flex-col h-screen">
        <NavigationBarModule />

        <div className="flex flex-col grow overflow-hidden divide-y divide-light-300 dark:divide-dark-600">
          {/* Global Page Selector */}
          <div className="p-4 bg-dark-800">
            <PageSelector />
          </div>

          {/* Main content */}
          <div className="flex grow overflow-hidden divide-x divide-light-300 dark:divide-dark-600">
            <div className="flex flex-col flex-grow p-4 overflow-y-auto">
              <h1 className="text-xl font-bold mb-4">Reply Helpers Management</h1>
              <p className="text-sm text-light-400 mb-6">
                Add, edit, or remove quick replies and templates. Changes sync instantly to the agent dashboard.
              </p>
              {/* ✅ No need to pass pageId anymore */}
              <ReplyHelpersAdmin />
            </div>
            {/* <AgentSidebarFragment activePanel={activePanel} setActivePanel={setActivePanel} /> */}
          </div>
        </div>
      </div>
    </HelmetProvider>
  )
}
