import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'


interface AuthState {
  user: { id: string; name?: string } | null
  setUser: (user: AuthState['user']) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))

interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  setNodes: (updater: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (updater: Edge[] | ((prev: Edge[]) => Edge[])) => void
  resetCanvas: () => void
  loadFlow: (flow: { nodes: Node[]; edges: Edge[] }) => void
}
export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],

  setNodes: (updater) =>
    set((state) => ({
      nodes: typeof updater === 'function' ? updater(state.nodes) : updater,
    })),

  setEdges: (updater) =>
    set((state) => ({
      edges: typeof updater === 'function' ? updater(state.edges) : updater,
    })),

  resetCanvas: () => set({ nodes: [], edges: [] }),

  loadFlow: (flow) =>
    set({
      nodes: flow.nodes ?? [],
      edges: flow.edges ?? [],
    }),
}))