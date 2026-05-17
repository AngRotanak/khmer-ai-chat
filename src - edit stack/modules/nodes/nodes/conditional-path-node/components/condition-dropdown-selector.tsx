import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import { cn } from '~@/utils/cn'

const conditionList = [
  { id: 'ordered', condition: 'អ្នកប្រើបានបញ្ជាទិញផលិតផល' },
  { id: 'added-to-cart', condition: 'អ្នកប្រើបានបន្ថែមទៅក្នុងកន្ត្រក' },
  { id: 'viewed-product', condition: 'អ្នកប្រើបានមើលផលិតផល' },
  { id: 'clicked-button', condition: 'អ្នកប្រើបានចុចប៊ូតុង' },
  { id: 'submitted-form', condition: 'អ្នកប្រើបានបញ្ចូនទម្រង់' },
  { id: 'messaged-page', condition: 'អ្នកប្រើបានផ្ញើសារមកទំព័រ' },
  { id: 'visited-page', condition: 'អ្នកប្រើបានចូលទំព័រមួយ' },
  { id: 'replied-to-bot', condition: 'អ្នកប្រើបានឆ្លើយតបនឹងបូត' },
  { id: 'clicked-carousel', condition: 'អ្នកប្រើបានចុចលើកាត' },
]



type ConditionDropdownSelectorProps = Readonly<{
  value: { id: string; condition: string } | null;
  onChange: (value: { id: string; condition: string } | null) => void;
}>

export function ConditionDropdownSelector({ value, onChange }: ConditionDropdownSelectorProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="h-8 w-full flex items-center justify-between border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition active:(border-dark-200 bg-dark-400/50) data-[state=open]:(border-dark-200 bg-dark-500) data-[state=closed]:(hover:bg-dark-300)"
        >
          <div className="flex items-center">
            <div className="text-sm font-medium leading-none tracking-wide">
              {value ? value.condition : 'Select Condition'}
            </div>
          </div>

          <div className="i-lucide:chevrons-up-down ml-1 size-3 op-50" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={5}
          className={cn(
            'min-w-40 select-none border border-dark-100 rounded-lg bg-dark-200/90 p-0.5 text-light-50 shadow-xl backdrop-blur-lg transition',
            'animate-in data-[side=top]:slide-in-bottom-0.5 data-[side=bottom]:slide-in-bottom--0.5 data-[side=bottom]:fade-in-40 data-[side=top]:fade-in-40',
          )}
        >
          {conditionList.map(({ id, condition }) => (
            <DropdownMenu.Item
              key={id}
              className="h-8 flex cursor-pointer items-center border border-transparent rounded-lg p-1.5 pr-6 outline-none transition active:(border-dark-100 bg-dark-300) hover:bg-dark-100"
              onSelect={() => onChange({ id, condition })}
            >
              <div className="flex items-center gap-x-2">
                <div className="text-xs font-medium leading-none tracking-wide">
                  {condition}
                </div>
              </div>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
