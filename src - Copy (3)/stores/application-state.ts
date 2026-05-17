import type { BuilderNodeType } from '~/modules/nodes/types'
import { immer } from 'zustand/middleware/immer'
import { createStoreContext, defineStoreInstance } from '~@/store'

export type FlowItem = {
  id: string;
  type: string;
  name: string;
  lastUpdated?: string;
};


interface State {
  view: {
    mobile: boolean;
  };
  builder: {
    blurred: boolean;
  };
  sidebar: {
    active: 'node-properties' | 'available-nodes' | 'khmer-ai-features' | 'flow-manager' | 'command-center' | 'none';
    panels: {
      nodeProperties: {
        selectedNode: { id: string; type: BuilderNodeType } | null | undefined;
        paneSizes: (string | number)[];
      };
    };
  };
  settings: {
    language: 'en' | 'km';
  };
  flowList: FlowItem[]; // ✅ updated
}

interface Actions {
  actions: {
    view: { setMobileView: (isMobile: boolean) => void };
    builder: { setBlur: (blur: boolean) => void };
    sidebar: {
      setActivePanel: (panel: State['sidebar']['active']) => void;
      showNodePropertiesOf: (node: { id: string; type: BuilderNodeType }) => void;
      panels: {
        nodeProperties: {
          setSelectedNode: (node: { id: string; type: BuilderNodeType } | undefined | null) => void;
          setPaneSizes: (sizes: (string | number)[]) => void;
        };
      };
    };
    settings: { setLanguage: (lang: 'en' | 'km') => void };
    setFlowList: (list: FlowItem[]) => void; // ✅ updated
    clearFlowList: () => void;
  };
}



const applicationStateInstance = defineStoreInstance<State, Actions>(
  (init) => {
    return immer((set) => ({
      ...init,
      actions: {
        view: {
          setMobileView: (isMobile) =>
            set((state) => {
              state.view.mobile = isMobile
            }),
        },
        builder: {
          setBlur: (blur) =>
            set((state) => {
              state.builder.blurred = blur
            }),
        },
        sidebar: {
          setActivePanel: (panel) =>
            set((state) => {
              state.sidebar.active = panel
            }),
          showNodePropertiesOf: (node) =>
            set((state) => {
              state.sidebar.active = 'node-properties'
              state.sidebar.panels.nodeProperties.selectedNode = node
            }),
          panels: {
            nodeProperties: {
              setSelectedNode: (node) =>
                set((state) => {
                  state.sidebar.panels.nodeProperties.selectedNode = node
                }),
              setPaneSizes: (sizes) =>
                set((state) => {
                  state.sidebar.panels.nodeProperties.paneSizes = sizes
                }),
            },
          },
        },
        settings: {
          setLanguage: (lang) =>
            set((state) => {
              state.settings.language = lang
            }),
        },
        setFlowList: (list) =>
          set((state) => {
            state.flowList = list
          }),
        clearFlowList: () =>
          set((state) => {
            state.flowList = []
          }),
      },
    }))
  },
  {
    view: {
      mobile: false,
    },
    builder: {
      blurred: false,
    },
    sidebar: {
      active: 'none',
      panels: {
        nodeProperties: {
          selectedNode: null,
          paneSizes: ['40%', 'auto'],
        },
      },
    },
    settings: {
      language: 'en',
    },
    flowList: [], // ✅ Initial value
  }
)



export const [ApplicationStateProvider, useApplicationState] = createStoreContext<State, Actions>(applicationStateInstance)
export type ApplicationState = State
