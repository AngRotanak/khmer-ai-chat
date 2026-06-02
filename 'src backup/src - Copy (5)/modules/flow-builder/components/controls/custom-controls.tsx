import { ControlButton, useReactFlow, useStore } from '@xyflow/react'
import { shallow } from 'zustand/shallow'
import { useApplicationState } from '~/stores/application-state'
import { cn } from '~@/utils/cn'

const ZOOM_DURATION = 500

import type { ReactFlowState } from '@xyflow/react'

function selector(s: ReactFlowState) {
  return {
    minZoomReached: s.transform[2] <= s.minZoom,
    maxZoomReached: s.transform[2] >= s.maxZoom,
  }
}


export default function CustomControls() {
  const [isMobile] = useApplicationState(s => [s.view.mobile])
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { minZoomReached, maxZoomReached } = useStore(selector, shallow)

  return (
    <div
      className={cn(
        'absolute z-50 flex flex-col gap-1 p-1 rounded-md shadow-sm',
        isMobile ? 'top-2 right-2' : 'bottom-2 left-2',
        'bg-dark-300/80 dark:bg-dark-800/80'
      )}
    >
      <ControlButton
        onClick={() => zoomIn({ duration: ZOOM_DURATION })}
        disabled={maxZoomReached}
        className="text-light-100 dark:text-light-100 hover:bg-dark-400 dark:hover:bg-dark-700 active:bg-dark-500 dark:active:bg-dark-600"
      >
        <div className="i-mynaui:plus size-5" />
      </ControlButton>

      <ControlButton
        onClick={() => zoomOut({ duration: ZOOM_DURATION })}
        disabled={minZoomReached}
        className="text-light-100 dark:text-light-100 hover:bg-dark-400 dark:hover:bg-dark-700 active:bg-dark-500 dark:active:bg-dark-600"
      >
        <div className="i-mynaui:minus size-5" />
      </ControlButton>

      <ControlButton
        onClick={() => fitView({ duration: ZOOM_DURATION })}
        className="text-light-100 dark:text-light-100 hover:bg-dark-400 dark:hover:bg-dark-700 active:bg-dark-500 dark:active:bg-dark-600"
      >
        <div className="i-mynaui:maximize size-4" />
      </ControlButton>
    </div>
  )
}
