import type { TextMessageNodeData } from '~/modules/nodes/nodes/text-message-node/text-message.node'
import type { BuilderNodeType } from '~/modules/nodes/types'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import { listify } from 'radash'
import { useMemo } from 'react'

import { cn } from '~@/utils/cn'
import { MessageChannelDetails } from '~/modules/nodes/nodes/text-message-node/constants/channels'

type TextMessageNodePropertyPanelProps = Readonly<{
  id: string
  type: BuilderNodeType
  data: TextMessageNodeData
  updateData: (data: Partial<TextMessageNodeData>) => void
}>

export default function TextMessageNodePropertyPanel({
  id,
  data,
  updateData,
}: TextMessageNodePropertyPanelProps) {
  const currentMessageChannelDetail = useMemo(() => {
    return MessageChannelDetails[data.channel]
  }, [data.channel])

  return (
     <div className="rounded bg-dark-700 p-3 space-y-2">
      {/* Unique Identifier */}
      <div className="flex flex-col">
        <div className="text-xs text-light-900/60 dark:text-light-100/60 font-semibold">
          Unique Identifier
        </div>
        <div className="mt-2 flex">          
          <input
            type="text"
            value={id}
            readOnly
            className="h-8 w-full border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-300/60 dark:hover:bg-dark-700/60 read-only:(text-light-900/80 dark:text-light-100/80 opacity-80)"
          />
        </div>
      </div>

      {/* Channel Selector */}
      <div className="flex flex-col">
        <div className="text-xs text-light-900/60 dark:text-light-100/60 font-semibold">
          Channel
        </div>
        <div className="mt-2 flex">
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="h-8 w-full flex items-center justify-between border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 shadow-sm outline-none transition active:(border-dark-200 dark:border-dark-600 bg-dark-400/50 dark:bg-dark-700/50) data-[state=open]:(bg-dark-500 dark:bg-dark-700) data-[state=closed]:(hover:bg-dark-300/60 dark:hover:bg-dark-700/60)"
              >
                <div className="flex items-center">
                  <div className={cn(currentMessageChannelDetail.icon, 'size-4')} />
                  <div className="ml-2 text-sm font-medium leading-none tracking-wide">
                    {currentMessageChannelDetail.name}
                  </div>
                </div>
                <div className="i-lucide:chevrons-up-down ml-1 size-3 opacity-50" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={5}
                align="start"
                className={cn(
                  '[width:var(--radix-popper-anchor-width)] select-none border border-dark-100 dark:border-dark-700 rounded-lg bg-dark-200/90 dark:bg-dark-800/90 p-0.5 text-light-50 dark:text-light-100 shadow-xl backdrop-blur-lg transition',
                  'animate-in data-[side=top]:slide-in-bottom-0.5 data-[side=bottom]:slide-in-bottom--0.5 data-[side=bottom]:fade-in-40 data-[side=top]:fade-in-40',
                )}
              >
                {listify(MessageChannelDetails, (k, v) => (
                  <DropdownMenu.Item
                    key={k}
                    className="cursor-pointer border border-transparent rounded-lg p-1.5 outline-none transition active:(border-dark-100 dark:border-dark-600 bg-dark-300/60 dark:bg-dark-700/60) hover:bg-dark-100 dark:hover:bg-dark-700"
                    onSelect={() => updateData({ channel: k })}
                  >
                    <div className="flex items-center gap-x-2">
                      <div className={cn(v.icon, 'size-4')} />
                      <div className="text-xs font-medium leading-none tracking-wide">
                        {v.name}
                      </div>
                    </div>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Message Textarea */}
      <div className="rounded bg-dark-700 p-3 space-y-2">
        <div className="block text-sm font-medium text-light-100">
          Message
        </div>
          <textarea
            value={data.message}
            onChange={e => updateData({ message: e.target.value })}
            placeholder="Type your message here..."
            className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
       
      </div>
    </div>
  )
}
