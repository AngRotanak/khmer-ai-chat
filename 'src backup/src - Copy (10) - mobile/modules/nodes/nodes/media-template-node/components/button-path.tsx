import { Position } from '@xyflow/react'
import CustomHandle from '~/modules/flow-builder/components/handles/custom-handle'

type ButtonPathProps = Readonly<{
  id: string
  label: string
  isConnectable: boolean
  onRemove: (id: string) => void
}>

export function ButtonPath({ id, label, isConnectable, onRemove }: ButtonPathProps) {
  return (
    <div className="relative h-10 flex items-center gap-x-2 px-4 -mx-4">
      {/* 🗑️ Remove button */}
      <button
        type="button"
        className="size-8 flex items-center justify-center border border-dark-200 rounded-md bg-dark-900 text-red-400 outline-none transition hover:(bg-dark-300/60 border-red-400) active:(bg-dark-500 border-red-500)"
        onClick={() => onRemove(id)}
        title="លុបជំហាននេះ"
      >
        <div className="i-mynaui:trash size-4" />
      </button>

      {/* 🏷️ Path label */}
      <input
        type="text"
        value={label}
        readOnly
        className="h-8 w-full border border-dark-200 rounded-md bg-dark-900 px-2.5 text-sm font-medium text-light-100 shadow-sm outline-none transition hover:(bg-dark-300/60 border-teal-600) read-only:(hover:bg-dark-300/30)"
      />

      {/* ✅ Source handle for edge connection */}
      <CustomHandle
        type="source"
        id={id}
        position={Position.Right}
        isConnectable={isConnectable}
        className="absolute right-0 top-1/2 translate-y-[-50%] z-10 w-7 h-7 rounded-full bg-teal-500 shadow-md touch-none hover:(important:ring-2 important:ring-teal-500/50)"
        title="ភ្ជាប់ជំហានបន្ទាប់"
        onTouchStart={e => e.stopPropagation()}
      />
    </div>
  )
}
