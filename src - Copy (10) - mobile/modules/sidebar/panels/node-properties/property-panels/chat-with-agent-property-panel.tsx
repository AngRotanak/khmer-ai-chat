import { useState, useEffect } from 'react'
import { useCanvasStore } from '~/stores/canvas-store'
import { produce } from 'immer'
import { cn } from '~@/utils/cn'
import type { ChatWithAgentNodeData } from '~/modules/nodes/types'



export default function ChatWithAgentPropertyPanel({ id }: { id: string }) {
    const node = useCanvasStore(s => s.nodes.find(n => n.id === id))
    const data = node?.data as ChatWithAgentNodeData | undefined

    const [language, setLanguage] = useState<'en' | 'km'>('km')

    useEffect(() => {
        const stored = localStorage.getItem('builder-language')
        if (stored === 'en' || stored === 'km') setLanguage(stored)
    }, [])

    if (!node || node.type !== 'chat-with-agent' || !data) {
        return <div className="text-red-500">⚠️ Invalid node</div>
    }

    const updateData = (patch: Partial<ChatWithAgentNodeData>) => {
        useCanvasStore.getState().setNodes(nodes =>
            produce(nodes, draft => {
                const node = draft.find(n => n.id === id)
                if (!node) return
                Object.assign(node.data, patch)
                node.data.updatedAt = Date.now()
            })
        )
    }

    const setLanguageAndSave = (lang: 'en' | 'km') => {
        setLanguage(lang)
        localStorage.setItem('builder-language', lang)
    }

    const currentMessage =
        language === 'km' ? data.welcome_message_kh ?? '' : data.welcome_message_en ?? ''

    const updateMessage = (value: string) => {
        updateData(language === 'km'
            ? { welcome_message_kh: value }
            : { welcome_message_en: value }
        )
    }

    return (
        <div className="rounded bg-dark-700 p-3 space-y-4">
            {/* Language Toggle */}
            <div className="flex gap-x-2">
                <button
                    type="button"
                    onClick={() => setLanguageAndSave('km')}
                    className={cn(
                        'px-2 py-1 text-xs rounded border',
                        language === 'km'
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-dark-600 text-light-100 border-dark-300'
                    )}
                >
                    ភាសាខ្មែរ
                </button>
                <button
                    type="button"
                    onClick={() => setLanguageAndSave('en')}
                    className={cn(
                        'px-2 py-1 text-xs rounded border',
                        language === 'en'
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-dark-600 text-light-100 border-dark-300'
                    )}
                >
                    English
                </button>
            </div>

            {/* Welcome Message */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold">
                    {language === 'km' ? 'សារស្វាគមន៍' : 'Welcome Message'}
                </label>
                <textarea
                    value={currentMessage}
                    onChange={e => updateMessage(e.target.value)}
                    placeholder={language === 'km'
                        ? 'សរសេរសារស្វាគមន៍នៅទីនេះ...'
                        : 'Type welcome message here...'}
                    className="mt-2 w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 outline-none focus:ring-2 focus:ring-teal-500"
                />
            </div>

            {/* Waiting Conversation Message */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold">
                    {language === 'km' ? 'សាររង់ចាំភ្នាក់ងារ' : 'Waiting Message'}
                </label>
                <textarea
                    value={language === 'km' ? data.waiting_message_kh ?? '' : data.waiting_message_en ?? ''}
                    onChange={e =>
                        updateData(language === 'km'
                            ? { waiting_message_kh: e.target.value }
                            : { waiting_message_en: e.target.value }
                        )
                    }
                    placeholder={language === 'km'
                        ? 'សូមរង់ចាំ កំពុងតភ្ជាប់អ្នកជាមួយភ្នាក់ងារ...'
                        : 'Please wait, connecting you to an agent...'}
                    className="mt-2 w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 outline-none focus:ring-2 focus:ring-teal-500"
                />
            </div>


            {/* Routing */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold">Routing</label>
                <select
                    value={data.routing ?? 'default'}
                    onChange={e => updateData({ routing: e.target.value })}
                    className="mt-2 h-8 w-full rounded bg-dark-600 px-2.5 text-sm"
                >
                    <option value="default">Default</option>
                    <option value="sales">Sales Team</option>
                    <option value="support">Support Team</option>
                </select>
            </div>

            {/* Priority */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold">Priority</label>
                <select
                    value={data.priority ?? 'normal'}
                    onChange={e => updateData({ priority: e.target.value as 'normal' | 'high' })}
                    className="mt-2 h-8 w-full rounded bg-dark-600 px-2.5 text-sm"
                >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                </select>
            </div>
        </div>
    )
}
