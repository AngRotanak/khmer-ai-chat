import { create } from 'zustand'

interface FlowSessionState {
  currentPageId: string | null
  setCurrentPageId: (id: string) => void
}

export const useFlowSession = create<FlowSessionState>(set => ({
  currentPageId: null,
  setCurrentPageId: (id) => set({ currentPageId: id }),
}))
