import { createFileRoute } from '@tanstack/react-router'
import { ReactFlowProvider } from '@xyflow/react'
import { Helmet } from 'react-helmet'

import { FlowBuilderModule } from '~/modules/flow-builder/flow-builder-module'
import { NavigationBarModule } from '~/modules/navigation-bar/navigation-bar-module'
import { SidebarModule } from '~/modules/sidebar/sidebar-module'
import { ToasterModule } from '~/modules/toaster/toaster-module'
import { AddNodeOnEdgeDropStateProvider } from '~/stores/add-node-on-edge-drop-state'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      {/* ✅ Favicon + PWA manifest for KhmerAi.Chat */}
      <Helmet>
        <title>KhmerAi.Chat Flow Builder</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#009CA6" />
      </Helmet>

      <ReactFlowProvider>
        {/* ✅ Full-page wrapper with classic dark mode */}
        <div className="transition-colors duration-300 flex flex-col h-dvh bg-light-100 text-dark-900 dark:bg-dark-900 dark:text-light-100 divide-y divide-light-300 dark:divide-dark-600">
          <NavigationBarModule />

          <div className="flex grow overflow-y-hidden divide-x divide-light-300 dark:divide-dark-600">
            {/* ✅ Canvas area with consistent dark background */}
            <div className="grow bg-light-100 dark:bg-dark-900 transition-colors duration-300">
              <AddNodeOnEdgeDropStateProvider>
                <FlowBuilderModule />
              </AddNodeOnEdgeDropStateProvider>
            </div>

            {/* ✅ Sidebar inherits dark styling */}
            <SidebarModule />
          </div>
        </div>

        {/* ✅ Toaster stays outside layout for global alerts */}
        <ToasterModule />
      </ReactFlowProvider>
    </>
  )
}
