import { useState, useEffect } from "react"
import { db } from "~/lib/firebase"
import { ConversationQueue } from "../components/ConversationQueue"
import { ConversationTimeline } from "./ConversationTimeline"
import { SidebarTabs } from "./SidebarTabs"
import { DashboardLayout } from "./DashboardLayout"
import { useUnreadCounts } from "../hooks/useUnreadCounts"
import { useFlowSession } from '~/stores/flow-session'
import { PageSelector } from "~/modules/shared/components/PageSelector"
import { off, ref, onValue, update } from "firebase/database"
import type { Conversation, ConversationMessage, FlowLog, PostData, ConversationStatus, CommentConversation, PostConversation } from '~/modules/nodes/types'
import { CommentQueue } from "../components/CommentQueue"
import { PostQueue } from "../components/PostQueue"
import { CommentTimeline } from "../components/CommentTimeline"
import { PostTimeline } from "../components/PostTimeline"
import { sendCommentReply } from "../hooks/sendCommentReply"
import { normalizeComments, normalizePosts } from "~/utils/normalize.ts"
import { useApplicationState } from "~/stores/application-state"
export function AgentDashboard({
    setActiveConversation,
    pageToken,
}: {
    setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>
    pageToken: string
}) {
    // ✅ Pull activeTab + viewMode from global store
    const { activeTab, setActiveTab, viewMode, setViewMode } = useApplicationState((s) => ({
        activeTab: s.agentData.activeTab,
        setActiveTab: s.actions.agentData.setActiveTab,
        viewMode: s.agentData.viewMode,
        setViewMode: s.actions.agentData.setViewMode,
    }))
    const [unreadCommentCounts, setUnreadCommentCounts] = useState<Record<string, number>>({})
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})


    // Messages
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversation, _setActiveConversation] = useState<Conversation | null>(null)



    // Comments
    const [comments, setComments] = useState<CommentConversation[]>([])
    const [activeComment, setActiveComment] = useState<CommentConversation | null>(null)

    // Posts (if needed)
const handleSelectPost = (conv: PostConversation) => setActivePost(conv)

  const [activePost, setActivePost] = useState<PostConversation | null>(null)



    // derive post conversations and active postId
   const postConversations: PostConversation[] = conversations.filter(
  (c): c is PostConversation => c.type === "post"
)


const activePostId =
  activePost && activePost.type === "post"
    ? Object.keys((activePost as PostConversation).posts || {})[0] ?? null
    : null


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

    // useEffect(() => {
    //     if (!currentPageId) return
    //     const queueRef = ref(db, `khmer-ai-chat/agent_queue/${currentPageId}`)
    //     const convListeners: Record<string, () => void> = {}
    //     const postsListeners: Record<string, () => void> = {}

    //     const unsubscribeQueue = onValue(queueRef, snapshot => {
    //         const queueData = snapshot.val() || {}
    //         console.log("📥 Raw queueData:", queueData)

    //         Object.values(queueData).forEach((conv: any) => {
    //             const conversationId = conv.conversation_id
    //             if (!conversationId) return
    //             if (convListeners[conversationId]) return

    //             const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conversationId}`)
    //             const unsubscribeConv = onValue(convRef, snap => {
    //                 const convData = snap.val() || {}
    //                 console.log(`📥 Raw convData for ${conversationId}:`, convData)

    //                 // ✅ Normalize meta
    //                 const meta = convData.meta || {}
    //                 const customerName = meta.name || conv.user_id || "Unknown User"
    //                 const avatar = meta.avatar || "/default-avatar.png"
    //                 const updatedAt = convData.updatedAt || Date.now()

    //                 // Normalize posts
    //                 const normalizedPosts: PostData[] = Object.entries(convData.posts || {}).map(
    //                     ([postId, postData]: [string, any]) => ({
    //                         id: postId,
    //                         post: postData.post,
    //                         comments: normalizeComments(postData.comments)
    //                     })
    //                 )

    //                 // Calculate global unread count
    //                 const allComments = normalizedPosts.flatMap(p => p.comments || [])
    //                 const lastRead = Number(convData.lastReadCommentTimestamp) || 0
    //                 const unreadCount = allComments.filter(c => Number(c.timestamp) > lastRead).length
    //                 console.log(`🔎 Global unreadCount for ${conversationId}:`, { unreadCount, lastRead })

    //                 setUnreadCommentCounts(prev => {
    //                     const updated = { ...prev, [conv.user_id]: unreadCount }
    //                     console.log("🔄 Updated unreadCommentCounts (conv listener)", updated)
    //                     return updated
    //                 })

    //                 // ✅ Get latest comment text
    //                 const latestCommentText =
    //                     convData.lastComment ||                // use DB root field if available
    //                     normalizedPosts.flatMap(p => p.comments || []).slice(-1)[0]?.text ||
    //                     ""



    //                 // Build Conversation
    //                 const newConv: Conversation = {
    //                     id: conversationId,
    //                     user_id: conv.user_id,
    //                     customerName,
    //                     avatar,
    //                     lastMessage: convData.lastMessage || "(no messages yet)",
    //                     lastComment: latestCommentText || "(no comments yet)",   // ✅ use recalculated
    //                     status: normalizeStatus(convData.status || convData.state),
    //                     timestamp: updatedAt,
    //                     routing: conv.routing,
    //                     priority: conv.priority,
    //                     type: conv.type,
    //                     lastReadTimestamp: convData.lastReadTimestamp || 0,
    //                     lastReadCommentTimestamp: lastRead,
    //                     messages: Object.values(convData.messages || {}),
    //                     flowLogs: Object.values(convData.flowLogs || {}),
    //                     posts: normalizedPosts,
    //                 }

    //                 setConversations(prev =>
    //                     prev.some(c => c.id === conversationId)
    //                         ? prev.map(c => c.id === conversationId ? newConv : c)
    //                         : [...prev, newConv]
    //                 )

    //                 // Build CommentConversation list
    //                 const commentList: CommentConversation[] = normalizedPosts.map(post => {
    //                     const lastComment = post.comments?.[post.comments.length - 1]
    //                     return {
    //                         id: post.id,
    //                         user_id: conv.user_id,
    //                         customerName,
    //                         avatar,
    //                         lastMessage: lastComment?.text ?? "",
    //                         lastComment: lastComment?.text ?? "",
    //                         status: "Waiting",
    //                         timestamp: lastComment?.timestamp ?? updatedAt,   // ✅ use comment timestamp
    //                         posts: [post],
    //                         lastReadCommentTimestamp: lastRead,
    //                     }
    //                 })

    //                 setComments(prev =>
    //                     prev.some(c => c.user_id === conv.user_id)
    //                         ? prev.map(c =>
    //                             c.user_id === conv.user_id
    //                                 ? { ...c, posts: normalizedPosts, customerName, avatar, lastComment: latestCommentText }
    //                                 : c
    //                         )
    //                         : [...prev, ...commentList]
    //                 )
    //                 setActiveComment({
    //                     id: conversationId,
    //                     user_id: conv.user_id,
    //                     customerName,
    //                     avatar,
    //                     lastMessage: convData.lastMessage || "",
    //                     lastComment: latestCommentText,   // ✅ use recalculated
    //                     status: normalizeStatus(convData.status || convData.state),
    //                     timestamp: updatedAt,
    //                     posts: normalizedPosts,
    //                     lastReadCommentTimestamp: lastRead,
    //                 })
    //             })


    //             convListeners[conversationId] = unsubscribeConv

    //             // ✅ Posts listener
    //             if (!postsListeners[conversationId]) {
    //                 const postsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conversationId}/posts`)
    //                 const unsubscribePosts = onValue(postsRef, snapshot => {
    //                     const postsData = snapshot.val() || {}
    //                     console.log(`📥 Raw postsData for ${conversationId}:`, postsData)

    //                     const normalizedPosts: PostData[] = Object.entries(postsData).map(([postId, postData]: any) => ({
    //                         id: postId,
    //                         post: postData.post,
    //                         comments: normalizeComments(postData.comments)
    //                     }))

    //                     const allComments = normalizedPosts.flatMap(p => p.comments || [])
    //                     const existing = conversations.find(c => c.id === conversationId)
    //                     const lastRead = existing?.lastReadCommentTimestamp || 0
    //                     const unreadCount = allComments.filter(c => Number(c.timestamp) > lastRead).length
    //                     console.log(`🔎 Live unreadCount for ${conversationId}:`, { unreadCount, lastRead })

    //                     setUnreadCommentCounts(prev => {
    //                         const updated = { ...prev, [conv.user_id]: unreadCount }
    //                         console.log("🔄 Updated unreadCommentCounts (posts listener)", updated)
    //                         return updated
    //                     })

    //                     setConversations(prev =>
    //                         prev.map(c =>
    //                             c.id === conversationId
    //                                 ? { ...c, posts: normalizedPosts, lastReadCommentTimestamp: lastRead }
    //                                 : c
    //                         )
    //                     )

    //                     // ✅ Use existing conversation’s name/avatar if available
    //                     const customerName = existing?.customerName || conv.user_id || "Unknown User"
    //                     const avatar = existing?.avatar || "/default-avatar.png"

    //                     const commentList: CommentConversation[] = normalizedPosts.map(post => {
    //                         const lastComment = post.comments?.[post.comments.length - 1]
    //                         return {
    //                             id: post.id,
    //                             user_id: conv.user_id,
    //                             customerName,
    //                             avatar,
    //                             lastMessage: lastComment?.text ?? "",
    //                             lastComment: lastComment?.text ?? "",
    //                             status: "Waiting",
    //                             timestamp: Date.now(),
    //                             posts: [post],
    //                             lastReadCommentTimestamp: lastRead,
    //                         }
    //                     })

    //                     const latestCommentText = normalizedPosts
    //                         .flatMap(p => p.comments || [])
    //                         .slice(-1)[0]?.text ?? ""
    //                     setComments(prev =>
    //                         prev.some(c => c.user_id === conv.user_id)
    //                             ? prev.map(c =>
    //                                 c.user_id === conv.user_id
    //                                     ? {
    //                                         ...c,
    //                                         posts: normalizedPosts,
    //                                         customerName,
    //                                         avatar,
    //                                         lastComment: latestCommentText,
    //                                         timestamp: normalizedPosts.flatMap(p => p.comments).slice(-1)[0]?.timestamp ?? updatedAt, // ✅ refresh timestamp
    //                                     }
    //                                     : c
    //                             )
    //                             : [...prev, ...commentList]
    //                     )


    //                     setActiveComment(prev =>
    //                         prev && prev.id === conversationId
    //                             ? { ...prev, posts: normalizedPosts, lastReadCommentTimestamp: lastRead, customerName, avatar, lastComment: latestCommentText }
    //                             : prev
    //                     )

    //                 })

    //                 postsListeners[conversationId] = unsubscribePosts
    //             }

    //         })
    //     })

    //     return () => {
    //         unsubscribeQueue()
    //         Object.values(convListeners).forEach(unsub => unsub())
    //         Object.values(postsListeners).forEach(unsub => unsub())
    //     }
    // }, [currentPageId])


    // Helper: get latest comment by timestamp
    function getLatestComment(comments: any[]) {
        if (!comments || comments.length === 0) return null
        return comments.reduce((latest, c) =>
            Number(c.timestamp) > Number(latest.timestamp) ? c : latest
        )
    }

    useEffect(() => {
        if (!currentPageId) return
        const queueRef = ref(db, `khmer-ai-chat/agent_queue/${currentPageId}`)
        const convListeners: Record<string, () => void> = {}
        const postsListeners: Record<string, () => void> = {}

        const unsubscribeQueue = onValue(queueRef, snapshot => {
            const queueData = snapshot.val() || {}
            console.log("📥 Raw queueData:", queueData)

            Object.values(queueData).forEach((conv: any) => {
                const conversationId = conv.conversation_id
                if (!conversationId) return

                // ✅ Conversation listener
                if (!convListeners[conversationId]) {
                    const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conversationId}`)
                    const unsubscribeConv = onValue(convRef, snap => {
                        const convData = snap.val() || {}
                        console.log(`📥 Raw convData for ${conversationId}:`, convData)

                        const meta = convData.meta || {}
                        const customerName = meta.name || conv.user_id || "Unknown User"
                        const avatar = meta.avatar || "/default-avatar.png"

                        // Normalize posts
                        const normalizedPosts: PostData[] = Object.entries(convData.posts || {}).map(
                            ([postId, postData]: [string, any]) => ({
                                id: postId,
                                post: postData.post,
                                comments: normalizeComments(postData.comments)
                            })
                        )

                        const allComments = normalizedPosts.flatMap(p => p.comments || [])
                        console.log(`📝 All comments for ${conversationId}:`, allComments)

                        const lastRead = Number(convData.lastReadCommentTimestamp) || 0
                        const unreadCount = allComments.filter(c => Number(c.timestamp) > lastRead).length
                        console.log(`🔎 Global unreadCount for ${conversationId}:`, { unreadCount, lastRead })
                        setUnreadCommentCounts(prev => ({ ...prev, [conv.user_id]: unreadCount }))

                        // ✅ Last message
                        const messagesArray: ConversationMessage[] = Object.values(convData.messages || {})
                        const lastMessageObj = messagesArray.slice(-1)[0]
                        const lastMessageText = lastMessageObj?.text || "(no messages yet)"
                        const lastMessageTimestamp = lastMessageObj?.timestamp
                            ? Number(lastMessageObj.timestamp)
                            : Math.floor(Date.now() / 1000)
                        console.log(`💬 Last message for ${conversationId}:`, { lastMessageText, lastMessageTimestamp })

                        // ✅ Last comment
                        const latestCommentObj = getLatestComment(allComments)
                        const latestCommentText = latestCommentObj?.text || "(no comments yet)"
                        const latestCommentTimestamp = latestCommentObj?.timestamp
                            ? Number(latestCommentObj.timestamp)
                            : Math.floor(Date.now() / 1000)
                        console.log(`💭 Last comment for ${conversationId}:`, { latestCommentText, latestCommentTimestamp })

                        // ✅ Build ConversationQueue entry
                        const newConv: Conversation = {
                            id: conversationId,
                            user_id: conv.user_id,
                            customerName,
                            avatar,
                            lastMessage: lastMessageText,
                            lastComment: latestCommentText,
                            status: normalizeStatus(convData.status || convData.state),
                            timestamp: Math.max(lastMessageTimestamp, latestCommentTimestamp),
                            routing: conv.routing,
                            priority: conv.priority,
                            type: conv.type,
                            lastReadTimestamp: convData.lastReadTimestamp || 0,
                            lastReadCommentTimestamp: lastRead,
                            messages: messagesArray,
                            flowLogs: Object.values(convData.flowLogs || {}),
                            posts: normalizedPosts,
                        }
                        console.log(`📦 New conversation object for ${conversationId}:`, newConv)

                        setConversations(prev =>
                            prev.some(c => c.id === conversationId)
                                ? prev.map(c => c.id === conversationId ? newConv : c)
                                : [...prev, newConv]
                        )

                        // ✅ Build CommentQueue entries (one per post)
                        const commentList: CommentConversation[] = normalizedPosts.map(post => {
                            const lastComment = getLatestComment(post.comments || [])
                            return {
                                id: post.id,
                                user_id: conv.user_id,
                                customerName,
                                avatar,
                                lastMessage: lastMessageText,
                                lastComment: lastComment?.text || "",
                                status: "Waiting",
                                timestamp: lastComment?.timestamp
                                    ? Number(lastComment.timestamp)
                                    : latestCommentTimestamp,
                                posts: [post],
                                lastReadCommentTimestamp: lastRead,
                            }
                        })
                        console.log(`🗂️ Comment list for ${conversationId}:`, commentList)

                        // ✅ Merge by post.id so timeline shows all posts
                        setComments(prev => {
                            const updated = [...prev]
                            commentList.forEach(newComment => {
                                const idx = updated.findIndex(c => c.id === newComment.id)
                                if (idx >= 0) {
                                    console.log(`🔄 Updating comment entry for post ${newComment.id}`, newComment)
                                    updated[idx] = {
                                        ...updated[idx],
                                        ...newComment,
                                        posts: normalizedPosts,   // ✅ ensure posts are attached
                                    }
                                } else {
                                    console.log(`➕ Adding new comment entry for post ${newComment.id}`, newComment)
                                    updated.push({
                                        ...newComment,
                                        posts: normalizedPosts,   // ✅ ensure posts are attached
                                    })
                                }
                            })
                            console.log("🟢 Final CommentQueue state:", updated)
                            return updated
                        })

                        // ✅ Always attach posts to activeComment
                        setActiveComment({
                            id: conversationId,
                            user_id: conv.user_id,
                            customerName,
                            avatar,
                            lastMessage: lastMessageText,
                            lastComment: latestCommentText,
                            status: normalizeStatus(convData.status || convData.state),
                            timestamp: latestCommentTimestamp,
                            posts: normalizedPosts,              // ✅ always attach posts
                            lastReadCommentTimestamp: lastRead,
                        })
                    })

                    convListeners[conversationId] = unsubscribeConv
                }

                // ✅ Posts listener
                if (!postsListeners[conversationId]) {
                    const postsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conversationId}/posts`)
                    const unsubscribePosts = onValue(postsRef, snapshot => {
                        const postsData = snapshot.val() || {}
                        console.log(`📥 Raw postsData for ${conversationId}:`, postsData)

                        const normalizedPosts: PostData[] = Object.entries(postsData).map(([postId, postData]: any) => ({
                            id: postId,
                            post: postData.post,
                            comments: normalizeComments(postData.comments)
                        }))

                        const allComments = normalizedPosts.flatMap(p => p.comments || [])
                        console.log(`📝 All comments (posts listener) for ${conversationId}:`, allComments)

                        const latestCommentObj = getLatestComment(allComments)
                        const latestCommentText = latestCommentObj?.text ?? ""
                        const latestCommentTimestamp = latestCommentObj?.timestamp
                            ? Number(latestCommentObj.timestamp)
                            : Math.floor(Date.now() / 1000)
                        console.log(`💭 Latest comment (posts listener) for ${conversationId}:`, { latestCommentText, latestCommentTimestamp })

                        // ✅ Update ConversationQueue
                        setConversations(prev =>
                            prev.map(c =>
                                c.id === conversationId
                                    ? {
                                        ...c,
                                        posts: normalizedPosts,
                                        lastComment: latestCommentText,
                                        timestamp: Math.max(c.timestamp, latestCommentTimestamp),
                                    }
                                    : c
                            )
                        )

                        // ✅ Update CommentQueue (merge by post.id)
                        const commentList: CommentConversation[] = normalizedPosts.map(post => {
                            const lastComment = getLatestComment(post.comments || [])
                            return {
                                id: post.id,
                                user_id: conv.user_id,
                                customerName: conv.user_id,
                                avatar: "/default-avatar.png",
                                lastMessage: "",
                                lastComment: lastComment?.text || "",
                                status: "Waiting",
                                timestamp: lastComment?.timestamp
                                    ? Number(lastComment.timestamp)
                                    : latestCommentTimestamp,
                                posts: [post],
                                lastReadCommentTimestamp: 0,
                            }
                        })

                        setComments(prev => {
                            const updated = [...prev]
                            commentList.forEach(newComment => {
                                const idx = updated.findIndex(c => c.id === newComment.id)
                                if (idx >= 0) {
                                    console.log(`🔄 Updating comment entry for post ${newComment.id}`, newComment)
                                    updated[idx] = { ...updated[idx], ...newComment, posts: normalizedPosts }
                                } else {
                                    console.log(`➕ Adding new comment entry for post ${newComment.id}`, newComment)
                                    updated.push({ ...newComment, posts: normalizedPosts })
                                }
                            })
                            return updated
                        })

                        // ✅ Always attach posts to activeComment
                        setActiveComment(prev =>
                            prev && prev.id === conversationId
                                ? { ...prev, posts: normalizedPosts, lastComment: latestCommentText, timestamp: latestCommentTimestamp }
                                : prev
                        )
                    })

                    postsListeners[conversationId] = unsubscribePosts
                }
            })
        })

        return () => {
            unsubscribeQueue()
            Object.values(convListeners).forEach(unsub => unsub())
            Object.values(postsListeners).forEach(unsub => unsub())
        }
    }, [currentPageId])


    // Keep activeConversation in sync with conversations
    useEffect(() => {
        if (!activeComment) return
        const updated = comments.find(c => c.id === activeComment.id)
        if (updated) {
            console.log("🔄 Syncing activeComment with updated CommentConversation:", updated)
            setActiveComment(updated)
        }
    }, [comments])

    // Whenever conversations change, recalc unread counts
    useEffect(() => {
        if (!conversations || conversations.length === 0) return

        const initialCounts: Record<string, number> = {}

        conversations.forEach(conv => {
            const msgs = conv.messages || []
            const unread = msgs.filter(m =>
                m.sender !== "agent" &&
                (!conv.lastReadTimestamp || m.timestamp > conv.lastReadTimestamp)
            ).length

            initialCounts[conv.id] = unread
        })

        setUnreadCounts(initialCounts)
    }, [conversations])


    useEffect(() => {
        if (!conversations || conversations.length === 0) return

        const counts: Record<string, number> = {}

        conversations.forEach(conv => {
            if (conv.type === "comment") {
                const allComments = conv.posts.flatMap(p => p.comments || [])
                const lastRead = Number(conv.lastReadCommentTimestamp) || 0

                const unread = allComments.filter(c => {
                    const ts = Number(c.timestamp) || 0
                    return ts > lastRead
                }).length

                counts[conv.id] = unread
            }
        })

        setUnreadCommentCounts(counts)
    }, [conversations])


    // ✅ Real-time listeners for selected conversation
    let activeMsgRef: ReturnType<typeof ref> | null = null
    let activeLogsRef: ReturnType<typeof ref> | null = null

    const handleSelectConversation = (conv: Conversation) => {
        const now = Date.now() / 1000

        // Mark conversation as read
        update(
            ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}`),
            { lastReadTimestamp: now }
        )

        // ✅ Use last message timestamp for freshness
        const lastMessageObj = conv.messages?.slice(-1)[0]
        const lastMessageTimestamp = lastMessageObj?.timestamp
            ? Number(lastMessageObj.timestamp)
            : now

        const initialConv: Conversation = {
            ...conv,
            lastReadTimestamp: now,
            timestamp: lastMessageTimestamp,
            messages: [],
            flowLogs: [],
            posts: [],
        }

        _setActiveConversation(initialConv)
        setActiveConversation(initialConv)

        // 👉 NEW: switch to timeline mode
        setViewMode("timeline")

        if (activeMsgRef) { off(activeMsgRef); activeMsgRef = null }
        if (activeLogsRef) { off(activeLogsRef); activeLogsRef = null }

        // ✅ Metadata listener
        const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}`)
        onValue(convRef, snapshot => {
            const convData = snapshot.val() || {}
            const avatar = convData.avatar || convData.meta?.avatar || null
            const name = convData.customerName || convData.meta?.name || ""

            setActiveConversation(prev =>
                prev
                    ? { ...prev, ...convData, avatar, customerName: name, posts: prev.posts }
                    : { ...initialConv, ...convData, avatar, customerName: name, posts: [] }
            )
        })

        // ✅ Posts listener
        const postsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/posts`)
        onValue(postsRef, snapshot => {
            const postsData = snapshot.val() || {}
            const normalizedPosts = normalizePosts(postsData)

            setActiveConversation(prev =>
                prev ? { ...prev, posts: normalizedPosts } : { ...initialConv, posts: normalizedPosts }
            )
        })

        // ✅ Messages listener
        const msgsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/messages`)
        activeMsgRef = msgsRef
        onValue(msgsRef, snapshot => {
            const raw = snapshot.val() || {}
            const msgs: ConversationMessage[] = Object.entries(raw).map(([id, m]: any) => ({
                id,
                sender: m.sender,
                text: m.text,
                imageUrl: m.imageUrl,
                videoUrl: m.videoUrl,
                audioUrl: m.audioUrl,
                images: m.images || [],
                videos: m.videos || [],
                audios: m.audios || [],
                timestamp: m.timestamp ?? now,
                time: m.timestamp ? new Date(m.timestamp * 1000).toLocaleTimeString() : undefined,
            }))

            _setActiveConversation(prev =>
                prev ? { ...prev, messages: msgs } : { ...initialConv, messages: msgs }
            )
            setActiveConversation(prev =>
                prev ? { ...prev, messages: msgs } : { ...initialConv, messages: msgs }
            )
        })

        // ✅ FlowLogs listener
        const logsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/flowLogs`)
        activeLogsRef = logsRef
        onValue(logsRef, snapshot => {
            const logs: FlowLog[] = Object.entries(snapshot.val() || {}).map(([id, l]: any) => ({
                id,
                name: l.name,
                timestamp: l.timestamp ?? now,
            }))

            _setActiveConversation(prev =>
                prev ? { ...prev, flowLogs: logs } : { ...conv, flowLogs: logs, messages: [], posts: [] }
            )
            setActiveConversation(prev =>
                prev ? { ...prev, flowLogs: logs } : { ...conv, flowLogs: logs, messages: [], posts: [] }
            )
        })
    }

    const handleSelectComment = (conv: CommentConversation) => {
        const now = Date.now() / 1000
        console.log("🟢 handleSelectComment called", { convId: conv.id, userId: conv.user_id, now })

        // Mark conversation as read
        update(
            ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}`),
            { lastReadCommentTimestamp: now }
        )

        setUnreadCommentCounts(prev => ({ ...prev, [conv.user_id]: 0 }))

        // ✅ Use last comment timestamp for freshness
        const initialConv: Conversation = {
            id: conv.user_id,
            user_id: conv.user_id,
            customerName: conv.customerName,
            avatar: conv.avatar,
            lastMessage: conv.lastMessage,
            lastComment: conv.lastComment,
            status: conv.status as ConversationStatus,
            timestamp: conv.timestamp,   // ✅ comment freshness
            routing: "comment",
            priority: "normal",
            type: "comment",
            messages: [],
            flowLogs: [],
            posts: conv.posts || [],
            lastReadCommentTimestamp: now,
        }

        _setActiveConversation(initialConv)
        setActiveConversation(initialConv)

        // 👉 NEW: switch to timeline mode
        setViewMode("timeline")

        // ✅ Metadata listener
        const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}`)
        onValue(convRef, snapshot => {
            const convData = snapshot.val() || {}
            const avatar = convData.avatar || convData.meta?.avatar || conv.avatar
            const name = convData.customerName || convData.meta?.name || conv.customerName

            setActiveConversation(prev =>
                prev
                    ? { ...prev, ...convData, avatar, customerName: name, posts: prev.posts }
                    : { ...initialConv, ...convData, avatar, customerName: name, posts: [] }
            )
        })

        // ✅ Posts listener
        const postsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}/posts`)
        onValue(postsRef, snapshot => {
            const postsData = snapshot.val() || {}
            const normalizedPosts = normalizePosts(postsData)

            const allComments = normalizedPosts.flatMap(p => p.comments || [])
            const latestComment = allComments.slice(-1)[0]
            const latestCommentTimestamp = latestComment?.timestamp
                ? Number(latestComment.timestamp)
                : now

            setUnreadCommentCounts(prev => ({ ...prev, [conv.user_id]: 0 }))

            setActiveConversation(prev =>
                prev
                    ? { ...prev, posts: normalizedPosts, lastReadCommentTimestamp: now, timestamp: latestCommentTimestamp }
                    : { ...initialConv, posts: normalizedPosts, timestamp: latestCommentTimestamp }
            )
        })
    }


    const onSendCommentReply = async (
        commentId: string,
        msg: string,
        pageToken: string,
        postId: string
    ) => {
        if (!activeComment || !currentPageId) return

        await sendCommentReply(
            commentId,
            msg,
            pageToken,
            currentPageId,             // pageId
            activeComment.user_id,     // userId
            postId
        )
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

    return (
        <DashboardLayout
            sidebar={
                <div className="hidden md:block">
                    <SidebarTabs
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        unreadCounts_all={unreadCounts_all}
                    />
                </div>
            }
            headerTitle="Agent Dashboard"
            footerStatus="online"
            footerVersion="v1.2.3"
            main={
                <div className="flex h-full">
                    {/* Queue column */}
                    {viewMode === "queue" && (
                        <div className="w-full md:w-80 border-r border-teal-700 bg-dark-800 flex flex-col h-full">
                            <div className="flex-grow overflow-y-auto">
                                {activeTab === "messages" && (
                                    <ConversationQueue
                                        conversations={conversations}
                                        onSelect={handleSelectConversation}
                                        activeConversationId={activeConversation?.id ?? null}
                                        unreadCounts={unreadCounts}
                                    />
                                )}
                                {activeTab === "comments" && (
                                    <CommentQueue
                                        comments={comments}
                                        onSelect={handleSelectComment}
                                        activeCommentId={activeComment?.id ?? null}
                                        unreadCommentCounts={unreadCommentCounts}
                                    />
                                )}
                                {activeTab === "posts" && (
                                    <PostQueue
                                        posts={postConversations}
                                        onSelect={handleSelectPost}
                                        activePostId={activePostId}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Timeline column */}
                    {viewMode === "timeline" && (
                        <div className="flex-grow flex flex-col bg-dark-900">
                            {/* Back header */}
                            <div className="flex items-center p-2 border-b border-dark-600 bg-dark-700">
                                <button
                                    onClick={() => setViewMode("queue")}
                                    className="text-light-300 hover:text-teal-400 text-sm"
                                >
                                    ← Back
                                </button>
                                <span className="ml-2 text-light-100 text-sm font-semibold">
                                    {activeTab === "messages" && "Conversation Timeline"}
                                    {activeTab === "comments" && "Comment Timeline"}
                                    {activeTab === "posts" && "Post Timeline"}
                                </span>
                            </div>

                            {/* Timeline content */}
                            <div className="flex-grow overflow-y-auto">
                                {activeTab === "messages" && (
                                    <ConversationTimeline
                                        conversation={activeConversation}
                                        currentPageId={currentPageId ?? ""}
                                    />
                                )}
                                {activeTab === "comments" && (
                                    <CommentTimeline
                                        posts={activeComment?.posts ?? []}
                                        pageToken={pageToken}
                                        onSendCommentReply={onSendCommentReply}
                                    />
                                )}
                                {activeTab === "posts" && (
                                    <PostTimeline post={activePost} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            }
        />
    )


}

