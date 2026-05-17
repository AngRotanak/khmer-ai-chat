import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ReactFlowProvider } from '@xyflow/react'
import { Helmet } from 'react-helmet'
import { useEffect, useState } from 'react'

import { FlowBuilderModule } from '~/modules/flow-builder/flow-builder-module'
import { NavigationBarModule } from '~/modules/navigation-bar/navigation-bar-module'
import { SidebarModule } from '~/modules/sidebar/sidebar-module'
import { ToasterModule } from '~/modules/toaster/toaster-module'
import { AddNodeOnEdgeDropStateProvider } from '~/stores/add-node-on-edge-drop-state'
import { useAuthStore } from '~/stores/auth-store'


export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})


function DashboardPage() {
  const navigate = useNavigate()
  const { user, token, restore } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restore()
    const timeout = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!loading && (!token || user?.role !== 'admin')) {
      navigate({ to: '/unauthorized' })
    }
  }, [loading, token, user?.role, navigate])

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setVH()
    window.addEventListener('resize', setVH)
    return () => window.removeEventListener('resize', setVH)
  }, [])

  if (loading || !token || user?.role !== 'admin') return null

  return (
    <>
      <Helmet>
        <title>KhmerAi.Chat Flow Builder</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#009CA6" />
      </Helmet>

      <ReactFlowProvider>
        <div
          className="transition-colors duration-300 flex flex-col"
          style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
        >
          <NavigationBarModule />

         <div className="flex grow overflow-hidden divide-x divide-light-300 dark:divide-dark-600">
          
        {/* Canvas Panel */}
        <div className="flex flex-col grow bg-light-100 dark:bg-dark-900 transition-colors duration-300 overflow-hidden">


          {/* Scrollable Content */}
          <main className="flex flex-col overflow-y-auto grow">

            {/* {showActivate && (
              <section className="px-6 py-4">
                <ActivatePageForm onClose={() => setShowActivate(false)} />
              </section>
            )} */}

            <section className="flex-grow">
              <AddNodeOnEdgeDropStateProvider>
                <FlowBuilderModule />
              </AddNodeOnEdgeDropStateProvider>
            </section>
          </main>
        </div>

        {/* Sidebar */}
        <SidebarModule />
      </div>


          <ToasterModule />
        </div>
      </ReactFlowProvider>
    </>
  )
}
