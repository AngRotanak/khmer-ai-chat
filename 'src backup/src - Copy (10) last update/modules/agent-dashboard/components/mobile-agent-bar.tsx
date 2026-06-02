import { Drawer } from "vaul"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { OnMounted } from "~@/components/generics/on-mounted"
import { useApplicationState } from "~/stores/application-state"
import { useAuthStore } from "~/stores/auth-store"
import { getAuth, signOut } from "firebase/auth"
import { toast } from "sonner"
import { useNavigate } from "@tanstack/react-router"

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


  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    signOut(getAuth())
    logout()
    toast.success("Logged out successfully")
    navigate({ to: "/login" })
  }

  return (
    <>
      {/* Floating button bar */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-x-2 border border-dark-300 dark:border-dark-600 rounded-full bg-dark-900/80 dark:bg-dark-950/80 p-2 shadow-lg backdrop-blur-xl">
          {/* Messages */}
          <button
            onClick={() => {
              setActiveTab("messages")
              setViewMode("queue")
            }}
            className="relative size-10 flex items-center justify-center rounded-full text-white dark:text-teal-300"
          >
            <div className="i-mynaui:chat size-5" />
            {conversations.active > 0 && <span className="badge">{conversations.active}</span>}
          </button>

          {/* Comments */}
          <button
            onClick={() => {
              setActiveTab("comments")
              setViewMode("queue")
            }}
            className="relative size-10 flex items-center justify-center rounded-full text-white dark:text-teal-300"
          >
            <div className='i-heroicons:chat-bubble-left-right size-5'/>
            {conversations.waiting > 0 && <span className="badge">{conversations.waiting}</span>}
          </button>

          {/* Posts */}
          <button
            onClick={() => {
              setActiveTab("posts")
              setViewMode("queue")
            }}
            className="relative size-10 flex items-center justify-center rounded-full text-white dark:text-teal-300"
          >
            <div className="i-mynaui:pin size-5" />
            {conversations.resolved > 0 && <span className="badge">{conversations.resolved}</span>}
          </button>

          {/* More */}
          <button
            onClick={() => setActivePanel("more")}
            className="size-10 flex items-center justify-center rounded-full text-white dark:text-teal-300"
          >
            <div className="i-mynaui:dots-vertical size-6" />
          </button>
        </div>
      </div>

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
                <button
                  onClick={() => {
                    setActiveTab("messages")
                    setViewMode("queue")
                    setActivePanel("none")
                  }}
                  className="btn-primary"
                >
                  Conversations
                </button>
                <button
                  onClick={() => {
                    setActiveTab("comments")
                    setViewMode("queue")
                    setActivePanel("none")
                  }}
                  className="btn-primary"
                >
                  Comments
                </button>
                <button
                  onClick={() => {
                    setActiveTab("posts")
                    setViewMode("queue")
                    setActivePanel("none")
                  }}
                  className="btn-primary"
                >
                  Posts
                </button>
                <button
                  onClick={handleLogout}
                  className="btn-primary"
                >
                  Log Out
                </button>

                {/* ✅ Dark Mode toggle */}
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
