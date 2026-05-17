import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'

export interface FlowBlock {
  block_id: string
  block_name: string
  block_type: string
  canvas?: {
    nodes?: Node[]
    edges?: Edge[]
  }
  [key: string]: any
}

export interface FlowData {
  feature_blocks_by_type: Record<string, Record<string, FlowBlock>>
  shared_templates?: Record<string, any>
  is_draft?: boolean
  last_saved_at?: string
  saved_by?: string
}

interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  selectedPathId?: string
  flowData: FlowData | null
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  setSelectedPathId: (pathId: string | undefined) => void
  resetCanvas: () => void
  loadFlow: (flow: { nodes: Node[]; edges: Edge[] }) => void
  setFlowData: (data: FlowData | null) => void
  deleteEdgeById: (edgeId: string) => void
  updateNodeData: (id: string, patch: Partial<any>) => void   // <-- add this
}


export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  selectedPathId: undefined,
  flowData: null,

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

  setSelectedPathId: (pathId) => set({ selectedPathId: pathId }),

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

  // ✅ New method
updateNodeData: (id, patch) =>
  set((state) => {
    console.log("updateNodeData called", id, patch);
    return {
      nodes: state.nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, ...patch } }
          : n
      ),
    };
  }),


}))

