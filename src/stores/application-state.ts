import type { BuilderNodeType } from '~/modules/nodes/types'
import { immer } from 'zustand/middleware/immer'
import { createStoreContext, defineStoreInstance } from '~@/store'

export type SubIntent = {
  intent: string;
  display_name?: {
    en?: string;
    kh?: string;
  };
};

export type FlowItem = {
  id: string;
  type: string;
  name: string;
  lastUpdated?: string;
  sub_intents?: SubIntent[];
};

interface State {
  view: { mobile: boolean };
  builder: { blurred: boolean };
  sidebar: {
    active:
      | 'node-properties'
      | 'available-nodes'
      | 'khmer-ai-features'
      | 'flow-manager'
      | 'command-center'
      | 'conversations'
      | 'metrics'
      | 'none';
    panels: {
      nodeProperties: {
        selectedNode: { id: string; type: BuilderNodeType } | null | undefined;
        paneSizes: (string | number)[];
      };
    };
  };
  agentData: {
    conversations: { active: number; waiting: number; resolved: number };
    metrics: { responseTime: number; resolutionRate: number; satisfaction: number };
    activeTab: 'messages' | 'comments' | 'posts';
    viewMode: 'queue' | 'timeline';
  };
  agentSidebar: {
    active: 'conversations' | 'metrics' | 'gallery' | 'settings' | 'more' | 'none';
  };
  settings: {
    language: 'en' | 'km';
    theme: 'light' | 'dark';
  };
  agentSettings: {
    templates: {
      takeover: { en: string; kh: string };
      return: { en: string; kh: string };
      close: { en: string; kh: string };
    };
  };
  flowList: FlowItem[];
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
          setSelectedNode: (
            node: { id: string; type: BuilderNodeType } | undefined | null
          ) => void;
          setPaneSizes: (sizes: (string | number)[]) => void;
        };
      };
    };
    agentData: {
      setConversations: (stats: State['agentData']['conversations']) => void;
      setMetrics: (metrics: State['agentData']['metrics']) => void;
      setActiveTab: (tab: State['agentData']['activeTab']) => void;
      setViewMode: (mode: State['agentData']['viewMode']) => void;
    };
    agentSidebar: {
      setActivePanel: (panel: State['agentSidebar']['active']) => void;
    };
    settings: {
      setLanguage: (lang: 'en' | 'km') => void;
      setTheme: (theme: 'light' | 'dark') => void;
    };
    agentSettings: {
      setTemplates: (templates: State['agentSettings']['templates']) => void;
    };
    setFlowList: (list: FlowItem[]) => void;
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
              state.view.mobile = isMobile;
            }),
        },
        builder: {
          setBlur: (blur) =>
            set((state) => {
              state.builder.blurred = blur;
            }),
        },
        sidebar: {
          setActivePanel: (panel) =>
            set((state) => {
              state.sidebar.active = panel;
            }),
          showNodePropertiesOf: (node) =>
            set((state) => {
              state.sidebar.active = 'node-properties';
              state.sidebar.panels.nodeProperties.selectedNode = node;
            }),
          panels: {
            nodeProperties: {
              setSelectedNode: (node) =>
                set((state) => {
                  state.sidebar.panels.nodeProperties.selectedNode = node;
                }),
              setPaneSizes: (sizes) =>
                set((state) => {
                  state.sidebar.panels.nodeProperties.paneSizes = sizes;
                }),
            },
          },
        },
        agentSidebar: {
          setActivePanel: (panel) =>
            set((state) => {
              state.agentSidebar.active = panel;
            }),
        },
        agentData: {
          setConversations: (stats) =>
            set((state) => {
              state.agentData.conversations = stats;
            }),
          setMetrics: (metrics) =>
            set((state) => {
              state.agentData.metrics = metrics;
            }),
          setActiveTab: (tab) =>
            set((state) => {
              state.agentData.activeTab = tab;
            }),
          setViewMode: (mode) =>
            set((state) => {
              state.agentData.viewMode = mode;
            }),
        },
        settings: {
          setLanguage: (lang) =>
            set((state) => {
              state.settings.language = lang;
            }),
          setTheme: (theme) =>
            set((state) => {
              state.settings.theme = theme;
            }),
        },
        agentSettings: {
          setTemplates: (templates) =>
            set((state) => {
              state.agentSettings.templates = templates;
            }),
        },
        setFlowList: (list) =>
          set((state) => {
            state.flowList = list;
          }),
        clearFlowList: () =>
          set((state) => {
            state.flowList = [];
          }),
      },
    }));
  },
  {
    view: { mobile: false },
    builder: { blurred: false },
    sidebar: {
      active: 'none',
      panels: {
        nodeProperties: {
          selectedNode: null,
          paneSizes: ['40%', 'auto'],
        },
      },
    },
    agentSidebar: { active: 'none' },
    agentData: {
      conversations: { active: 0, waiting: 0, resolved: 0 },
      metrics: { responseTime: 0, resolutionRate: 0, satisfaction: 0 },
      activeTab: 'messages',
      viewMode: 'queue',
    },
    settings: {
      language: 'en',
      theme: 'light',
    },
    agentSettings: {
      templates: {
        takeover: { en: '', kh: '' },
        return: { en: '', kh: '' },
        close: { en: '', kh: '' },
      },
    },
    flowList: [],
  }
);

export const [ApplicationStateProvider, useApplicationState] =
  createStoreContext<State, Actions>(applicationStateInstance);
export type ApplicationState = State;
