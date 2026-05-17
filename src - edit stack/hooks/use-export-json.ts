import { getDatabase, ref, get } from 'firebase/database'

export async function useExportJson(pageId: string) {
  const db = getDatabase()

  const [blocksSnap, messagesSnap, commentsSnap, fallbackSnap] = await Promise.all([
    get(ref(db, `khmer-ai-chat/pages/${pageId}/blocks`)),
    get(ref(db, `khmer-ai-chat/pages/${pageId}/messages`)),
    get(ref(db, `khmer-ai-chat/pages/${pageId}/comments`)),
    get(ref(db, `khmer-ai-chat/pages/${pageId}/config/fallback_block`)),
  ])

  return {
    blocks: blocksSnap.val() || {},
    messages: messagesSnap.val() || {},
    comments: commentsSnap.val() || {},
    fallback_block: fallbackSnap.val() || '',
  }
}
