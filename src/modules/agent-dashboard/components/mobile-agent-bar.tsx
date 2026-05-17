import { Drawer } from "vaul"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { OnMounted } from "~@/components/generics/on-mounted"
import { useApplicationState } from "~/stores/application-state"
import { useAuthStore } from "~/stores/auth-store"
import { getAuth, signOut } from "firebase/auth"
import { toast } from "sonner"
import { useNavigate } from "@tanstack/react-router"
import { AgentSettings } from '~/modules/agent-dashboard/components/AgentSettings'
import { useFlowSession } from '~/stores/flow-session'
import { useState } from "react"

type ActivePanelType = 'conversations' | 'metrics' | 'gallery' | 'settings' | 'more' | 'none'
type ActiveTabType = 'messages' | 'comments' | 'posts'
type ViewModeType = 'queue' | 'timeline'

type MobileAgentBarProps = {
  activePanel: ActivePanelType
  setActivePanel: (panel: ActivePanelType) => void
  activeTab: ActiveTabType
  setActiveTab: (tab: ActiveTabType) => void
  setViewMode: (mode: ViewModeType) => void
}

export function MobileAgentBar({
  activePanel,
  setActivePanel,
  // activeTab,
  setActiveTab,
  setViewMode,
}: MobileAgentBarProps) {
  const conversations = useApplicationState((s) => s.agentData.conversations)
  const { theme, setTheme } = useApplicationState((s) => ({
    theme: s.settings.theme,
    setTheme: s.actions.settings.setTheme,
  }))
  const { currentPageId } = useFlowSession()
  const [showSetting, setShowSetting] = useState(false)

  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    signOut(getAuth())
    logout()
    toast.success("Logged out successfully")
    navigate({ to: "/login" })
  }

  if (!currentPageId) {
    return
  }


  return (
    <>
      {/* Floating button bar */}
      <div className="absolute bottom-0 left-0 right-0 flex touch-none items-center justify-center p-4">
        <div className="pointer-events-auto flex touch-auto items-center gap-x-0.5 border border-dark-300 dark:border-dark-600 rounded-full bg-dark-900/80 dark:bg-dark-950/80 p-1 shadow-black/20 shadow-xl backdrop-blur-2xl relative">
          {/* Messages */}
          <button
            onClick={() => {
              setActiveTab("messages")
              setViewMode("queue")
            }}
            type="button"
            className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300 relative"
          >
            <div className="i-mynaui:chat size-5" />
            {conversations.active > 0 && (
              <span className="badge">{conversations.active}</span>
            )}
          </button>
          <div className="h-4 w-px shrink-0 bg-dark-300 dark:bg-dark-600" />

          {/* Comments */}
          <button
            onClick={() => {
              setActiveTab("comments")
              setViewMode("queue")
            }}
            type="button"
            className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300 relative"
          >
            <div className="i-heroicons:chat-bubble-left-right size-5" />
            {conversations.waiting > 0 && (
              <span className="badge">{conversations.waiting}</span>
            )}
          </button>
          <div className="h-4 w-px shrink-0 bg-dark-300 dark:bg-dark-600" />

          {/* Posts */}
          <button
            onClick={() => {
              setActiveTab("posts")
              setViewMode("queue")
            }}
            type="button"
            className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300 relative"
          >
            <div className="i-mynaui:pin size-5" />
            {conversations.resolved > 0 && (
              <span className="badge">{conversations.resolved}</span>
            )}
          </button>
          <div className="h-4 w-px shrink-0 bg-dark-300 dark:bg-dark-600" />

          {/* Settings */}
          <button
            onClick={() => setShowSetting(true)}
            type="button"
            className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300 relative"
          >
            <div className="i-tabler:settings size-5" />
          </button>
          <div className="h-4 w-px shrink-0 bg-dark-300 dark:bg-dark-600" />
          {/* More */}
          <button
            onClick={() => setActivePanel("more")}
            type="button"
            className="size-10 flex items-center justify-center rounded-full bg-transparent text-white dark:text-teal-300"
          >
            <div className="i-mynaui:dots-vertical size-6" />
          </button>
        </div>
      </div>

      {/* Gallery drawer */}
      <Drawer.Root
        noBodyStyles
        open={showSetting}
        onOpenChange={(open) => setShowSetting(open)}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 dark:bg-black/70" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[80%] flex flex-col rounded-t-lg bg-dark-900 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <span className="text-light-100 font-semibold">Setting</span>
              <button
                onClick={() => setShowSetting(false)}
                className="text-light-300 hover:text-teal-400"
              >
                ✕
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              <AgentSettings currentPageId={currentPageId} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Drawer for More Tools */}
      <OnMounted>
        <Drawer.Root
          noBodyStyles
          open={activePanel === "more"}
          onOpenChange={(open) => {
            if (!open) setActivePanel("none")
          }}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 dark:bg-black/70" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[60%] flex flex-col overflow-hidden rounded-t-lg bg-dark-900 p-4">
              <Drawer.Title>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-light-100 font-semibold">More Tools</span>
                  <button
                    onClick={() => setActivePanel("none")}
                    className="text-light-300 hover:text-teal-400"
                  >
                    ✕
                  </button>
                </div>
              </Drawer.Title>
              <Drawer.Description>
                <VisuallyHidden>Additional agent tools</VisuallyHidden>
              </Drawer.Description>



              {/* Tool buttons */}
              <div className="grid grid-cols-2 gap-4">
                {/* ✅ Flow Builder */}
                <button
                  onClick={() => {
                    navigate({ to: "/dashboard/flow"})
                    setActivePanel("none")
                  }}
                  className="btn-primary"
                >
                  Flow Builder
                </button>

                {/* ✅ Manage Reply Helpers */}
                <button
                  onClick={() => {
                    navigate({ to: "/dashboard/admin/reply-helpers" })
                    setActivePanel("none")
                  }}
                  className="btn-primary"
                >
                  Manage Reply Helpers
                </button>

                {/* ✅ Smart e‑Catalog */}
                <button
                  onClick={() => {
                    navigate({ to: "/smart-catalog" })
                    setActivePanel("none")
                  }}
                  className="btn-primary"
                >
                  Smart e‑Catalog
                </button>

                {/* Log Out */}
                <button onClick={handleLogout} className="btn-primary">
                  Log Out
                </button>

                {/* Dark Mode toggle */}
                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark")
                    setActivePanel("none")
                  }}
                  className="btn-primary col-span-2"
                >
                  {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </button>
              </div>

            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </OnMounted>
    </>
  )
}
