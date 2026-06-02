import type { DragEvent, ReactNode } from 'react'
import type { BuilderNodeType } from '~/modules/nodes/types'
import { useCallback } from 'react'
import { cn } from '~@/utils/cn'
import { NODE_TYPE_DRAG_DATA_FORMAT } from '~/constants/symbols'
import type { ApplicationState } from '~/stores/application-state'



type NodePreviewKhmerProps = Readonly<{
  icon: string | ReactNode
  title: string
  description: string
  type: BuilderNodeType
  isMobileView: boolean
  setActivePanel: (panel: ApplicationState['sidebar']['active']) => void;
  insertNode: (type: BuilderNodeType) => void
}>

export function NodePreviewKhmer({
  type,
  icon,
  title,
  description,
  isMobileView,
  setActivePanel,
  insertNode,
}: NodePreviewKhmerProps) {



  //   const onDragStart = useCallback(
  //   (e: DragEvent<HTMLDivElement>) => {
  //     if (isMobileView) {
  //       // 🚫 Disable drag on mobile — rely on tap to insert
  //       e.preventDefault()
  //       return
  //     }

  //     // ✅ Set drag data so React Flow knows what node type is being dragged
  //     e.dataTransfer.setData(NODE_TYPE_DRAG_DATA_FORMAT, type)

  //     // ✅ Indicate this is a move operation
  //     e.dataTransfer.effectAllowed = 'move'

  //     // ✅ Optional: add a visual drag feedback class
  //     e.currentTarget.classList.add('opacity-50')

  //     // Remove feedback class when drag ends
  //     e.currentTarget.addEventListener('dragend', () => {
  //       e.currentTarget.classList.remove('opacity-50')
  //     }, { once: true })
  //   },
  //   [isMobileView, type]
  // )


  //   const onClick = useCallback(() => {
  //   insertNode(type)
  //   setActivePanel('none')
  // }, [insertNode, setActivePanel, type])


  const onDragStart = useCallback(
    (e: DragEvent) => {
      if (isMobileView) return
      e.dataTransfer.setData(NODE_TYPE_DRAG_DATA_FORMAT, type)
      e.dataTransfer.effectAllowed = 'move'
    },
    [isMobileView, type]
  )

  const onClick = useCallback(() => {
    if (!isMobileView) return
    insertNode(type)
    setActivePanel('none')
  }, [insertNode, isMobileView, setActivePanel, type])

  return (
    <div
      className={cn(
        'flex cursor-grab select-none gap-2 border border-dark-300 dark:border-dark-600 rounded-xl bg-dark-400 dark:bg-dark-900 p-2.5 shadow-sm transition hover:(ring-2 ring-teal-600/50)',
        isMobileView && 'active:(opacity-70 scale-98)'
      )}
      onClick={onClick}
      onDragStart={onDragStart}
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
