import type { ApplicationState } from '~/stores/application-state'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Drawer } from 'vaul'
import { getAuth, signOut } from 'firebase/auth'
import { useAuthStore } from '~/stores/auth-store'

import { OnMounted } from '~@/components/generics/on-mounted'
import { cn } from '~@/utils/cn'
import { SwitchSidebarPanel } from '~/modules/sidebar/components/sidebar-switch-panel'
import { trackSocialLinkClick } from '~/utils/ga4'

type MobileSidebarFragmentProps = Readonly<{
  activePanel: ApplicationState['sidebar']['active'];
  setActivePanel: (panel: ApplicationState['sidebar']['active']) => void;
}>

export function MobileSidebarFragment({ activePanel, setActivePanel }: MobileSidebarFragmentProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    setActivePanel('none')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    signOut(getAuth())
    logout()
    toast.success('Logged out successfully')
  }

  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  )


  const toggleDarkMode = () => {
    const newState = !isDark
    document.documentElement.classList.toggle('dark', newState)
    localStorage.setItem('theme', newState ? 'dark' : 'light')
    setIsDark(newState)
  }

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') setIsDark(true)
    if (stored === 'light') setIsDark(false)
  }, [])


  return (
    <>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex touch-none items-center justify-center p-4">
        <div className="pointer-events-auto flex touch-auto items-center gap-x-0.5 border border-dark-300 dark:border-dark-600 rounded-full bg-dark-900/80 dark:bg-dark-950/80 p-1 shadow-black/20 shadow-xl backdrop-blur-2xl relative">
          <button
            onClick={() => setActivePanel('khmer-ai-features')}
            type="button"
            className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300"
          >
            <div className="i-mynaui:sparkles size-5" />
          </button>
          <div className="h-4 w-px shrink-0 bg-dark-300 dark:bg-dark-600" />
          <button
            onClick={() => setActivePanel('available-nodes')}
            type="button"
            className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300"
          >
            <div className="i-mynaui:grid size-5" />
          </button>
          <div className="h-4 w-px shrink-0 bg-dark-300 dark:bg-dark-600" />
          <button
            onClick={() => setActivePanel('node-properties')}
            type="button"
            className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300"
          >
            <div className="i-mynaui:layers-three size-5" />
          </button>

          <div className="h-4 w-px shrink-0 bg-dark-300 dark:bg-dark-600" />

          <button
            onClick={() => setActivePanel('flow-manager')}
            type="button"
            className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300"
          >
            <div className="i-heroicons-outline:rectangle-group size-5" />
          </button>

          <div className="h-4 w-px shrink-0 bg-dark-300 dark:bg-dark-600" />


          <button
            onClick={() => setActivePanel('command-center')}
            type="button"
            className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300"
          >
            <div className="i-tabler:settings size-5" />
          </button>
          <div className="h-4 w-px shrink-0 bg-dark-300 dark:bg-dark-600" />



          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
              className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300"
              title="Menu"
            >
              <div className="i-mynaui:dots-vertical size-7" />
            </button>

            {menuOpen && (
              <div className="absolute bottom-12 right-0 z-50 w-40 rounded-lg bg-dark-800 shadow-lg ring-1 ring-dark-600">
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:text-teal-400 flex items-center gap-2"
                >
                  <div
                    className={cn(
                      'size-4',
                      isDark ? 'i-mynaui:sun text-teal-300' : 'i-mynaui:moon text-light-100'
                    )}
                  />
                  <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>


                <a
                  href="https://www.facebook.com/KhmerAutosoft"
                  onClick={() => trackSocialLinkClick('facebook')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:text-teal-400"
                >
                  <div className="i-mynaui:brand-facebook size-4" />
                  <span>KhmerAi.Chat</span>
                </a>

                <a
                  href="https://t.me/angrotanak"
                  onClick={() => trackSocialLinkClick('telegram')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:text-teal-400"
                >
                  <div className="i-mynaui:brand-telegram size-4" />
                  <span>Contact Us</span>
                </a>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:text-teal-400"
                >
                  <div className="flex items-center gap-2">
                    <div className="i-mynaui:logout size-4" />
                    <span>Log Out</span>
                  </div>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      <OnMounted>
        <Drawer.Root
          noBodyStyles
          open={activePanel !== 'none'}
          onOpenChange={(open) => {
            if (!open) setActivePanel('none')
          }}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 dark:bg-black/70" />

            <Drawer.Content
              className={cn(
                'fixed bottom-0 left-0 right-0 mt-24 max-h-[90%] flex flex-col overflow-hidden',
                activePanel === 'node-properties' && 'h-[90%]',
              )}
            >
              <div className="flex-1 min-h-0 overflow-y-auto">
                <SwitchSidebarPanel active={activePanel} />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </OnMounted>
    </>
  )
}
