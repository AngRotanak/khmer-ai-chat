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
  selectedPathId?: string // ✅ Added
  flowData: Record<string, { nodes: Node[]; edges: Edge[] }>
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  setSelectedPathId: (pathId: string | undefined) => void // ✅ Added
  resetCanvas: () => void
  loadFlow: (flow: { nodes: Node[]; edges: Edge[] }) => void
  setFlowData: (data: Record<string, { nodes: Node[]; edges: Edge[] }>) => void
  deleteEdgeById: (edgeId: string) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  selectedPathId: undefined, // ✅ Initialized
  flowData: {},

  setNodes: (nodesOrUpdater) =>
    set((state) => ({
      nodes: typeof nodesOrUpdater === 'function'
        ? nodesOrUpdater(state.nodes)
        : nodesOrUpdater,
    })),

  setEdges: (edgesOrUpdater) =>
    set((state) => ({
      edges: typeof edgesOrUpdater === 'function'
        ? edgesOrUpdater(state.edges)
        : edgesOrUpdater,
    })),

  setSelectedPathId: (pathId) => set({ selectedPathId: pathId }), // ✅ Setter

  resetCanvas: () => set({ nodes: [], edges: [], selectedPathId: undefined }),

  loadFlow: (flow) => set({
    nodes: flow.nodes ?? [],
    edges: flow.edges ?? [],
  }),

  setFlowData: (data) => set({ flowData: data }),

  deleteEdgeById: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    })),
}))
