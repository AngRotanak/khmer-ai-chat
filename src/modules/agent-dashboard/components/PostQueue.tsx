import type { Conversation, PostData, Comment } from "~/modules/nodes/types"

type PostQueueProps = {
  posts: Conversation[]
  onSelect: (conv: Conversation, post: PostData) => void   // back to full Conversation
  activePostId: string | null
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterPriority: string
  setFilterPriority: (priority: string) => void
  dateFilter: string
  setDateFilter: (filter: string) => void
}



// 🔹 Highlight search matches
function highlightMatch(text: string, term: string) {
  if (!term) return text
  const terms = term.trim().split(/\s+/).filter(Boolean)
  const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi")

  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="bg-yellow-600 text-black font-semibold">
        {part}
      </span>
    ) : (
      part
    )
  )
}



export function PostQueue({
  posts = [],
  onSelect,
  activePostId,
  searchTerm,
  setSearchTerm,
  filterPriority,
  setFilterPriority,
  dateFilter,
  setDateFilter,
}: PostQueueProps) {

  // 🔹 Utility: classify by date bucket
  function getDateBucket(timestamp: number): "today" | "yesterday" | "older" {
    const now = new Date()
    const convDate = new Date(timestamp * 1000)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (convDate >= today) return "today"
    if (convDate >= yesterday) return "yesterday"
    return "older"
  }

  // 🔹 Flatten posts from all conversations, merging by postId
  console.log("📥 PostQueue received conversations:", posts.length)
  posts.forEach(conv => {
    console.log(`   ➡️ Conversation ${conv.id} has ${conv.posts?.length ?? 0} posts`)
  })

  const postMap: Record<string, { conv: Conversation; postData: PostData & { timestamp: number } }> = {}

  posts.forEach(conv => {
    (conv.posts ?? []).forEach(p => {
      const newComments = Array.isArray(p.comments)
        ? p.comments
        : Object.values(p.comments ?? {}) as Comment[]

      const latestCommentTs = newComments.reduce(
        (max, c) => Math.max(max, Number(c.timestamp ?? 0)),
        0
      )

      if (!postMap[p.id]) {
        postMap[p.id] = {
          conv, // ✅ store full Conversation
          postData: { ...p, comments: newComments, timestamp: latestCommentTs }
        }
      } else {
        const existing = postMap[p.id].postData
        const merged = [...(existing.comments ?? []), ...newComments]
        const unique = Object.values(
          merged.reduce((acc, c) => {
            if (c.id) acc[c.id] = c
            return acc
          }, {} as Record<string, Comment>)
        )
        const latestCommentTs = unique.reduce(
          (max, c) => Math.max(max, Number(c.timestamp ?? 0)),
          0
        )

        postMap[p.id].postData = { ...existing, comments: unique, timestamp: latestCommentTs }
      }
    })
  })

  const allPosts = Object.values(postMap)


  allPosts.forEach(item => {
    console.log("📊 Flattened post in PostQueue:", {
      convId: item.conv.id,   // ✅ use conv.id
      postId: item.postData.id,
      unreadCommentCount: item.postData.unreadCommentCount,
      comments: item.postData.comments?.length
    })
  })


  // 🔹 Normalize and sort
  const priorityOrder: Record<string, number> = { urgent: 3, high: 2, normal: 1 }
  const sorted = [...allPosts].sort((a, b) => {
    const pa = priorityOrder[a.postData.priority]
    const pb = priorityOrder[b.postData.priority]
    if (pa !== pb) return pb - pa
    return Number(b.postData.timestamp) - Number(a.postData.timestamp)
  })

  console.log("🟢 Sorted posts count:", sorted.length)

  // 🔹 Filter
  let filtered = sorted.filter(item => {
    const title = item.postData.post?.title?.toLowerCase() ?? ""
    const term = searchTerm.toLowerCase()
    return !searchTerm || title.includes(term)
  })

  console.log("🟢 Filtered posts count:", filtered.length)

  if (filterPriority !== "all") {
    filtered = filtered.filter(item => item.postData.priority === filterPriority)
    console.log(`🟢 After priority filter (${filterPriority}):`, filtered.length)
  }

  if (dateFilter === "today") {
    filtered = filtered.filter(item => getDateBucket(item.postData.timestamp) === "today")
    console.log("🟢 After date filter (today):", filtered.length)
  } else if (dateFilter === "yesterday") {
    filtered = filtered.filter(item => getDateBucket(item.postData.timestamp) === "yesterday")
    console.log("🟢 After date filter (yesterday):", filtered.length)
  } else if (dateFilter === "week") {
    const weekAgo = Date.now() / 1000 - 7 * 24 * 3600
    filtered = filtered.filter(item => item.postData.timestamp >= weekAgo)
    console.log("🟢 After date filter (week):", filtered.length)
  }

  // 🔹 Group by bucket
  const grouped: Record<string, typeof filtered> = { today: [], yesterday: [], older: [] }
  filtered.forEach(item => {
    const bucket = getDateBucket(item.postData.timestamp)
    grouped[bucket].push(item)
  })

  console.log("🟢 Grouped counts:", {
    today: grouped.today.length,
    yesterday: grouped.yesterday.length,
    older: grouped.older.length,
  })


  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Search + Priority + Date Filter */}
      <div className="p-2 border-b border-teal-700 flex flex-wrap gap-2">
        {/* Search box + clear button */}
        <div className="flex items-center gap-2 flex-[2] min-w-[120px]">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1 text-sm rounded bg-dark-700 text-light-100 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-2 py-1 text-sm bg-dark-600 text-light-200 rounded hover:bg-dark-500"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="flex-1 px-2 py-1 text-sm rounded bg-dark-700 text-light-100 min-w-[100px]"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="flex-1 px-2 py-1 text-sm rounded bg-dark-700 text-light-100 min-w-[100px]"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">Last 7 Days</option>
        </select>
      </div>


      {/* Scrollable grouped list */}
      <div className="flex-grow overflow-y-auto scrollbar-dark-teal p-2 space-y-6">
        {["today", "yesterday", "older"].map(bucket => (
          grouped[bucket].length > 0 && (
            <div key={bucket}>
              <h3 className="text-xs font-semibold text-light-400 uppercase mb-2">
                {bucket === "today" ? "Today" : bucket === "yesterday" ? "Yesterday" : "Older"}
              </h3>

              <div className="space-y-4">
                {grouped[bucket].map(item => {
                  const p = item.postData
                  const postUnread = p.unreadCommentCount ?? 0

                  console.log("🟢 Rendering PostQueue item:", {
                    postId: p.id,
                    unreadCommentCount: p.unreadCommentCount,
                    comments: p.comments?.length
                  })

                  const isActive = p.id === activePostId
                  return (
                    <button
                      key={`${item.conv.id}_${p.id}`}   // ✅ conv.id is valid now
                      onClick={() => onSelect(item.conv, p)}   // ✅ pass full Conversation + PostData
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border border-dark-700 shadow-md transform transition-all duration-200 ${isActive
                        ? "bg-teal-800"
                        : "bg-dark-700 hover:bg-dark-600 hover:shadow-lg hover:scale-105"
                        }`}
                    >
                      {p.post?.image && (
                        <img
                          src={p.post.image}
                          alt={p.post.title}
                          className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">
                            {highlightMatch(p.post?.title ?? "Untitled Post", searchTerm)}
                          </span>
                          {p.priority === "urgent" && (
                            <span className="px-2 py-0.5 rounded text-xs bg-yellow-500 text-black">
                              ⚠️ Urgent
                            </span>
                          )}
                          {p.priority === "high" && (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-600 text-white">
                              🔺 High
                            </span>
                          )}
                          {postUnread > 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs">
                              {postUnread}
                            </span>
                          )}
                        </div>
                        <span className="text-light-400 text-xs truncate">
                          {p.comments?.length ?? 0} comments
                        </span>
                      </div>
                    </button>

                  )
                })}
              </div>
            </div>
          )
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-light-400">
            <span className="text-sm">No posts match your filter…</span>
          </div>
        )}
      </div>
    </div>
  )
}
