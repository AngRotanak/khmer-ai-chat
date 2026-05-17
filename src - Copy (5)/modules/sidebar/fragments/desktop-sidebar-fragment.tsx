import type { ApplicationState } from '~/stores/application-state'
import { getAuth, signOut } from 'firebase/auth'
import { useAuthStore } from '~/stores/auth-store'
import { useNavigate } from '@tanstack/react-router'
// import { useEffect } from 'react'



import SidebarButtonItem from '~/modules/sidebar/components/sidebar-button-item'
import { SwitchSidebarPanel } from '~/modules/sidebar/components/sidebar-switch-panel'

type DesktopSidebarFragmentProps = Readonly<{
  isMobileView: ApplicationState['view']['mobile'];
  activePanel: ApplicationState['sidebar']['active'];
  setActivePanel: (panel: ApplicationState['sidebar']['active']) => void;
}>

export function DesktopSidebarFragment({ activePanel, setActivePanel }: DesktopSidebarFragmentProps) {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(getAuth())
    logout()
    navigate({ to: '/login' }) // ✅ redirect after logout }
  }
  //   useEffect(() => {
  //   if (!isMobileView && activePanel === 'none') {
  //     setActivePanel('available-nodes')
  //   }
  // }, [
  //   activePanel,
  //   setActivePanel,
  //   isMobileView,
  // ])



  return (
    <div className="relative max-w-sm w-fit flex shrink-0 divide-x divide-dark-300">
      {activePanel !== 'none' && (
        <div className="min-w-xs grow bg-dark-500 dark:bg-dark-900">
          <SwitchSidebarPanel active={activePanel} />
        </div>
      )}

      <div className="shrink-0 bg-dark-400 dark:bg-dark-800 p-1.5">
        <div className="h-full flex flex-col gap-2">
          <SidebarButtonItem
            active={activePanel === 'khmer-ai-features'}
            onClick={() => setActivePanel('khmer-ai-features')}
          >
            <div className="i-mynaui:sparkles size-5 text-white dark:text-teal-300" />
          </SidebarButtonItem>

          <SidebarButtonItem
            active={activePanel === 'available-nodes'}
            onClick={() => setActivePanel('available-nodes')}
          >
            <div className="i-mynaui:grid size-5 text-white dark:text-teal-300" />
          </SidebarButtonItem>

          <div className="mx-auto h-px w-4 bg-dark-100 dark:bg-dark-600" />

          <SidebarButtonItem
            active={activePanel === 'node-properties'}
            onClick={() => setActivePanel('node-properties')}
          >
            <div className="i-mynaui:layers-three size-5 text-white dark:text-teal-300" />
          </SidebarButtonItem>

          <SidebarButtonItem
            active={activePanel === 'flow-manager'}
            onClick={() => setActivePanel('flow-manager')}
            title="Flow Manager"
          >
            <div className="i-heroicons-outline:rectangle-group size-5 text-white dark:text-teal-300" />
          </SidebarButtonItem>


          <SidebarButtonItem
            active={activePanel === 'command-center'}
            onClick={() => setActivePanel('command-center')}
          >
            <div className="i-tabler:settings size-5 text-white dark:text-teal-300" />
          </SidebarButtonItem>


          <SidebarButtonItem
            active={false}
            onClick={() => {
              signOut(getAuth())
              handleLogout()
            }}
          >
            <div className="i-tabler:logout size-5 text-white dark:text-red-300" />
          </SidebarButtonItem>

        </div>
      </div>
    </div>
  )
}
