import { useState, useEffect } from "react"
import { db } from "~/lib/firebase"
import { ConversationQueue } from "../components/ConversationQueue"
import { ConversationTimeline } from "./ConversationTimeline"
import { SidebarTabs } from "./SidebarTabs"
import { DashboardLayout } from "./DashboardLayout"
import { useUnreadCounts } from "../hooks/useUnreadCounts"
import { useFlowSession } from '~/stores/flow-session'
import { PageSelector } from "~/modules/shared/components/PageSelector"
import { ref, onValue, update } from "firebase/database"
import type { Conversation, ConversationMessage, FlowLog, PostData, ConversationStatus, CommentConversation, Comment } from '~/modules/nodes/types'
import { CommentQueue } from "../components/CommentQueue"
import { PostQueue } from "../components/PostQueue"
import { CommentTimeline } from "../components/CommentTimeline"
import { PostTimeline } from "../components/PostTimeline"
import { sendCommentReply } from "../hooks/sendCommentReply"
import { normalizeComments } from "~/utils/normalize.ts"
import { useApplicationState } from "~/stores/application-state"
import { toast } from "sonner"

export function AgentDashboard({
    activeConversation,
    setActiveConversation,
    pageToken,
}: {
    activeConversation: Conversation | null
    setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>
    pageToken: string
}) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [comments, setComments] = useState<CommentConversation[]>([])
    // 🔹 New state for posts
    const [postConversations, setPostConversations] = useState<Conversation[]>([])

    // ✅ Pull activeTab + viewMode from global store
    const { activeTab, setActiveTab, viewMode, setViewMode } = useApplicationState((s) => ({
        activeTab: s.agentData.activeTab,
        setActiveTab: s.actions.agentData.setActiveTab,
        viewMode: s.agentData.viewMode,
        setViewMode: s.actions.agentData.setViewMode,
    }))

    const [commentOrigins, setCommentOrigins] = useState<
        Record<string, { convId: string; convName?: string }>
    >({})

    // Comments
    const [activeComment, setActiveComment] = useState<CommentConversation | null>(null)

    // Posts
    const [activePost, setActivePost] = useState<PostData | null>(null)


    // 🔎 Debug render check
    // console.log("🔎 Render check:", { activeTab, viewMode, activeConversation, activePost })

    // ✅ Guarded sync effect: only runs in comments tab
    useEffect(() => {
        if (activeTab !== "comments") return

        if (activeConversation) {
            setActiveComment({
                id: `cmt_${activeConversation.user_id}`,
                conversationId: activeConversation.user_id,
                user_id: activeConversation.user_id,
                customerName: activeConversation.customerName,
                avatar: activeConversation.avatar ?? null,
                posts: activeConversation.posts ?? [],
                lastMessage: activeConversation.lastMessage ?? "",
                lastComment: activeConversation.lastMessage ?? "",
                status: activeConversation.status ?? "Waiting",
                timestamp: Date.now(),
                unreadCount: activeConversation.unreadCount ?? 0,
                priority: activeConversation.priority ?? "normal",
                type: "comment",
            })
        }
    }, [activeTab, activeConversation])

    // 🔹 Add missing states for PostQueue filters
    const [searchTerm, setSearchTerm] = useState("")
    const [filterPriority, setFilterPriority] = useState("all")
    const [dateFilter, setDateFilter] = useState("all")


    // 🔹 Always call hooks unconditionally
    const unreadCounts_all = useUnreadCounts(pageToken)
    const { currentPageId } = useFlowSession()

    function normalizeStatus(raw: string | undefined): ConversationStatus {
        switch (raw) {
            case "WAITING_CONVERSATION":
            case "Waiting":
                return "Waiting"
            case "AGENT_HANDLING":
            case "Agent active":
                return "Agent active"
            case "BOT_HANDLING":
            case "Bot active":
                return "Bot active"
            case "PENDING":
            case "Pending":
                return "Pending"
            default:
                return "Waiting"
        }
    }

    // Helper: get latest comment by timestamp
    function getLatestComment(comments: any[]) {
        if (!comments || comments.length === 0) return null
        return comments.reduce((latest, c) =>
            Number(c.timestamp) > Number(latest.timestamp) ? c : latest
        )
    }


    //   useEffect(() => {
    //     if (!currentPageId) return
    //     const queueRef = ref(db, `khmer-ai-chat/agent_queue/${currentPageId}`)
    //     const convListeners: Record<string, () => void> = {}
    //     const postsListeners: Record<string, () => void> = {}

    //     const unsubscribeQueue = onValue(queueRef, snapshot => {
    //         const queueData = snapshot.val() || {}
    //         console.log("📥 Raw queueData:", queueData)

    //         Object.entries(queueData).forEach(([key, conv]: [string, any]) => {
    //             const conversationId = conv.conversation_id
    //             if (!conversationId) return
    //             const uniqueId = key

    //             // 🔹 Messenger init
    //             if (key.startsWith("msg_")) {
    //                 setConversations(prev =>
    //                     prev.some(c => c.id === conversationId)
    //                         ? prev.map(c =>
    //                             c.id === conversationId
    //                                 ? { ...c, priority: conv.priority ?? "normal" }
    //                                 : c
    //                         )
    //                         : [
    //                             ...prev,
    //                             {
    //                                 id: conversationId,
    //                                 user_id: conv.user_id,
    //                                 customerName: conv.user_id,
    //                                 avatar: "/default-avatar.png",
    //                                 lastMessage: "",
    //                                 lastComment: "",
    //                                 status: conv.state,
    //                                 timestamp: Date.now() / 1000,
    //                                 routing: conv.routing,
    //                                 priority: conv.priority ?? "normal",
    //                                 type: "message",
    //                                 messages: [],
    //                                 flowLogs: [],
    //                                 posts: [],
    //                                 unreadCount: 0,
    //                                 lastReadTimestamp: 0,
    //                                 lastReadCommentTimestamp: 0,
    //                             } as Conversation,
    //                         ]
    //                 )

    //                 // 🔹 Messenger listener
    //                 const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conversationId}`)
    //                 if (!convListeners[uniqueId]) {
    //                     const unsubscribeConv = onValue(convRef, snap => {
    //                         const convData = snap.val() || {}
    //                         const meta = convData.meta || {}
    //                         const customerName = meta.name || convData.customerName || conv.user_id || "Unknown User"
    //                         const avatar = meta.avatar || convData.avatar || "/default-avatar.png"

    //                         const messagesArray: ConversationMessage[] = Object.values(convData.messages || {})
    //                         const lastRead = Number(meta.lastReadTimestamp) || 0
    //                         const unreadCount = messagesArray.filter(m => Number(m.timestamp) > lastRead).length

    //                         // ✅ PATCHED: compute unreadCommentCount instead of using postData.unreadCommentCount ?? 0
    //                         const normalizedPosts: PostData[] = Object.entries(convData.posts || {}).map(
    //                             ([postId, postData]: [string, any]) => {
    //                                 const commentsArray = normalizeComments(postData.comments)
    //                                 const sortedComments = commentsArray.sort(
    //                                     (a, b) => Number(b.timestamp) - Number(a.timestamp) // newest first
    //                                 )

    //                                 const lastReadPost = Number(postData.meta?.lastReadPostTimestamp) || 0
    //                                 const unreadCommentCount = sortedComments.filter(
    //                                     c => Number(c.timestamp) > lastReadPost
    //                                 ).length

    //                                 console.log("📊 Messenger listener post calc:", {
    //                                     postId,
    //                                     totalComments: sortedComments.length,
    //                                     lastReadPost,
    //                                     unreadCommentCount,
    //                                 })

    //                                 return {
    //                                     id: postId,
    //                                     post: {
    //                                         id: postId,
    //                                         title:
    //                                             postData.post?.title ??
    //                                             postData.meta?.title ??
    //                                             postData.title ??
    //                                             "Untitled",
    //                                         ...postData.post,
    //                                     },
    //                                     comments: sortedComments,
    //                                     clusters: postData.clusters ? Object.values(postData.clusters) : [],
    //                                     priority: postData.priority ?? "normal",
    //                                     lastReadTimestamp: lastReadPost,
    //                                     unreadCommentCount,   // ✅ computed here
    //                                 }
    //                             }
    //                         )

    //                         const latestMessageText =
    //                             messagesArray.length > 0
    //                                 ? messagesArray[messagesArray.length - 1].text ?? ""
    //                                 : ""

    //                         const safeFields: Partial<Conversation> = {
    //                             customerName,
    //                             avatar,
    //                             status: normalizeStatus(convData.status || convData.state),
    //                             timestamp: Date.now() / 1000,
    //                             routing: conv.routing,
    //                             lastReadTimestamp: lastRead,
    //                             lastReadCommentTimestamp: convData.lastReadCommentTimestamp || 0,
    //                             unreadCount,
    //                             messages: messagesArray,
    //                             flowLogs: Object.values(convData.flowLogs || {}),
    //                             posts: normalizedPosts, // ✅ now valid PostData[] with computed unread counts
    //                             lastMessage: latestMessageText,
    //                         }

    //                         setConversations(prev => {
    //                             const updated = prev.some(c => c.id === conversationId)
    //                                 ? prev.map(c =>
    //                                     c.id === conversationId
    //                                         ? ({ ...c, ...safeFields, priority: c.priority } as Conversation)
    //                                         : c
    //                                 )
    //                                 : [
    //                                     ...prev,
    //                                     {
    //                                         id: conversationId,
    //                                         user_id: conv.user_id,
    //                                         type: "message",
    //                                         priority: conv.priority ?? "normal",
    //                                         ...safeFields,
    //                                     } as Conversation,
    //                                 ]

    //                             const priorityOrder: Record<'normal' | 'high' | 'urgent', number> = { urgent: 3, high: 2, normal: 1 }
    //                             return updated.sort((a, b) => {
    //                                 const pa = priorityOrder[a.priority]
    //                                 const pb = priorityOrder[b.priority]
    //                                 if (pa !== pb) return pb - pa
    //                                 return Number(b.timestamp) - Number(a.timestamp)
    //                             })
    //                         })

    //                         setActiveConversation(prev => {
    //                             if (prev && prev.id === conversationId) {
    //                                 return { ...prev, ...safeFields, priority: prev.priority }
    //                             }
    //                             return prev
    //                         })
    //                     })
    //                     convListeners[uniqueId] = unsubscribeConv
    //                 }

    //             }

    //             // 🔹 Comment init
    //             if (key.startsWith("cmt_")) {
    //                 setComments(prev =>
    //                     prev.some(c => c.id === uniqueId)
    //                         ? prev.map(c =>
    //                             c.id === uniqueId
    //                                 ? { ...c, priority: conv.priority ?? "normal" }
    //                                 : c
    //                         )
    //                         : [
    //                             ...prev,
    //                             {
    //                                 id: uniqueId,
    //                                 conversationId,
    //                                 user_id: conv.user_id,
    //                                 customerName: conv.user_id,
    //                                 avatar: "/default-avatar.png",
    //                                 lastMessage: "(no comments yet)",
    //                                 lastComment: "(no comments yet)",
    //                                 status: conv.state,
    //                                 timestamp: Date.now() / 1000,
    //                                 posts: [],
    //                                 lastReadCommentTimestamp: 0,
    //                                 unreadCount: 0,
    //                                 priority: conv.priority ?? "normal",
    //                                 type: "comment",
    //                             } as CommentConversation,
    //                         ]
    //                 )

    //                 // 🔹 Comment listener
    //                 const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conversationId}`)
    //                 if (!convListeners[uniqueId]) {
    //                     const unsubscribeConv = onValue(convRef, snap => {
    //                         const convData = snap.val() || {}
    //                         const meta = convData.meta || {}
    //                         const customerName = meta.name || convData.customerName || conv.user_id || "Unknown User"
    //                         const avatar = meta.avatar || convData.avatar || "/default-avatar.png"

    //                         const normalizedPosts: PostData[] = Object.entries(convData.posts || {}).map(
    //                             ([postId, postData]: [string, any]) => {
    //                                 const commentsArray = normalizeComments(postData.comments)
    //                                 const sortedComments = commentsArray.sort(
    //                                     (a, b) => Number(b.timestamp) - Number(a.timestamp) // newest first
    //                                 )


    //                                 return {
    //                                     id: postId,
    //                                     post: postData.post ?? { id: postId, title: "Untitled" },
    //                                     comments: sortedComments, // ✅ always sorted
    //                                     clusters: postData.clusters ? Object.values(postData.clusters) : [],
    //                                     priority: postData.priority ?? "normal",
    //                                     lastReadTimestamp: Number(postData.lastReadTimestamp) || 0,
    //                                     unreadCommentCount: postData.unreadCommentCount ?? 0,
    //                                 }
    //                             }
    //                         )


    //                         const allComments = normalizedPosts.flatMap(p => p.comments || [])
    //                         const lastRead = Number(meta.lastReadCommentTimestamp) || 0
    //                         const unreadCount = allComments.filter(c => Number(c.timestamp) > lastRead).length

    //                         const latestCommentObj = getLatestComment(allComments)
    //                         const latestCommentText = latestCommentObj?.text || "(no comments yet)"
    //                         const latestCommentTimestamp = latestCommentObj?.timestamp
    //                             ? Number(latestCommentObj.timestamp)
    //                             : Math.floor(Date.now() / 1000)

    //                         const newComment: CommentConversation = {
    //                             id: uniqueId,
    //                             conversationId,
    //                             user_id: conv.user_id,
    //                             customerName,
    //                             avatar,
    //                             lastMessage: latestCommentText,
    //                             lastComment: latestCommentText,
    //                             status: normalizeStatus(convData.status || convData.state),
    //                             timestamp: latestCommentTimestamp,
    //                             posts: [...normalizedPosts],
    //                             lastReadCommentTimestamp: lastRead,
    //                             unreadCount,
    //                             priority: conv.priority ?? "normal",
    //                             type: "comment",
    //                         }

    //                         setComments(prev => {
    //                             const updated = prev.some(c => c.id === newComment.id)
    //                                 ? prev.map(c =>
    //                                     c.id === newComment.id
    //                                         ? { ...newComment, priority: c.priority }
    //                                         : c
    //                                 )
    //                                 : [...prev, newComment]

    //                             return updated.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    //                         })

    //                         setActiveComment(prev =>
    //                             prev && prev.id === uniqueId
    //                                 ? { ...prev, ...newComment, priority: prev.priority }
    //                                 : newComment
    //                         )

    //                         setActiveConversation(prev => {
    //                             if (prev && prev.id === conversationId) {
    //                                 return {
    //                                     ...prev,
    //                                     posts: normalizedPosts, // ✅ update posts with new comments
    //                                 }
    //                             }
    //                             return prev
    //                         })

    //                     })

    //                     convListeners[uniqueId] = unsubscribeConv
    //                 }

    //                 // 🔹 Posts listener (ONLY for msg_)
    //                 if (!postsListeners[uniqueId]) {
    //                     const unsubscribePosts = onValue(convRef, snap => {
    //                         const convData = snap.val() || {}
    //                         const meta = convData.meta || {}
    //                         const customerName = meta.name || convData.customerName || conv.user_id || "Unknown User"
    //                         const avatar = meta.avatar || convData.avatar || "/default-avatar.png"

    //                         const normalizedPosts: PostData[] = Object.entries(convData.posts || {}).map(
    //                             ([postId, postData]: [string, any]) => {
    //                                 const commentsArray = normalizeComments(postData.comments)
    //                                 const sortedComments = commentsArray.sort(
    //                                     (a, b) => Number(b.timestamp) - Number(a.timestamp)
    //                                 )

    //                                 const lastRead = Number(postData.meta?.lastReadPostTimestamp) || 0
    //                                 const unreadCommentCount = sortedComments.filter(
    //                                     c => Number(c.timestamp) > lastRead
    //                                 ).length

    //                                 console.log("📊 Post unread calculation:", {
    //                                     postId,
    //                                     totalComments: sortedComments.length,
    //                                     lastRead,
    //                                     unreadCommentCount,
    //                                 })

    //                                 const postObj: PostData = {
    //                                     id: postId,
    //                                     post: postData.post ?? { id: postId, title: "Untitled" },
    //                                     comments: sortedComments,
    //                                     clusters: postData.clusters ? Object.values(postData.clusters) : [],
    //                                     priority: postData.priority ?? "normal",
    //                                     lastReadTimestamp: lastRead,
    //                                     unreadCommentCount,   // ✅ computed here
    //                                 }

    //                                 console.log("📊 Normalized post object:", postObj)
    //                                 return postObj
    //                             }
    //                         )

    //                         console.log("📊 NormalizedPosts array:", normalizedPosts)


    //                         // ✅ compute total unread across all posts
    //                         const totalUnread = normalizedPosts.reduce(
    //                             (sum, p) => sum + (p.unreadCommentCount ?? 0),
    //                             0
    //                         )

    //                         console.log("📊 About to setConversations with:", {
    //                             conversationId,
    //                             posts: normalizedPosts.map(p => ({ id: p.id, unread: p.unreadCommentCount })),
    //                             totalUnread
    //                         })


    //                         const postConversation: Conversation = {
    //                             id: conversationId,
    //                             user_id: conv.user_id,
    //                             customerName,
    //                             avatar,
    //                             lastMessage: normalizedPosts.at(-1)?.post?.title ?? "",
    //                             lastComment: normalizedPosts.at(-1)?.comments?.at(-1)?.text ?? "",
    //                             status: normalizeStatus(convData.status || convData.state),
    //                             timestamp: normalizedPosts.at(-1)?.comments?.at(-1)?.timestamp
    //                                 ? Number(normalizedPosts.at(-1)!.comments!.at(-1)!.timestamp)
    //                                 : Date.now() / 1000,
    //                             routing: "post",
    //                             priority: conv.priority ?? "normal",
    //                             type: "post",
    //                             messages: [],
    //                             flowLogs: [],
    //                             posts: normalizedPosts,       // ✅ posts now include unread counts
    //                             unreadCount: totalUnread,     // ✅ aggregate unread
    //                         }

    //                         setConversations(prev => {
    //                             const merged = [
    //                                 ...prev.filter(c => c.type !== "post" || c.id !== conversationId),
    //                                 postConversation,
    //                             ]

    //                             console.log("📊 setConversations merged:", merged.map(c => ({
    //                                 id: c.id,
    //                                 type: c.type,
    //                                 posts: c.posts?.map(p => ({ id: p.id, unread: p.unreadCommentCount }))
    //                             })))

    //                             return merged.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    //                         })


    //                         setActiveConversation(prev => {
    //                             if (prev && prev.id === conversationId) {
    //                                 return {
    //                                     ...prev,
    //                                     posts: normalizedPosts,   // ✅ keep posts in sync
    //                                     unreadCount: totalUnread, // ✅ keep aggregate in sync
    //                                 }
    //                             }
    //                             return prev
    //                         })
    //                     })
    //                     postsListeners[uniqueId] = unsubscribePosts
    //                 }


    //             }
    //         })
    //     })

    //     return () => {
    //         unsubscribeQueue()
    //         Object.values(convListeners).forEach(unsub => unsub())
    //         Object.values(postsListeners).forEach(unsub => unsub())
    //     }
    // }, [currentPageId])



    useEffect(() => {
        if (!currentPageId) return
        const queueRef = ref(db, `khmer-ai-chat/agent_queue/${currentPageId}`)
        const convListeners: Record<string, () => void> = {}
        const postsListeners: Record<string, () => void> = {}

        const unsubscribeQueue = onValue(queueRef, snapshot => {
            const queueData = snapshot.val() || {}
            console.log("📥 Raw queueData:", queueData)

            Object.entries(queueData).forEach(([key, conv]: [string, any]) => {
                const conversationId = conv.conversation_id
                if (!conversationId) return
                const uniqueId = key

                // 🔹 Messenger init
                if (key.startsWith("msg_")) {
                    console.log("🟢 Messenger init for:", conversationId, conv)

                    setConversations(prev => {
                        if (!conversationId) {
                            console.warn("⚠️ Missing conversationId for msg_", key)
                            return prev
                        }

                        const exists = prev.some(c => c.id === conversationId)
                        console.log("🔍 Conversation exists?", exists, "Prev length:", prev.length)

                        if (exists) {
                            console.log("✏️ Updating existing conversation:", conversationId)
                            return prev.map(c =>
                                c.id === conversationId
                                    ? { ...c, priority: conv.priority ?? "normal" }
                                    : c
                            )
                        } else {
                            console.log("➕ Inserting new conversation:", conversationId)
                            const newConv: Conversation = {
                                id: conversationId,
                                user_id: conv.user_id,
                                customerName: conv.user_id,
                                avatar: "/default-avatar.png",
                                lastMessage: "",
                                lastComment: "",
                                status: conv.state,
                                timestamp: Date.now() / 1000,
                                routing: conv.routing,
                                priority: conv.priority ?? "normal",
                                type: "message",
                                messages: [],
                                flowLogs: [],
                                posts: [],
                                unreadCount: 0,
                                lastReadTimestamp: 0,
                                lastReadCommentTimestamp: 0,
                            }
                            console.log("📌 New conversation object:", newConv)
                            return [...prev, newConv]
                        }
                    })


                    // 🔹 Messenger listener
                    const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conversationId}`)
                    if (!convListeners[uniqueId]) {
                        const unsubscribeConv = onValue(convRef, snap => {
                            const convData = snap.val() || {}
                            console.log("📡 Messenger listener snapshot for:", conversationId, convData)

                            const meta = convData.meta || {}
                            const customerName = meta.name || convData.customerName || conv.user_id || "Unknown User"
                            const avatar = meta.avatar || convData.avatar || "/default-avatar.png"

                            const messagesArray: ConversationMessage[] = Object.values(convData.messages || {})
                            console.log("💬 MessagesArray length:", messagesArray.length)

                            const lastRead = Number(meta.lastReadTimestamp) || 0
                            // ✅ Only count user messages as unread
                            const unreadCount = messagesArray.filter(
                                m => m.sender === "user" && Number(m.timestamp) > lastRead
                            ).length


                            // ✅ PATCHED: compute unreadCommentCount instead of using postData.unreadCommentCount ?? 0
                            const normalizedPosts: PostData[] = Object.entries(convData.posts || {}).map(
                                ([postId, postData]: [string, any]) => {
                                    const commentsArray = normalizeComments(postData.comments)
                                    const sortedComments = commentsArray.sort(
                                        (a, b) => Number(b.timestamp) - Number(a.timestamp) // newest first
                                    )

                                    const lastReadPost = Number(postData.meta?.lastReadPostTimestamp) || 0
                                    const unreadCommentCount = sortedComments.filter(
                                        c => Number(c.timestamp) > lastReadPost
                                    ).length

                                    console.log("📊 Messenger listener post calc:", {
                                        postId,
                                        totalComments: sortedComments.length,
                                        lastReadPost,
                                        unreadCommentCount,
                                    })

                                    return {
                                        id: postId,
                                        post: {
                                            id: postId,
                                            title:
                                                postData.post?.title ??
                                                postData.meta?.title ??
                                                postData.title ??
                                                "Untitled",
                                            ...postData.post,
                                        },
                                        comments: sortedComments,
                                        clusters: postData.clusters ? Object.values(postData.clusters) : [],
                                        priority: postData.priority ?? "normal",
                                        lastReadTimestamp: lastReadPost,
                                        unreadCommentCount,   // ✅ computed here
                                    }
                                }
                            )

                            const latestMessageText =
                                messagesArray.length > 0
                                    ? messagesArray[messagesArray.length - 1].text ?? ""
                                    : ""
                            console.log("📝 Latest message text:", latestMessageText)

                            const safeFields: Partial<Conversation> = {
                                customerName,
                                avatar,
                                status: normalizeStatus(convData.status || convData.state),
                                timestamp: Date.now() / 1000,
                                routing: conv.routing,
                                lastReadTimestamp: lastRead,
                                lastReadCommentTimestamp: convData.lastReadCommentTimestamp || 0,
                                unreadCount,
                                messages: messagesArray,
                                flowLogs: Object.values(convData.flowLogs || {}),
                                posts: normalizedPosts, // ✅ now valid PostData[] with computed unread counts
                                lastMessage: latestMessageText,
                            }

                            console.log("🛠️ SafeFields prepared:", safeFields)

                            setConversations(prev => {
                                console.log("📊 setConversations before update length:", prev.length)

                                // ✅ Remove any existing conversation with the same id
                                const withoutThis = prev.filter(c => c.id !== conversationId)

                                // ✅ Add the new/updated conversation
                                const updated = [...withoutThis, {
                                    id: conversationId,
                                    user_id: conv.user_id,
                                    type: "message",   // enforce type for messages
                                    priority: conv.priority ?? "normal",
                                    ...safeFields,
                                } as Conversation]

                                console.log("📊 setConversations after update length:", updated.length)

                                // ✅ Sort by priority then timestamp
                                const priorityOrder: Record<'normal' | 'high' | 'urgent', number> = {
                                    urgent: 3,
                                    high: 2,
                                    normal: 1
                                }
                                return updated.sort((a, b) => {
                                    const pa = priorityOrder[a.priority]
                                    const pb = priorityOrder[b.priority]
                                    if (pa !== pb) return pb - pa
                                    return Number(b.timestamp) - Number(a.timestamp)
                                })
                            })



                            setActiveConversation(prev => {
                                if (prev && prev.id === conversationId) {
                                    return { ...prev, ...safeFields, priority: prev.priority }
                                }
                                return prev
                            })
                        })
                        convListeners[uniqueId] = unsubscribeConv
                    }

                }

                // 🔹 Comment init
                if (key.startsWith("cmt_")) {
                    setComments(prev =>
                        prev.some(c => c.id === uniqueId)
                            ? prev.map(c =>
                                c.id === uniqueId
                                    ? { ...c, priority: conv.priority ?? "normal" }
                                    : c
                            )
                            : [
                                ...prev,
                                {
                                    id: uniqueId,
                                    conversationId,
                                    user_id: conv.user_id,
                                    customerName: conv.user_id,
                                    avatar: "/default-avatar.png",
                                    lastMessage: "(no comments yet)",
                                    lastComment: "(no comments yet)",
                                    status: conv.state,
                                    timestamp: Date.now() / 1000,
                                    posts: [],
                                    lastReadCommentTimestamp: 0,
                                    unreadCount: 0,
                                    priority: conv.priority ?? "normal",
                                    type: "comment",
                                } as CommentConversation,
                            ]
                    )

                    // 🔹 Comment listener
                    const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conversationId}`)
                    if (!convListeners[uniqueId]) {
                        const unsubscribeConv = onValue(convRef, snap => {
                            const convData = snap.val() || {}
                            const meta = convData.meta || {}
                            const customerName = meta.name || convData.customerName || conv.user_id || "Unknown User"
                            const avatar = meta.avatar || convData.avatar || "/default-avatar.png"

                            const normalizedPosts: PostData[] = Object.entries(convData.posts || {}).map(
                                ([postId, postData]: [string, any]) => {
                                    const commentsArray = normalizeComments(postData.comments)
                                    const sortedComments = commentsArray.sort(
                                        (a, b) => Number(b.timestamp) - Number(a.timestamp) // newest first
                                    )


                                    return {
                                        id: postId,
                                        post: postData.post ?? { id: postId, title: "Untitled" },
                                        comments: sortedComments, // ✅ always sorted
                                        clusters: postData.clusters ? Object.values(postData.clusters) : [],
                                        priority: postData.priority ?? "normal",
                                        lastReadTimestamp: Number(postData.lastReadTimestamp) || 0,
                                        unreadCommentCount: postData.unreadCommentCount ?? 0,
                                    }
                                }
                            )


                            const allComments = normalizedPosts.flatMap(p => p.comments || [])
                            const lastRead = Number(meta.lastReadCommentTimestamp) || 0
                            const unreadCount = allComments.filter(c => Number(c.timestamp) > lastRead).length

                            const latestCommentObj = getLatestComment(allComments)
                            const latestCommentText = latestCommentObj?.text || "(no comments yet)"
                            const latestCommentTimestamp = latestCommentObj?.timestamp
                                ? Number(latestCommentObj.timestamp)
                                : Math.floor(Date.now() / 1000)

                            const newComment: CommentConversation = {
                                id: uniqueId,
                                conversationId,
                                user_id: conv.user_id,
                                customerName,
                                avatar,
                                lastMessage: latestCommentText,
                                lastComment: latestCommentText,
                                status: normalizeStatus(convData.status || convData.state),
                                timestamp: latestCommentTimestamp,
                                posts: [...normalizedPosts],
                                lastReadCommentTimestamp: lastRead,
                                unreadCount,
                                priority: conv.priority ?? "normal",
                                type: "comment",
                            }

                            setComments(prev => {
                                const updated = prev.some(c => c.id === newComment.id)
                                    ? prev.map(c =>
                                        c.id === newComment.id
                                            ? { ...newComment, priority: c.priority }
                                            : c
                                    )
                                    : [...prev, newComment]

                                return updated.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                            })

                            setActiveComment(prev => {
                                if (!prev || prev.id !== uniqueId) return prev
                                return { ...prev, ...newComment, priority: prev.priority }
                            })

                            setActiveConversation(prev => {
                                if (prev && prev.id === conversationId) {
                                    return {
                                        ...prev,
                                        posts: normalizedPosts, // ✅ update posts with new comments
                                    }
                                }
                                return prev
                            })

                        })

                        convListeners[uniqueId] = unsubscribeConv
                    }

                    // 🔹 Posts listener (ONLY for msg_)
                    if (!postsListeners[uniqueId]) {
                        const unsubscribePosts = onValue(convRef, snap => {
                            const convData = snap.val() || {}
                            const meta = convData.meta || {}
                            const customerName = meta.name || convData.customerName || conv.user_id || "Unknown User"
                            const avatar = meta.avatar || convData.avatar || "/default-avatar.png"

                            const normalizedPosts: PostData[] = Object.entries(convData.posts || {}).map(
                                ([postId, postData]: [string, any]) => {
                                    const commentsArray = normalizeComments(postData.comments)
                                    const sortedComments = commentsArray.sort(
                                        (a, b) => Number(b.timestamp) - Number(a.timestamp)
                                    )

                                    const lastRead = Number(postData.meta?.lastReadPostTimestamp) || 0
                                    const unreadCommentCount = sortedComments.filter(
                                        c => Number(c.timestamp) > lastRead
                                    ).length

                                    console.log("📊 Post unread calculation:", {
                                        postId,
                                        totalComments: sortedComments.length,
                                        lastRead,
                                        unreadCommentCount,
                                    })

                                    const postObj: PostData = {
                                        id: postId,
                                        post: postData.post ?? { id: postId, title: "Untitled" },
                                        comments: sortedComments,
                                        clusters: postData.clusters ? Object.values(postData.clusters) : [],
                                        priority: postData.priority ?? "normal",
                                        lastReadTimestamp: lastRead,
                                        unreadCommentCount,   // ✅ computed here
                                    }

                                    console.log("📊 Normalized post object:", postObj)
                                    return postObj
                                }
                            )

                            console.log("📊 NormalizedPosts array:", normalizedPosts)


                            // ✅ compute total unread across all posts
                            const totalUnread = normalizedPosts.reduce(
                                (sum, p) => sum + (p.unreadCommentCount ?? 0),
                                0
                            )

                            console.log("📊 About to setConversations with:", {
                                conversationId,
                                posts: normalizedPosts.map(p => ({ id: p.id, unread: p.unreadCommentCount })),
                                totalUnread
                            })


                            const postConversation: Conversation = {
                                id: conversationId,
                                user_id: conv.user_id,
                                customerName,
                                avatar,
                                lastMessage: normalizedPosts.at(-1)?.post?.title ?? "",
                                lastComment: normalizedPosts.at(-1)?.comments?.at(-1)?.text ?? "",
                                status: normalizeStatus(convData.status || convData.state),
                                timestamp: normalizedPosts.at(-1)?.comments?.at(-1)?.timestamp
                                    ? Number(normalizedPosts.at(-1)!.comments!.at(-1)!.timestamp)
                                    : Date.now() / 1000,
                                routing: "post",
                                priority: conv.priority ?? "normal",
                                type: "post",
                                messages: [],
                                flowLogs: [],
                                posts: normalizedPosts,       // ✅ posts now include unread counts
                                unreadCount: totalUnread,     // ✅ aggregate unread
                            }

                            setPostConversations(prev => {
                                const withoutThis = prev.filter(p => p.id !== conversationId)
                                const updated = [...withoutThis, postConversation]
                                return updated.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                            })


                            setActiveConversation(prev => {
                                if (prev && prev.id === conversationId) {
                                    return {
                                        ...prev,
                                        posts: normalizedPosts,   // ✅ keep posts in sync
                                        unreadCount: totalUnread, // ✅ keep aggregate in sync
                                    }
                                }
                                return prev
                            })
                        })
                        postsListeners[uniqueId] = unsubscribePosts
                    }


                }
            })
        })

        return () => {
            unsubscribeQueue()
            Object.values(convListeners).forEach(unsub => unsub())
            Object.values(postsListeners).forEach(unsub => unsub())
        }
    }, [currentPageId])


    useEffect(() => {
        if (!activeComment) return
        const updated = comments.find(c => c.id === activeComment.id)
        if (updated) {
            // console.log("🔄 Syncing activeComment with updated CommentConversation:", updated)
            setActiveComment(updated)
        }
    }, [comments])




    // const handleSelectConversation = (conv: Conversation) => {
    //     const now = Date.now() / 1000
    //     console.log("▶️ handleSelectConversation clicked:", conv.id, "queue priority=", conv.priority)

    //     update(
    //         ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/meta`),
    //         { lastReadTimestamp: now }
    //     )

    //     const initialConv: Conversation = {
    //         ...conv,
    //         lastReadTimestamp: now,
    //         timestamp: now,
    //         messages: [],
    //         flowLogs: [],
    //         posts: [],   // ✅ no posts here
    //         priority: conv.priority ?? "normal",
    //         lastMessage: conv.lastMessage,
    //     }

    //     setActiveConversation(initialConv)
    //     setViewMode("timeline")

    //     // Metadata listener
    //     const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}`)
    //     onValue(convRef, snapshot => {
    //         const convData = snapshot.val() || {}
    //         const { priority: _ignoredPriority, lastMessage: _ignoredLastMessage, posts: _ignoredPosts, ...safeConvData } = convData

    //         setActiveConversation(prev => {
    //             const newPriority = conv.priority ?? prev?.priority ?? "normal"
    //             return prev
    //                 ? { ...prev, ...safeConvData, priority: newPriority, messages: prev.messages, lastMessage: prev.lastMessage }
    //                 : { ...initialConv, ...safeConvData, priority: newPriority, messages: [], lastMessage: initialConv.lastMessage }
    //         })
    //     })


    //     // Messages listener
    //     const msgsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/messages`)
    //     onValue(msgsRef, snapshot => {
    //         const raw = snapshot.val() || {}
    //         const msgs: ConversationMessage[] = Object.entries(raw).map(([id, m]: any) => ({
    //             id,
    //             sender: m.sender,
    //             text: m.text,
    //             timestamp: m.timestamp ?? now,
    //             imageUrl: m.imageUrl,
    //             videoUrl: m.videoUrl,
    //             audioUrl: m.audioUrl,
    //             images: m.images || [],
    //             videos: m.videos || [],
    //             audios: m.audios || [],
    //         }))

    //         const latestMessage = msgs[msgs.length - 1]?.text ?? initialConv.lastMessage

    //         setActiveConversation(prev =>
    //             prev ? { ...prev, messages: msgs, lastMessage: latestMessage } : { ...initialConv, messages: msgs, lastMessage: latestMessage }
    //         )
    //     })

    //     // FlowLogs listener
    //     const logsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/flowLogs`)
    //     onValue(logsRef, snapshot => {
    //         const logs: FlowLog[] = Object.entries(snapshot.val() || {}).map(([id, l]: any) => ({
    //             id,
    //             name: l.name,
    //             timestamp: l.timestamp ?? now,
    //         }))
    //         setActiveConversation(prev =>
    //             prev ? { ...prev, flowLogs: logs } : { ...initialConv, flowLogs: logs }
    //         )
    //     })
    // }


    // const handleSelectComment = (conv: CommentConversation) => {
    //     const now = Date.now() / 1000
    //     console.log("▶️ handleSelectComment clicked:", conv.id, "queue priority=", conv.priority)

    //     update(
    //         ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}/meta`),
    //         { lastReadCommentTimestamp: now }
    //     )

    //     const initialConv: Conversation = {
    //         id: conv.conversationId ?? conv.id,
    //         user_id: conv.user_id,
    //         customerName: conv.customerName,
    //         avatar: conv.avatar,
    //         lastMessage: conv.lastMessage,
    //         lastComment: conv.lastComment,
    //         status: conv.status as ConversationStatus,
    //         timestamp: conv.timestamp,
    //         routing: "comment",
    //         priority: conv.priority ?? "normal",
    //         type: "comment",
    //         messages: [],
    //         flowLogs: [],
    //         posts: [],   // ✅ no posts here
    //         lastReadCommentTimestamp: now,
    //         lastReadTimestamp: 0,
    //         unreadCount: 0,
    //     }

    //     setActiveConversation(initialConv)
    //     setViewMode("timeline")



    //     // ✅ Scoped listener: only this conversation
    //     const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.conversationId ?? conv.id}`)
    //     onValue(convRef, snapshot => {
    //         const convData = snapshot.val() || {}
    //         setActiveConversation(prev => ({
    //             ...prev!,
    //             ...convData,
    //             priority: convData.priority ?? prev?.priority ?? "normal"
    //         }))
    //     })

    // }


    const handleSelectConversation = (conv: Conversation) => {
        const now = Date.now() / 1000
        console.log("▶️ handleSelectConversation clicked:", conv.id, "queue priority=", conv.priority)

        // Mark as read in Firebase
        update(
            ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/meta`),
            { lastReadTimestamp: now }
        )

        // Initial conversation object
        const initialConv: Conversation = {
            ...conv,
            type: "message",              // ✅ enforce type here
            lastReadTimestamp: now,
            priority: conv.priority ?? "normal",
            messages: conv.messages ?? [],
            flowLogs: conv.flowLogs ?? [],
            posts: conv.posts ?? [],
            lastMessage: conv.lastMessage ?? "",
            timestamp: conv.timestamp ?? now,
        }

        setActiveConversation(initialConv)
        setViewMode("timeline")

        // 🔹 Metadata listener
        const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}`)
        onValue(convRef, snapshot => {
            const convData = snapshot.val() || {}
            // const meta = convData.meta || {}

            setActiveConversation(prev => {
                if (!prev) return { ...initialConv, ...convData, type: "message" }

                const newPriority = conv.priority ?? prev.priority ?? "normal"

                return {
                    ...prev,
                    ...convData,
                    type: "message",             // ✅ enforce here too
                    priority: newPriority,
                    // Preserve messages and lastMessage if already set
                    messages: prev.messages,
                    posts: convData.posts ? Object.values(convData.posts) : prev.posts,
                    lastMessage: convData.lastMessage ?? prev.lastMessage,
                    timestamp: convData.timestamp ?? prev.timestamp,
                }
            })
        })

        // 🔹 Messages listener
        const msgsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/messages`)
        onValue(msgsRef, snapshot => {
            const raw = snapshot.val() || {}
            const msgs: ConversationMessage[] = Object.entries(raw).map(([id, m]: any) => ({
                id,
                sender: m.sender,
                text: m.text,
                timestamp: m.timestamp ?? now,
                imageUrl: m.imageUrl,
                videoUrl: m.videoUrl,
                audioUrl: m.audioUrl,
                images: m.images || [],
                videos: m.videos || [],
                audios: m.audios || [],
            }))

            const latestMessage = msgs[msgs.length - 1]?.text ?? initialConv.lastMessage

            setActiveConversation(prev =>
                prev
                    ? { ...prev, type: "message", messages: msgs, lastMessage: latestMessage }
                    : { ...initialConv, type: "message", messages: msgs, lastMessage: latestMessage }
            )
        })

        // 🔹 FlowLogs listener
        const logsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/flowLogs`)
        onValue(logsRef, snapshot => {
            const logs: FlowLog[] = Object.entries(snapshot.val() || {}).map(([id, l]: any) => ({
                id,
                name: l.name,
                timestamp: l.timestamp ?? now,
            }))
            setActiveConversation(prev =>
                prev
                    ? { ...prev, type: "message", flowLogs: logs }
                    : { ...initialConv, type: "message", flowLogs: logs }
            )
        })
    }


    const handleSelectPostAggregated = (conv: Conversation, postId: string) => {
        const now = Date.now() / 1000
        console.log("▶️ handleSelectPostAggregated called", { postId })

        update(
            ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}/posts/${postId}/meta`),
            { lastReadPostTimestamp: now }
        )

        const convsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations`)
        onValue(convsRef, snapshot => {
            const convsObj = snapshot.val() || {}
            console.log("📥 conversations snapshot keys", Object.keys(convsObj))

            let aggregatedComments: Comment[] = []
            let postMeta: PostData["post"] | undefined
            const originMap: Record<string, { convId: string; convName?: string }> = {}

            Object.entries(convsObj).forEach(([convId, convData]: [string, any]) => {
                if (!convId || !convData) return // ✅ skip undefined branches

                const posts = convData.posts ?? {}
                const postData = posts[postId]
                if (postData) {
                    // ✅ capture metadata once
                    if (postData.post) {
                        postMeta = {
                            id: postData.post.id,
                            title: postData.post.title ?? "Untitled Post",
                            image: postData.post.image,
                            permalink: postData.post.permalink,
                        }
                    }

                    if (postData.comments) {
                        const normalized: Comment[] = normalizeComments(postData.comments)
                        console.log(`📊 conv ${convId} normalized comments`, { count: normalized.length })

                        aggregatedComments = aggregatedComments.concat(normalized)

                        normalized.forEach(c => {
                            originMap[c.id] = { convId, convName: convData.customerName }
                        })
                    }
                }
            })

            // Deduplicate and sort
            const uniqueComments: Comment[] = Object.values(
                aggregatedComments.reduce((acc, c) => {
                    if (c.id) acc[c.id] = c
                    return acc
                }, {} as Record<string, Comment>)
            )

            const sortedComments: Comment[] = uniqueComments.sort(
                (a, b) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0)
            )

            console.log("📊 Aggregated comments final", { count: sortedComments.length })

            const unreadCommentCount = sortedComments.filter(
                c => Number(c.timestamp ?? 0) > now
            ).length

            const aggregatedPost: PostData = {
                id: postId,
                post: postMeta,
                comments: sortedComments,
                lastReadTimestamp: now,
                unreadCommentCount,
                priority: "normal",
            }



            const updatedPosts = (conv.posts ?? []).map(p =>
                p.id === postId ? { ...p, lastReadTimestamp: now, unreadCommentCount: 0 } : p
            )

            const updatedUnreadCount = updatedPosts.reduce(
                (sum, p) => sum + (p.unreadCommentCount ?? 0),
                0
            )

            console.log("📊 Initial unread reset (aggregated)", { updatedPosts, updatedUnreadCount })

            setActiveConversation(prev => {
                if (!prev || prev.id !== conv.id) return prev

                return {
                    ...prev,
                    posts: updatedPosts,                // ✅ update posts
                    unreadCount: updatedUnreadCount,    // ✅ update unread counts
                    priority: conv.priority ?? prev.priority ?? "normal",
                    type: prev.type ?? "message",       // ✅ keep type consistent
                }
            })

            setActivePost(aggregatedPost)
            // setActiveTab("posts")        // ✅ switch to posts tab
            setViewMode("timeline")
            setCommentOrigins(originMap)
        })
    }

    const handleSelectComment = (conv: CommentConversation) => {
        const now = Date.now() / 1000
        console.log("▶️ handleSelectComment clicked:", conv.id, "queue priority=", conv.priority)

        // Mark as read in Firebase
        update(
            ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}/meta`),
            { lastReadCommentTimestamp: now }
        )

        const initialConv: Conversation = {
            id: conv.conversationId ?? conv.id,
            user_id: conv.user_id,
            customerName: conv.customerName,
            avatar: conv.avatar,
            lastMessage: conv.lastMessage,
            lastComment: conv.lastComment,
            status: conv.status as ConversationStatus,
            timestamp: conv.timestamp,
            routing: "comment",
            priority: conv.priority ?? "normal",
            type: "comment",
            messages: [],
            flowLogs: [],
            posts: [],
            lastReadCommentTimestamp: now,
            lastReadTimestamp: 0,
            unreadCount: 0,
        }

        // ✅ Set immediately so timeline shows
        setActiveConversation(initialConv)
        setActiveComment(conv)
        setViewMode("timeline")

        // ✅ Scoped listener: only this conversation
        const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.conversationId ?? conv.id}`)
        onValue(convRef, snapshot => {
            const convData = snapshot.val() || {}

            // Guard: only update if this is still the active conversation
            setActiveConversation(prev => {
                if (!prev || prev.id !== (conv.conversationId ?? conv.id)) return prev
                const newPriority = convData.priority ?? prev.priority ?? "normal"
                return {
                    ...prev,
                    ...convData,
                    priority: newPriority,
                    messages: prev.messages,
                    flowLogs: prev.flowLogs,
                    posts: prev.posts,
                }
            })

            // Guard: only update if this is still the active comment
            setActiveComment(prev => {
                if (!prev || prev.id !== conv.id) return prev

                // ✅ Normalize posts so each has comments as an array
                const normalizedPosts = Object.entries(convData.posts || {}).map(([postId, postData]: [string, any]) => ({
                    id: postId,
                    ...postData,
                    comments: Array.isArray(postData.comments)
                        ? postData.comments
                        : Object.values(postData.comments || {}),
                }))

                return {
                    ...prev,
                    customerName: convData.customerName ?? prev.customerName,
                    avatar: convData.avatar ?? prev.avatar,
                    posts: normalizedPosts,
                    lastReadCommentTimestamp: now,
                    unreadCount: prev.unreadCount,
                }
            })
        })
    }


    const handleCommenttReply = async (
        msg: string,
        commentIds: string[],
        pageToken: string,
        postId?: string   // ✅ allow postId to be passed in
    ) => {
        if (!activeConversation || !currentPageId) return

        // Use passed-in postId if available (comment mode), otherwise fall back to post mode
        const resolvedPostId =
            postId ??
            (activeConversation.type === "post"
                ? activeConversation.posts?.[0]?.id
                : null)

        if (!resolvedPostId) {
            toast.error("❌ No postId found for this conversation")
            return
        }

        toast.loading("⏳ Sending replies...")

        try {
            await Promise.all(
                commentIds.map(commentId =>
                    sendCommentReply(
                        commentId,
                        msg,
                        pageToken,
                        currentPageId,              // pageId
                        activeConversation.user_id, // userId
                        resolvedPostId              // ✅ correct postId
                    )
                )
            )
            toast.success(`✅ Sent ${commentIds.length} replies successfully`)
        } catch (err) {
            console.error("⚠️ Error sending some replies", err)
            toast.error("⚠️ Some replies failed")
        } finally {
            toast.dismiss()
        }
    }

    const handlePostReply = async (
        msg: string,
        targets: { commentId: string; postId: string; convId: string }[], // ✅ include convId
        pageToken: string
    ) => {
        if (!currentPageId) return

        toast.loading("⏳ Sending replies...")

        try {
            // Group by convId + postId
            const grouped = targets.reduce((acc, t) => {
                const key = `${t.convId}:${t.postId}`
                if (!acc[key]) acc[key] = []
                acc[key].push(t.commentId)
                return acc
            }, {} as Record<string, string[]>)

            // Send replies per (convId, postId)
            await Promise.all(
                Object.entries(grouped).map(([key, commentIds]) => {
                    const [convId, postId] = key.split(":")
                    return Promise.all(
                        commentIds.map(commentId =>
                            sendCommentReply(
                                commentId,
                                msg,
                                pageToken,
                                currentPageId, // pageId
                                convId,        // ✅ correct conversation/userId
                                postId         // ✅ correct postId
                            )
                        )
                    )
                })
            )

            toast.success(`✅ Sent ${targets.length} replies successfully`)
        } catch (err) {
            console.error("⚠️ Error sending some replies", err)
            toast.error("⚠️ Some replies failed")
        } finally {
            toast.dismiss()
        }
    }

    if (!currentPageId) {
        return (
            <div className="flex justify-center items-start h-screen bg-dark-900">
                <div className="w-80 bg-dark-800 rounded-lg shadow-lg p-6 mt-24 text-center space-y-4">
                    <h2 className="text-light-100 text-base font-medium">Select a page to continue</h2>
                    <PageSelector />
                </div>
            </div>
        )
    }

    // console.log("🔎 Render check:", { activeTab, viewMode, activeConversation, activePost })


    return (
        <DashboardLayout
            // remove SidebarTabs from sidebar
            sidebar={null}
            headerTitle="Agent Dashboard"
            footerStatus="online"
            footerVersion="v1.2.3"
            main={
                <div className="flex h-full">
                    {/* SidebarTabs column */}
                    <div className="hidden md:flex w-20 border-r border-dark-600 bg-dark-900">
                        <SidebarTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            unreadCounts_all={unreadCounts_all}
                        />
                    </div>

                    {/* Queue column */}
                    {(viewMode === "queue" || window.innerWidth >= 768) && (
                        <div className="w-full md:w-120 border-r border-teal-700 bg-dark-800 flex flex-col h-full">
                            <div className="flex-grow overflow-y-auto">
                                {activeTab === "messages" && (
                                    <>
                                        {console.log(
                                            "📤 Raw conversations in AgentDashboard:",
                                            conversations.map(c => ({
                                                id: c.id,
                                                type: c.type,
                                                lastMessage: c.lastMessage
                                            }))
                                        )}
                                        {console.log(
                                            "📤 Filtered for ConversationQueue:",
                                            conversations
                                                .filter(c => c.type === "message")
                                                .map(c => ({
                                                    id: c.id,
                                                    type: c.type,
                                                    lastMessage: c.lastMessage
                                                }))
                                        )}

                                        <ConversationQueue
                                            conversations={conversations.filter(c => c.type === "message")}  // ✅ only messages
                                            onSelect={(conv) => {
                                                handleSelectConversation(conv)
                                                setViewMode("timeline")
                                            }}
                                            activeConversationId={activeConversation?.id ?? null}
                                        />
                                    </>
                                )}



                                {activeTab === "comments" && (
                                    <CommentQueue
                                        comments={comments}
                                        onSelect={(comment) => {
                                            handleSelectComment(comment)
                                            setViewMode("timeline")
                                        }}
                                        activeCommentId={activeComment?.id ?? null}
                                    />
                                )}
                                {activeTab === "posts" && (
                                    <PostQueue
                                        posts={postConversations}   // 🔹 use the dedicated posts state
                                        onSelect={(conv, post) => {
                                            // conv is a full Conversation with user_id
                                            handleSelectPostAggregated(conv, post.id)
                                            setViewMode("timeline")
                                        }}
                                        activePostId={activePost?.id ?? null}
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        filterPriority={filterPriority}
                                        setFilterPriority={setFilterPriority}
                                        dateFilter={dateFilter}
                                        setDateFilter={setDateFilter}
                                    />
                                )}



                            </div>
                        </div>
                    )}


                    {/* Timeline column */}
                    <div className="flex-grow flex flex-col bg-dark-900">
                        <div className="flex-grow flex flex-col h-full overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                            {viewMode === "timeline" && (
                                <>
                                    {console.log("🔹 Render check", {
                                        activeTab,
                                        viewMode,
                                        hasConversation: !!activeConversation,
                                        hasPost: !!activePost,
                                    })}

                                    {activeTab === "messages" && activeConversation && (
                                        <ConversationTimeline
                                            conversation={activeConversation}
                                            currentPageId={currentPageId}
                                            setViewMode={setViewMode}
                                        />
                                    )}

                                    {activeTab === "comments" && activeComment && (
                                        <CommentTimeline
                                            posts={activeComment.posts ?? []}
                                            pageToken={pageToken}
                                            onSendCommentReply={handleCommenttReply}
                                            setViewMode={setViewMode}
                                            activeComment={activeComment}
                                        />
                                    )}

                                    {activeTab === "posts" && viewMode === "timeline" && activePost && (
                                        <PostTimeline
                                            post={activePost}
                                            pageToken={pageToken}
                                            onSendCommentReply={handlePostReply}
                                            setViewMode={setViewMode}
                                            commentOrigins={commentOrigins}
                                        />
                                    )}

                                </>
                            )}
                        </div>
                    </div>


                </div>
            }
        />
    )

}

