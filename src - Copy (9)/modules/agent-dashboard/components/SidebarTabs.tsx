import { Tooltip } from "./Tooltip"

interface SidebarTabsProps {
  activeTab: "messages" | "comments" | "posts"
  setActiveTab: (tab: "messages" | "comments" | "posts") => void
  unreadCounts_all?: { messages: number; comments: number; posts: number }
}

export function SidebarTabs({ activeTab, setActiveTab, unreadCounts_all }: SidebarTabsProps) {
  return (
    <div className="w-20 border-r border-khmer-primary flex flex-col items-center py-4">
      <Tooltip label="Messages">
        <button
          onClick={() => setActiveTab("messages")}
          className={activeTab === "messages" ? "tab-active relative" : "tab-inactive relative"}
        >
          <span className="icon-chat" />
          {unreadCounts_all?.messages ? <span className="badge">{unreadCounts_all.messages}</span> : null}
        </button>
      </Tooltip>

      <Tooltip label="Comments">
        <button
          onClick={() => setActiveTab("comments")}
          className={activeTab === "comments" ? "tab-active relative" : "tab-inactive relative"}
        >
          <span className="icon-comments" />
          {unreadCounts_all?.comments ? <span className="badge">{unreadCounts_all.comments}</span> : null}
        </button>
      </Tooltip>

      <Tooltip label="Posts">
        <button
          onClick={() => setActiveTab("posts")}
          className={activeTab === "posts" ? "tab-active relative" : "tab-inactive relative"}
        >
          <span className="icon-posts" />
          {unreadCounts_all?.posts ? <span className="badge">{unreadCounts_all.posts}</span> : null}
        </button>
      </Tooltip>
    </div>
  )
}
