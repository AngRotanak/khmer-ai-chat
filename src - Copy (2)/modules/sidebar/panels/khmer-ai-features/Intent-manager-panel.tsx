import { useState, useEffect } from 'react'
import { ref, set, onValue } from 'firebase/database'
import { db } from '~/lib/firebase'

export const IntentManagerPanel = () => {
    const [intents, setIntents] = useState<any[]>([])
    const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null)
    const [editingMode, setEditingMode] = useState<'edit' | 'create' | null>(null)
    const [editingIntent, setEditingIntent] = useState<any | null>(null)

    const [newIntentName, setNewIntentName] = useState('')
    const [newPayload, setNewPayload] = useState('')
    const [newDisplayKH, setNewDisplayKH] = useState('')
    const [newDisplayEN, setNewDisplayEN] = useState('')
    const [newExamplesKM, setNewExamplesKM] = useState<string[]>([''])
    const [newExamplesEN, setNewExamplesEN] = useState<string[]>([''])
    const [newResponsesKM, setNewResponsesKM] = useState<string[]>([''])
    const [newResponsesEN, setNewResponsesEN] = useState<string[]>([''])
    const [newConfidence, setNewConfidence] = useState<number>(0.9)


    const preloadFormFromIntent = (intent: any) => {
        setNewIntentName(intent.intent)
        setNewPayload(intent.payload)
        setNewDisplayKH(intent.display_name?.kh ?? '')
        setNewDisplayEN(intent.display_name?.en ?? '')
        setNewExamplesKM(Object.values(intent.examples?.km ?? {}))
        setNewExamplesEN(Object.values(intent.examples?.en ?? {}))
        setNewResponsesKM(Object.values(intent.responses?.km ?? {}))
        setNewResponsesEN(Object.values(intent.responses?.en ?? {}))
    }


    useEffect(() => {
        const intentRef = ref(db, 'intents')
        onValue(intentRef, snapshot => {
            const data = snapshot.val()
            const result = Object.entries(data ?? {}).map(([key, value]) => ({
                id: key,
                ...(value as object),
            }))
            setIntents(result)
        })
    }, [])

    const resetForm = () => {
        setNewIntentName('')
        setNewPayload('')
        setNewDisplayKH('')
        setNewDisplayEN('')
        setNewExamplesKM([''])
        setNewExamplesEN([''])
        setNewResponsesKM([''])
        setNewResponsesEN([''])
    }

    const handleAdd = (type: 'example' | 'response', lang: 'km' | 'en') => {
        const updater = {
            example: {
                km: () => setNewExamplesKM([...newExamplesKM, '']),
                en: () => setNewExamplesEN([...newExamplesEN, '']),
            },
            response: {
                km: () => setNewResponsesKM([...newResponsesKM, '']),
                en: () => setNewResponsesEN([...newResponsesEN, '']),
            },
        }
        updater[type][lang]()
    }

    const handleUpdate = (
        type: 'example' | 'response',
        lang: 'km' | 'en',
        i: number,
        value: string
    ) => {
        const target = type === 'example'
            ? lang === 'km' ? [...newExamplesKM] : [...newExamplesEN]
            : lang === 'km' ? [...newResponsesKM] : [...newResponsesEN]

        target[i] = value

        if (type === 'example') {
            lang === 'km' ? setNewExamplesKM(target) : setNewExamplesEN(target)
        } else {
            lang === 'km' ? setNewResponsesKM(target) : setNewResponsesEN(target)
        }
    }

    const handleCreateIntent = async () => {
        if (!newIntentName.trim()) return
        const intentRef = ref(db, `intents/${newIntentName}`)
        await set(intentRef, {
            intent: newIntentName,
            payload: newPayload,
            confidence: newConfidence,
            display_name: { kh: newDisplayKH, en: newDisplayEN },
            examples: {
                km: newExamplesKM.filter(s => s.trim()),
                en: newExamplesEN.filter(s => s.trim()),
            },
            responses: {
                km: newResponsesKM.filter(s => s.trim()),
                en: newResponsesEN.filter(s => s.trim()),
            },
        })
        resetForm()
        setEditingMode(null)
    }


    const handleUpdateIntent = async () => {
        if (!selectedIntentId) return
        const intentRef = ref(db, `intents/${selectedIntentId}`)
        await set(intentRef, {
            intent: newIntentName,
            payload: newPayload,
            confidence: newConfidence,
            display_name: { kh: newDisplayKH, en: newDisplayEN },
            examples: {
                km: newExamplesKM.filter(s => s.trim()),
                en: newExamplesEN.filter(s => s.trim()),
            },
            responses: {
                km: newResponsesKM.filter(s => s.trim()),
                en: newResponsesEN.filter(s => s.trim()),
            },
        })
        resetForm()
        setSelectedIntentId(null)
        setEditingIntent(null)
        setEditingMode(null)
    }

    const handleDeleteIntent = async () => {
        if (!selectedIntentId) return
        await set(ref(db, `intents/${selectedIntentId}`), null)
        resetForm()
        setSelectedIntentId(null)
        setEditingIntent(null)
        setEditingMode(null)
    }

    return (
        <div className="p-4 space-y-6 bg-dark-900 text-light-100 rounded-md border border-dark-700 ">
            <h2 className="text-lg font-bold text-teal-400">🧠 Intent Manager</h2>

            {/* Intent Selector */}
            <div>
                <label className="text-xs text-light-100/60">Select Intent</label>
                <select
                    value={selectedIntentId ?? ''}
                    onChange={e => {
                        const id = e.target.value
                        setSelectedIntentId(id)
                        const intent = intents.find(i => i.id === id)
                        setEditingIntent(intent ?? null)
                        setEditingMode(null)
                    }}
                    className="w-full p-2 rounded bg-dark-800 text-light-100 text-sm"
                >
                    <option value="">— Select intent —</option>
                    {intents.map(intent => (
                        <option key={intent.id} value={intent.id}>
                            {intent.display_name?.kh ?? intent.intent}
                        </option>
                    ))}
                </select>
            </div>

            {/* Intent Preview */}
            {selectedIntentId && editingMode === null && editingIntent && (
                <div className="space-y-2 border border-dark-700 bg-dark-800 p-4 rounded">                    
                    <div className="font-semibold text-teal-300">{editingIntent.intent}</div>
                    <div className="text-xs text-light-900/60">Confidence: {editingIntent.confidence ?? '—'}</div>
                    <div className="text-xs text-light-900/60">Payload: {editingIntent.payload}</div>
                    <div className="text-xs text-light-900/60">KH: {editingIntent.display_name?.kh}</div>
                    <div className="text-xs text-light-900/60">EN: {editingIntent.display_name?.en}</div>

                    <div className="text-xs font-semibold mt-2">Examples:</div>
                    <ul className="list-disc ml-4 text-xs text-light-900/60">
                        {Object.values(editingIntent.examples?.km ?? {}).map((s, i) => (
                            <li key={`km-${i}`}>🇰🇭 {String(s)}</li>
                        ))}
                        {Object.values(editingIntent.examples?.en ?? {}).map((s, i) => (
                            <li key={`en-${i}`}>🇺🇸 {String(s)}</li>
                        ))}
                    </ul>

                    <div className="text-xs font-semibold mt-2">Responses:</div>
                    <ul className="list-disc ml-4 text-xs text-light-900/60">
                        {Object.values(editingIntent.responses?.km ?? {}).map((r, i) => (
                            <li key={`res-km-${i}`}>🇰🇭 {String(r)}</li>
                        ))}
                        {Object.values(editingIntent.responses?.en ?? {}).map((r, i) => (
                            <li key={`res-en-${i}`}>🇺🇸 {String(r)}</li>
                        ))}
                    </ul>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => {
                                setEditingMode('edit')
                                if (editingIntent) preloadFormFromIntent(editingIntent)
                            }}
                            className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded text-sm">Edit</button>
                        <button onClick={handleDeleteIntent} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm">Delete</button>
                    </div>
                </div>
            )}

            {/* Create New Button */}
            <button
                onClick={() => {
                    resetForm()
                    setEditingMode('create')
                    setSelectedIntentId(null)
                    setEditingIntent(null)
                }}
                className="text-xs text-teal-400 hover:text-teal-300 mt-4"
            >
                ➕ Create New Intent
            </button>

            {/* Form */}
            {(editingMode === 'edit' || editingMode === 'create') && (
                <div className="mt-4 space-y-3 border border-dark-600 bg-dark-800 p-4 rounded-md">         
                    <input
                        value={newIntentName}
                        onChange={e => setNewIntentName(e.target.value)}
                        placeholder="Intent ID (e.g. ask_delivery_fee)"
                        className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm"
                    />
                     <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={newConfidence}
                        onChange={e => setNewConfidence(parseFloat(e.target.value))}
                        placeholder="Intent Confidence (e.g. 0.85)"
                        className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm"
                    />
                    <input
                        value={newPayload}
                        onChange={e => setNewPayload(e.target.value)}
                        placeholder="Payload (e.g. FLOW::delivery)"
                        className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm"
                    />
                    <input
                        value={newDisplayKH}
                        onChange={e => setNewDisplayKH(e.target.value)}
                        placeholder="Khmer Display Name"
                        className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm"
                    />
                    <input
                        value={newDisplayEN}
                        onChange={e => setNewDisplayEN(e.target.value)}
                        placeholder="English Display Name"
                        className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm"
                    />

                    {/* Examples */}
                    <div>
                        <label className="text-xs text-light-100/60">Khmer Examples</label>
                        {newExamplesKM.map((sample, i) => (
                            <input
                                key={`km-${i}`}
                                value={sample}
                                onChange={e => handleUpdate('example', 'km', i, e.target.value)}
                                placeholder={`Khmer Sample ${i + 1}`}
                                className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm mt-1"
                            />
                        ))}
                        <button
                            onClick={() => handleAdd('example', 'km')}
                            className="text-xs text-teal-400 hover:text-teal-300 mt-1"
                        >
                            + Add Khmer Sample
                        </button>
                    </div>

                    <div>
                        <label className="text-xs text-light-100/60">English Examples</label>
                        {newExamplesEN.map((sample, i) => (
                            <input
                                key={`en-${i}`}
                                value={sample}
                                onChange={e => handleUpdate('example', 'en', i, e.target.value)}
                                placeholder={`English Sample ${i + 1}`}
                                className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm mt-1"
                            />
                        ))}
                        <button
                            onClick={() => handleAdd('example', 'en')}
                            className="text-xs text-teal-400 hover:text-teal-300 mt-1"
                        >
                            + Add English Sample
                        </button>
                    </div>

                    {/* Responses */}
                    <div>
                        <label className="text-xs text-light-100/60">Khmer Responses</label>
                        {newResponsesKM.map((res, i) => (
                            <input
                                key={`res-km-${i}`}
                                value={res}
                                onChange={e => handleUpdate('response', 'km', i, e.target.value)}
                                placeholder={`Khmer Response ${i + 1}`}
                                className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm mt-1"
                            />
                        ))}
                        <button
                            onClick={() => handleAdd('response', 'km')}
                            className="text-xs text-teal-400 hover:text-teal-300 mt-1"
                        >
                            + Add Khmer Response
                        </button>
                    </div>

                    <div>
                        <label className="text-xs text-light-100/60">English Responses</label>
                        {newResponsesEN.map((res, i) => (
                            <input
                                key={`res-en-${i}`}
                                value={res}
                                onChange={e => handleUpdate('response', 'en', i, e.target.value)}
                                placeholder={`English Response ${i + 1}`}
                                className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm mt-1"
                            />
                        ))}
                        <button
                            onClick={() => handleAdd('response', 'en')}
                            className="text-xs text-teal-400 hover:text-teal-300 mt-1"
                        >
                            + Add English Response
                        </button>
                    </div>

                    {/* Action Buttons */}
                    {editingMode === 'create' && (
                        <button
                            onClick={handleCreateIntent}
                            className="mt-4 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm font-medium"
                        >
                            Create Intent
                        </button>
                    )}

                    {editingMode === 'edit' && (
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleUpdateIntent}
                                className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm font-medium"
                            >
                                Update Intent
                            </button>
                            <button
                                onClick={handleDeleteIntent}
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-medium"
                            >
                                Delete Intent
                            </button>
                        </div>
                    )}
                </div>
            )}

        </div>
    )
}
