import { useState, useEffect } from "react"
import { db } from "~/lib/firebase"
import { ConversationQueue } from "../components/ConversationQueue"
import { ConversationTimeline } from "./ConversationTimeline"
import { SidebarTabs } from "./SidebarTabs"
import { DashboardLayout } from "./DashboardLayout"
import { useUnreadCounts } from "../hooks/useUnreadCounts"
import { useFlowSession } from '~/stores/flow-session'
import { PageSelector } from "~/modules/shared/components/PageSelector"
import { onChildAdded, off, ref, onValue, update } from "firebase/database"
import type { Conversation, ConversationMessage, FlowLog, PostData, ConversationStatus, CommentConversation } from '~/modules/nodes/types'
import { CommentQueue } from "../components/CommentQueue"
import { PostQueue } from "../components/PostQueue"
import { CommentTimeline } from "../components/CommentTimeline"
import { PostTimeline } from "../components/PostTimeline"
import { sendCommentReply } from "../hooks/sendCommentReply"
import { exportToCSV } from "../hooks/exportToCSV"
import { exportToPDF } from "../hooks/exportToPDF"

import { normalizeComments, normalizePosts } from "~/utils/normalize.ts"

export function AgentDashboard({
    onSend,
    setActiveConversation,
    pageToken,
}: {
    onSend: (msg: any) => void
    setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>
    pageToken: string
}) {
    const [activeTab, setActiveTab] = useState<"messages" | "comments" | "posts">("messages")

    // Messages
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversation, _setActiveConversation] = useState<Conversation | null>(null)
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
    const [unreadCommentCounts, setUnreadCommentCounts] = useState<Record<string, number>>({})




    // Comments
    const [comments, setComments] = useState<CommentConversation[]>([])
    const [activeComment, setActiveComment] = useState<CommentConversation | null>(null)

    // Posts (if needed)
    const [posts, setPosts] = useState<Conversation[]>([])
    const [activePost, setActivePost] = useState<Conversation | null>(null)
    const handleSelectPost = (conv: Conversation) => setActivePost(conv)



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


    // // ✅ Queue listener with global unread comment count + detailed logs
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




    // const handleSelectConversation = (conv: Conversation) => {
    //     const now = Date.now() / 1000

    //     // Mark conversation as read
    //     update(
    //         ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}`),
    //         { lastReadTimestamp: now }
    //     )

    //     // Build initial state
    //     const initialConv: Conversation = {
    //         ...conv,
    //         lastReadTimestamp: now,
    //         messages: [],
    //         flowLogs: [],
    //         posts: [],
    //     }

    //     _setActiveConversation(initialConv)
    //     setActiveConversation(initialConv)

    //     if (activeMsgRef) { off(activeMsgRef); activeMsgRef = null }
    //     if (activeLogsRef) { off(activeLogsRef); activeLogsRef = null }

    //     // ✅ Listen to conversation metadata
    //     // ✅ Metadata listener
    //     const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}`)
    //     // ✅ Metadata listener
    //     onValue(convRef, snapshot => {
    //         const convData = snapshot.val() || {}
    //         const avatar = convData.avatar || convData.meta?.avatar || null
    //         const name = convData.customerName || convData.meta?.name || ""

    //         setActiveConversation(prev =>
    //             prev
    //                 ? {
    //                     ...prev,
    //                     ...convData,
    //                     avatar,
    //                     customerName: name,
    //                     posts: prev.posts,   // ✅ only preserve posts
    //                 }
    //                 : {
    //                     ...initialConv,
    //                     ...convData,
    //                     avatar,
    //                     customerName: name,
    //                     posts: [],
    //                 }
    //         )
    //     })


    //     // ✅ Listen to posts separately
    //     const postsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/posts`)
    //     onValue(postsRef, snapshot => {
    //         const postsData = snapshot.val() || {}
    //         console.log(`📥 Raw postsData for ${conv.id}:`, postsData)

    //         const normalizedPosts = normalizePosts(postsData)
    //         console.log(`📝 Normalized posts array for ${conv.id} (count=${normalizedPosts.length}):`, normalizedPosts)

    //         setActiveConversation(prev =>
    //             prev ? { ...prev, posts: normalizedPosts } : { ...initialConv, posts: normalizedPosts }
    //         )
    //     })


    //     // ✅ Messages listener
    //     const msgsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/messages`)
    //     activeMsgRef = msgsRef
    //     onValue(msgsRef, snapshot => {
    //         const raw = snapshot.val() || {}
    //         console.log("📥 Raw messages snapshot:", raw)

    //         const msgs: ConversationMessage[] = Object.entries(raw).map(([id, m]: any) => ({
    //             id,
    //             sender: m.sender,
    //             text: m.text,
    //             imageUrl: m.imageUrl,
    //             videoUrl: m.videoUrl,
    //             audioUrl: m.audioUrl,
    //             images: m.images || [],
    //             videos: m.videos || [],
    //             audios: m.audios || [],
    //             timestamp: m.timestamp ?? Date.now() / 1000,
    //             time: m.timestamp ? new Date(m.timestamp * 1000).toLocaleTimeString() : undefined,
    //         }))

    //         _setActiveConversation(prev =>
    //             prev ? { ...prev, messages: msgs } : { ...initialConv, messages: msgs }
    //         )
    //         setActiveConversation(prev =>
    //             prev ? { ...prev, messages: msgs } : { ...initialConv, messages: msgs }
    //         )
    //     })
    //     // ✅ FlowLogs listener
    //     const logsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.id}/flowLogs`)
    //     activeLogsRef = logsRef
    //     onValue(logsRef, snapshot => {
    //         const logs: FlowLog[] = Object.entries(snapshot.val() || {}).map(([id, l]: any) => ({
    //             id,
    //             name: l.name,
    //             timestamp: l.timestamp ?? Date.now() / 1000,
    //         }))
    //         console.log("📜 Parsed logs:", logs)

    //         _setActiveConversation(prev =>
    //             prev ? { ...prev, flowLogs: logs } : { ...conv, flowLogs: logs, messages: [], posts: [] }
    //         )
    //         setActiveConversation(prev =>
    //             prev ? { ...prev, flowLogs: logs } : { ...conv, flowLogs: logs, messages: [], posts: [] }
    //         )
    //     })

    // }

    // const handleSelectComment = (conv: CommentConversation) => {
    //     const now = Date.now() / 1000
    //     console.log("🟢 handleSelectComment called", { convId: conv.id, userId: conv.user_id, now })

    //     // Mark conversation as read in Firebase (conversation path uses conv.user_id)
    //     update(
    //         ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}`),
    //         { lastReadCommentTimestamp: now }
    //     )
    //     console.log("📤 Firebase update sent for lastReadCommentTimestamp", { userId: conv.user_id, now })

    //     // ✅ Reset unread count keyed by user_id
    //     setUnreadCommentCounts(prev => {
    //         const updated = { ...prev, [conv.user_id]: 0 }
    //         console.log("🔄 Reset unreadCommentCounts", updated)
    //         return updated
    //     })

    //     // Map CommentConversation → Conversation
    //     const initialConv: Conversation = {
    //         id: conv.user_id, // ✅ use conversation id
    //         user_id: conv.user_id,
    //         customerName: conv.customerName,
    //         avatar: conv.avatar,
    //         lastMessage: conv.lastMessage,
    //         lastComment: conv.lastComment,
    //         status: conv.status as ConversationStatus,
    //         timestamp: conv.timestamp,
    //         routing: "comment",
    //         priority: "normal",
    //         type: "comment",
    //         messages: [],
    //         flowLogs: [],
    //         posts: conv.posts || [],
    //         lastReadCommentTimestamp: now,
    //     }
    //     console.log("📝 Built initialConv", initialConv)

    //     _setActiveConversation(initialConv)
    //     setActiveConversation(initialConv)

    //     // ✅ Listen to metadata
    //     const convRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}`)
    //     onValue(convRef, snapshot => {
    //         const convData = snapshot.val() || {}
    //         console.log(`📥 Metadata snapshot for ${conv.user_id}:`, convData)

    //         const avatar = convData.avatar || convData.meta?.avatar || conv.avatar
    //         const name = convData.customerName || convData.meta?.name || conv.customerName

    //         setActiveConversation(prev => {
    //             const updated = prev
    //                 ? { ...prev, ...convData, avatar, customerName: name, posts: prev.posts }
    //                 : { ...initialConv, ...convData, avatar, customerName: name, posts: [] }
    //             console.log("🔄 Updated activeConversation (metadata)", updated)
    //             return updated
    //         })
    //     })

    //     // ✅ Listen to posts
    //     const postsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/conversations/${conv.user_id}/posts`)
    //     onValue(postsRef, snapshot => {
    //         const postsData = snapshot.val() || {}
    //         console.log(`📥 Posts snapshot for ${conv.user_id}:`, postsData)

    //         const normalizedPosts = normalizePosts(postsData)
    //         console.log(`📝 Normalized posts for ${conv.user_id} (count=${normalizedPosts.length}):`, normalizedPosts)

    //         // Recalculate global unread count
    //         const allComments = normalizedPosts.flatMap(p => p.comments || [])
    //         const unread = allComments.filter(c => Number(c.timestamp) > now).length
    //         console.log("🔎 Recalculated unread count", { userId: conv.user_id, unread, lastRead: now })

    //         // ✅ Update dictionary keyed by user_id
    //         setUnreadCommentCounts(prev => {
    //             const updated = { ...prev, [conv.user_id]: unread }
    //             console.log("🔄 Updated unreadCommentCounts (posts listener)", updated)
    //             return updated
    //         })

    //         setActiveConversation(prev => {
    //             const updated = prev
    //                 ? { ...prev, posts: normalizedPosts, lastReadCommentTimestamp: now }
    //                 : { ...initialConv, posts: normalizedPosts }
    //             console.log("🔄 Updated activeConversation (posts listener)", updated)
    //             return updated
    //         })
    //     })
    // }



    // ✅ Define the handler here


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
            timestamp: lastMessageTimestamp,   // ✅ conversation freshness
            messages: [],
            flowLogs: [],
            posts: [],
        }

        _setActiveConversation(initialConv)
        setActiveConversation(initialConv)

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
                <SidebarTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    unreadCounts_all={unreadCounts_all}
                />
            }
            headerTitle="Agent Dashboard"
            footerStatus="online"
            footerVersion="v1.2.3"
            main={
                <div className="flex h-full">

                    {/* Queue column */}
                    <div className="w-80 border-r border-teal-700 bg-dark-800 flex flex-col">
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
                                    posts={posts}
                                    onSelect={handleSelectPost}
                                    activePostId={activePost?.id ?? null}
                                />
                            )}
                        </div>

                        {/* ✅ Export buttons inside sidebar for convenience */}
                        <div className="p-2 border-t border-teal-700">
                            <button
                                onClick={() => exportToCSV(conversations)}
                                className="w-full mb-2 px-3 py-2 bg-teal-600 text-white rounded"
                            >
                                Download CSV
                            </button>
                            <button
                                onClick={() => exportToPDF(conversations)}
                                className="w-full px-3 py-2 bg-dark-600 text-white rounded"
                            >
                                Download PDF
                            </button>
                        </div>

                    </div>



                    {/* Timeline column */}
                    <div className="flex-grow flex flex-col bg-dark-900">
                        {activeTab === "messages" && (
                            <ConversationTimeline
                                conversation={activeConversation}
                                currentPageId={currentPageId ?? ""}
                            />
                        )}
                        {activeTab === "comments" && (
                            <>
                                {(() => {
                                    console.log("📤 Passing posts to CommentTimeline:", activeComment?.posts)
                                    return (
                                        <CommentTimeline
                                            posts={activeComment?.posts ?? []}
                                            pageToken={pageToken}
                                            onSendCommentReply={onSendCommentReply}
                                        />
                                    )
                                })()}
                            </>
                        )}

                        {activeTab === "posts" && (
                            <PostTimeline post={activePost} />
                        )}

                    </div>
                </div>
            }
        />
    )
}