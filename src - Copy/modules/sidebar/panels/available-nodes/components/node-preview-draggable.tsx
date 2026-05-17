import type { DragEvent, ReactNode } from 'react'
import type { useInsertNode } from '~/modules/flow-builder/hooks/use-insert-node'
import type { BuilderNodeType } from '~/modules/nodes/types'
import type { ApplicationState } from '~/stores/application-state'
import { useCallback } from 'react'

import { cn } from '~@/utils/cn'
import { NODE_TYPE_DRAG_DATA_FORMAT } from '~/constants/symbols'

type NodePreviewDraggableProps = Readonly<{
  icon: string | ReactNode;
  title: string;
  description: string;
  type: string;
  children?: never;
  isMobileView: boolean;
  setActivePanel: (panel: ApplicationState['sidebar']['active']) => void;
  insertNode: ReturnType<typeof useInsertNode>;
}>

export function NodePreviewDraggable({
  icon,
  title,
  description,
  type,
  isMobileView,
  setActivePanel,
  insertNode,
}: NodePreviewDraggableProps) {
  const onDragStart = useCallback((e: DragEvent, type: string) => {
    if (isMobileView) return
    e.dataTransfer.setData(NODE_TYPE_DRAG_DATA_FORMAT, type)
    e.dataTransfer.effectAllowed = 'move'
  }, [isMobileView])

  const onClick = useCallback(() => {
    if (!isMobileView) return
    insertNode(type as BuilderNodeType)
    setActivePanel('none')
  }, [insertNode, isMobileView, setActivePanel, type])

  return (
    <div
      className={cn(
        'flex cursor-grab select-none gap-2 border border-dark-300 dark:border-dark-600 rounded-xl bg-dark-400 dark:bg-dark-900 p-2.5 shadow-sm transition hover:(ring-2 ring-teal-600/50)',
        isMobileView && 'active:(opacity-70 scale-98)',
      )}
      onClick={onClick}
      onDragStart={e => onDragStart(e, type)}
      draggable
      data-vaul-no-drag
    >
      <div className="shrink-0">
        <div className="size-10 flex items-center justify-center border border-dark-200 dark:border-dark-700 rounded-xl bg-dark-300 dark:bg-dark-800">
          {typeof icon === 'string'
            ? <div className={cn(icon, 'size-6 text-white dark:text-teal-300')} />
            : icon}
        </div>
      </div>

      <div className="ml-1 flex grow flex-col">
        <div className="mt-px text-sm font-medium leading-normal text-light-100 dark:text-light-100">
          {title}
        </div>

        <div className="line-clamp-3 mt-1 text-xs leading-normal text-light-50/40 dark:text-light-100/40">
          {description}
        </div>
      </div>
    </div>
  )
}
