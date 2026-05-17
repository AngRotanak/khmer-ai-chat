import type { ApplicationState } from '~/stores/application-state'
import type { ComponentType } from 'react'

import AvailableNodesPanel from '~/modules/sidebar/panels/available-nodes/available-nodes-panel'
import { NodePropertiesPanel } from '~/modules/sidebar/panels/node-properties/node-properties-panel'
import { KhmerAIFeaturesPanel } from '~/modules/sidebar/panels/khmer-ai-features/khmer-ai-features-panel'

export const PANEL_COMPONENTS: Record<ApplicationState['sidebar']['active'], ComponentType> = {
  'available-nodes': AvailableNodesPanel,
  'node-properties': NodePropertiesPanel,
  'khmer-ai-features': KhmerAIFeaturesPanel,
  'unified-block-manager': () => null,
  'none': () => null,
}
