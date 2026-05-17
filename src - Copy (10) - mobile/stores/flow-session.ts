import { create } from 'zustand'

interface FlowSessionState {
  currentPageId: string | null
  setCurrentPageId: (id: string) => void

  pageToken: string | null
  setPageToken: (token: string) => void
}

export const useFlowSession = create<FlowSessionState>(set => ({
  currentPageId: null,
  setCurrentPageId: (id) => set({ currentPageId: id }),

  pageToken: null,
  setPageToken: (token) => set({ pageToken: token }),
}))
