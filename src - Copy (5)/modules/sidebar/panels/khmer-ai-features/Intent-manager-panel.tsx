import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '~/lib/firebase'
import React from 'react'
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "firebase/auth"

import { useFlowSession } from '~/stores/flow-session'
import { useApplicationState } from '~/stores/application-state'
import { get, set } from "firebase/database"

export const IntentManagerPanel = () => {
    const { currentPageId } = useFlowSession()
    const flowList = useApplicationState(s => s.flowList)

    // ✅ Local state for intents
    const [intents, setIntents] = useState<any[]>([])

    const auth = getAuth()
    setPersistence(auth, browserLocalPersistence)



    useEffect(() => {
        if (!currentPageId) return
        const path = `khmer-ai-chat/pages/${currentPageId}/agents`
        const intentRef = ref(db, path)
        get(intentRef).then(snapshot => {
            console.log("📥 One-time snapshot data:", snapshot.val())
        })
    }, [currentPageId])


    // ✅ Log auth state
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (user) {
                console.log("✅ Authenticated as:", user.uid)
            } else {
                console.warn("❌ Not signed in")
            }
        })
        return () => unsubscribeAuth()
    }, [])

    useEffect(() => {
        const auth = getAuth()
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (user && currentPageId) {
                const path = `khmer-ai-chat/pages/${currentPageId}/agents/intents`
                console.log("📡 Listening to intents at path:", path)

                const intentRef = ref(db, path)
                const unsubscribeIntents = onValue(intentRef, snapshot => {
                    const data = snapshot.val()
                    console.log("📥 Raw snapshot data:", data)

                    const result = Object.entries(data ?? {}).map(([key, value]) => ({
                        id: key,
                        ...(value as object),
                    }))
                    console.log("✅ Parsed intents:", result)
                    setIntents(result)
                })

                // cleanup
                return () => {
                    console.log("🛑 Unsubscribing from intents listener at path:", path)
                    unsubscribeIntents()
                }
            }
        })

        return () => unsubscribeAuth()
    }, [currentPageId])




    const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null)
    const [editingMode, setEditingMode] = useState<'edit' | 'create' | null>(null)
    const [editingIntent, setEditingIntent] = useState<any | null>(null)
    const [newEnabled, setNewEnabled] = useState(true)  // default true

    const [newIntentName, setNewIntentName] = useState('')
    const [newPayload, setNewPayload] = useState('')
    const [newDisplayKH, setNewDisplayKH] = useState('')
    const [newDisplayEN, setNewDisplayEN] = useState('')
    const [newExamplesKM, setNewExamplesKM] = useState<string[]>([''])
    const [newExamplesEN, setNewExamplesEN] = useState<string[]>([''])
    const [newResponsesKM, setNewResponsesKM] = useState<string[]>([''])
    const [newResponsesEN, setNewResponsesEN] = useState<string[]>([''])
    const [newConfidence, setNewConfidence] = useState<number>(0.9)
    const [newSubIntents, setNewSubIntents] = useState<
        {
            payload?: string   // ✅ add payload
            examples: { en: string[]; kh: string[] }
            responses: { en: string[]; kh: string[] }
        }[]
    >([])


    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);


    const preloadFormFromIntent = (intent: any) => {
        setNewIntentName(intent.intent)
        setNewPayload(intent.payload)
        setNewDisplayKH(intent.display_name?.kh ?? '')
        setNewDisplayEN(intent.display_name?.en ?? '')
        setNewExamplesKM(Object.values(intent.examples?.kh ?? {}))
        setNewExamplesEN(Object.values(intent.examples?.en ?? {}))
        setNewResponsesKM(Object.values(intent.responses?.kh ?? {}))
        setNewResponsesEN(Object.values(intent.responses?.en ?? {}))
        setNewSubIntents(intent.sub_intents ?? [])   // 👈 preload sub‑intents
    }

    const resetForm = () => {
        setNewIntentName('')
        setNewPayload('')
        setNewDisplayKH('')
        setNewDisplayEN('')
        setNewExamplesKM([''])
        setNewExamplesEN([''])
        setNewResponsesKM([''])
        setNewResponsesEN([''])
        setNewSubIntents([])   // 👈 clear sub‑intents
    }

    const triggerEmbedding = async (pageId: string) => {
        setLoading(true);
        try {
            const res = await fetch(
                `https://khmer-aipredict-829164226941.asia-east2.run.app/trigger-intent-embedding/${pageId}`,
                { method: "POST" }
            );
            const data = await res.json();
            setStatus(data.status);
        } catch (err) {
            setStatus(`❌ Error triggering embedding: ${String(err)}`);
        } finally {
            setLoading(false);
        }
    };


    const reloadVectors = async (pageId: string) => {
        if (!pageId) {
            setStatus("⚠️ Missing page_id — please select a page first");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("https://khmer-aipredict-829164226941.asia-east2.run.app/reload_vectors", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Admin-Token": "KhmerAiChatbot-020818", // required
                },
                body: JSON.stringify({ page_id: pageId }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status}: ${text}`);
            }

            const data = await res.json();
            setStatus(data.status);
        } catch (err) {
            setStatus(`❌ Error reloading vectors: ${String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = (type: 'example' | 'response', lang: 'kh' | 'en') => {
        const updater = {
            example: {
                kh: () => setNewExamplesKM([...newExamplesKM, '']),
                en: () => setNewExamplesEN([...newExamplesEN, '']),
            },
            response: {
                kh: () => setNewResponsesKM([...newResponsesKM, '']),
                en: () => setNewResponsesEN([...newResponsesEN, '']),
            },
        }
        updater[type][lang]()
    }

    const handleUpdate = (
        type: 'example' | 'response',
        lang: 'kh' | 'en',
        i: number,
        value: string
    ) => {
        const target = type === 'example'
            ? lang === 'kh' ? [...newExamplesKM] : [...newExamplesEN]
            : lang === 'kh' ? [...newResponsesKM] : [...newResponsesEN]

        target[i] = value

        if (type === 'example') {
            lang === 'kh' ? setNewExamplesKM(target) : setNewExamplesEN(target)
        } else {
            lang === 'kh' ? setNewResponsesKM(target) : setNewResponsesEN(target)
        }
    }

    const handleCreateIntent = async () => {
        if (!newIntentName.trim()) return
        const intentRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/agents/intents/${newIntentName}`)
        await set(intentRef, {
            intent: newIntentName,
            enabled: newEnabled, // ✅ include enabled flag
            payload: newPayload,
            confidence: newConfidence,
            display_name: { kh: newDisplayKH, en: newDisplayEN },
            examples: {
                kh: newExamplesKM.filter(s => s.trim()),
                en: newExamplesEN.filter(s => s.trim()),
            },
            responses: {
                kh: newResponsesKM.filter(s => s.trim()),
                en: newResponsesEN.filter(s => s.trim()),
            },
            sub_intents: newSubIntents.map(sub => ({
                payload: sub.payload || '',   // ✅ include payload
                examples: {
                    kh: sub.examples.kh.filter(s => s.trim()),
                    en: sub.examples.en.filter(s => s.trim()),
                },
                responses: {
                    kh: sub.responses.kh.filter(s => s.trim()),
                    en: sub.responses.en.filter(s => s.trim()),
                },
            })),

        })
        resetForm()
        setEditingMode(null)
    }


    const handleUpdateIntent = async () => {
        if (!selectedIntentId) return
        const intentRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/agents/intents/${selectedIntentId}`)
        await set(intentRef, {
            intent: newIntentName,
            enabled: newEnabled, // ✅ include enabled flag
            payload: newPayload,
            confidence: newConfidence,
            display_name: { kh: newDisplayKH, en: newDisplayEN },
            examples: {
                kh: newExamplesKM.filter(s => s.trim()),
                en: newExamplesEN.filter(s => s.trim()),
            },
            responses: {
                kh: newResponsesKM.filter(s => s.trim()),
                en: newResponsesEN.filter(s => s.trim()),
            },
            sub_intents: newSubIntents.map(sub => ({
                payload: sub.payload || '',   // ✅ include payload
                examples: {
                    kh: sub.examples.kh.filter(s => s.trim()),
                    en: sub.examples.en.filter(s => s.trim()),
                },
                responses: {
                    kh: sub.responses.kh.filter(s => s.trim()),
                    en: sub.responses.en.filter(s => s.trim()),
                },
            })),   // 👈 include sub‑intents
        })
        resetForm()
        setSelectedIntentId(null)
        setEditingIntent(null)
        setEditingMode(null)

    }

    const handleRefreshPredictionEngine = async () => {
        if (!currentPageId) {
            setStatus("⚠️ Please select a page before refreshing the prediction engine");
            return;
        }

        setLoading(true);
        setStatus("⏳ Cloud Run service is starting... this may take 10–30 seconds on first run");

        try {
            // Step 1: trigger embedding build/upload
            setStatus("🔄 Building and uploading embeddings...");
            await triggerEmbedding(currentPageId);

            // Step 2: reload vectors cache
            setStatus("🔄 Reloading vectors cache...");
            await reloadVectors(currentPageId);

            setStatus("✅ Prediction engine refreshed successfully");
        } catch (err) {
            console.error("Error refreshing prediction engine:", err);
            setStatus(`❌ Error: ${String(err)}`);
        } finally {
            setLoading(false);
        }
    };



    const handleDeleteIntent = async () => {
        if (!selectedIntentId) return
        await set(ref(db, `khmer-ai-chat/pages/${currentPageId}/agents/intents/${selectedIntentId}`), null)
        resetForm()
        setSelectedIntentId(null)
        setEditingIntent(null)
        setEditingMode(null)
    }


    // Add a new blank sub‑intent
    const handleAddSubIntent = () => {
        setNewSubIntents([
            ...newSubIntents,
            {
                payload: '',   // ✅ initialize payload
                examples: { en: [''], kh: [''] },
                responses: { en: [''], kh: [''] },
            },
        ])
    }


    // Update sub‑intent ID or other top‑level field
    // const handleSubIntentUpdate = (idx: number, field: string, value: string) => {
    //     const updated = [...newSubIntents]
    //     updated[idx] = { ...updated[idx], [field]: value }
    //     setNewSubIntents(updated)
    // }

    // Update examples
    const handleSubIntentExampleUpdate = (idx: number, lang: 'en' | 'kh', i: number, value: string) => {
        const updated = [...newSubIntents]
        updated[idx].examples[lang][i] = value
        setNewSubIntents(updated)
    }

    // Add new example
    const handleAddSubIntentExample = (idx: number, lang: 'en' | 'kh') => {
        const updated = [...newSubIntents]
        updated[idx].examples[lang].push('')
        setNewSubIntents(updated)
    }

    // Update responses
    const handleSubIntentResponseUpdate = (idx: number, lang: 'en' | 'kh', i: number, value: string) => {
        const updated = [...newSubIntents]
        updated[idx].responses[lang][i] = value
        setNewSubIntents(updated)
    }

    // Add new response
    const handleAddSubIntentResponse = (idx: number, lang: 'en' | 'kh') => {
        const updated = [...newSubIntents]
        updated[idx].responses[lang].push('')
        setNewSubIntents(updated)
    }

    // Delete sub‑intent
    const handleDeleteSubIntent = (idx: number) => {
        const updated = [...newSubIntents]
        updated.splice(idx, 1)
        setNewSubIntents(updated)
    }



    return (
        <div className="p-4 space-y-6 bg-dark-900 text-light-100 rounded-md border border-dark-700 ">
            <h2 className="text-lg font-bold text-teal-400">🧠 Intent Manager</h2>


            {/* Intent Selector + Update Button */}
            <div className="flex flex-col space-y-2">
                <div>
                    <label className="text-xs text-light-100/60">Select Intent</label>
                    <select
                        value={selectedIntentId ?? ''}
                        onChange={e => {
                            const id = e.target.value;
                            setSelectedIntentId(id);
                            const intent = intents.find(i => i.id === id);
                            setEditingIntent(intent ?? null);
                            setEditingMode(null);
                        }}
                        className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    >
                        <option value="">— Select intent —</option>
                        {intents.map(intent => (
                            <option key={intent.id} value={intent.id}>
                                {intent.display_name?.kh ?? intent.intent}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Update Intents Button */}
                <button
                    onClick={handleRefreshPredictionEngine}
                    disabled={loading}
                    className="text-xs text-teal-400 hover:text-teal-300"
                >
                    {loading ? "⏳ Please wait..." : "Refresh Prediction Engine"}
                </button>

                {status && <p className="text-xs text-light-900/60 mt-2">{status}</p>}
            </div>



            {/* Intent Preview */}
            {selectedIntentId && editingMode === null && editingIntent && (
                <div className="space-y-2 border border-dark-700 bg-dark-800 p-4 rounded">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            checked={editingIntent.enabled ?? true}
                            onChange={async (e) => {
                                const newEnabled = e.target.checked
                                // Update Firebase immediately
                                await set(
                                    ref(db, `khmer-ai-chat/pages/${currentPageId}/agents/intents/${editingIntent.intent}/enabled`),
                                    newEnabled
                                )

                                // Update local state
                                setEditingIntent({ ...editingIntent, enabled: newEnabled })
                            }}
                            className="accent-teal-500"
                        />
                        <label className="text-xs text-light-900/60">
                            Enabled (toggle off to hold/disable this intent)
                        </label>
                    </div>

                    {/* Static info (always visible) */}
                    <div className="font-semibold text-teal-300">{editingIntent.intent}</div>
                    <div className="text-xs text-light-900/60">Confidence: {editingIntent.confidence ?? '—'}</div>

                    <div className="text-xs text-light-900/60">
                        Payload: {
                            (() => {
                                if (!editingIntent.payload) return "—"
                                const [blockType, blockId] = editingIntent.payload.split(".")
                                const flow = flowList.find(f => f.id === blockId && f.type === blockType)
                                return flow
                                    ? `${blockType} → ${flow.name || blockId}`
                                    : editingIntent.payload
                            })()
                        }
                    </div>

                    <div className="text-xs text-light-900/60">KH: {editingIntent.display_name?.kh}</div>
                    <div className="text-xs text-light-900/60">EN: {editingIntent.display_name?.en}</div>




                    {/* Scrollable Examples */}
                    <div className="text-xs font-semibold mt-2">Examples:</div>
                    <div className="max-h-[150px] overflow-y-auto scrollbar-dark-teal">
                        <ul className="list-disc ml-4 text-xs text-light-900/60 space-y-1">
                            {Object.values(editingIntent.examples?.kh ?? {}).map((s, i) => (
                                <li key={`kh-${i}`}>🇰🇭 {String(s)}</li>
                            ))}
                            {Object.values(editingIntent.examples?.en ?? {}).map((s, i) => (
                                <li key={`en-${i}`}>🇺🇸 {String(s)}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Scrollable Responses */}
                    <div className="text-xs font-semibold mt-2">Responses:</div>
                    <div className="max-h-[150px] overflow-y-auto scrollbar-dark-teal">
                        <ul className="list-disc ml-4 text-xs text-light-900/60 space-y-1">
                            {Object.values(editingIntent.responses?.kh ?? {}).map((r, i) => (
                                <li key={`res-kh-${i}`}>🇰🇭 {String(r)}</li>
                            ))}
                            {Object.values(editingIntent.responses?.en ?? {}).map((r, i) => (
                                <li key={`res-en-${i}`}>🇺🇸 {String(r)}</li>
                            ))}
                        </ul>
                    </div>


                    {/* ✅ Sub‑Intents Preview */}
                    {Array.isArray(editingIntent?.sub_intents) && editingIntent.sub_intents.length > 0 && (
                        <div className="mt-4">
                            <div className="text-xs font-semibold">Sub‑Intents:</div>
                            <ul className="list-disc ml-4 text-xs text-light-900/60 space-y-2">
                                {editingIntent.sub_intents.map(
                                    (
                                        sub: {
                                            intent: string
                                            payload?: string
                                            examples?: { en?: string[]; kh?: string[] }
                                            responses?: { en?: string[]; kh?: string[] }
                                        },
                                        idx: number
                                    ) => (
                                        <li key={`sub-${idx}`}>
                                            <div className="font-semibold text-teal-400">
                                                {sub.intent}
                                                {/* Show payload nicely if present */}
                                                {sub.payload && (
                                                    <span className="ml-2 text-light-900/60 text-xs">
                                                        {(() => {
                                                            const parts = sub.payload.split(".")
                                                            const blockType = parts[0]
                                                            const blockId = parts[1]
                                                            const subIntentId = parts[2]

                                                            const flow = flowList.find(f => f.id === blockId && f.type === blockType)
                                                            return flow
                                                                ? `${blockType} → ${flow.name || blockId}${subIntentId ? ` ↳ ${subIntentId}` : ""
                                                                }`
                                                                : sub.payload
                                                        })()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="ml-2">
                                                <div>🇰🇭 Examples:</div>
                                                <ul className="list-disc ml-4">
                                                    {Array.isArray(sub.examples?.kh) &&
                                                        sub.examples.kh.map((s: string, i: number) => (
                                                            <li key={`sub-kh-${idx}-${i}`}>{s}</li>
                                                        ))}
                                                </ul>

                                                <div>🇺🇸 Examples:</div>
                                                <ul className="list-disc ml-4">
                                                    {Array.isArray(sub.examples?.en) &&
                                                        sub.examples.en.map((s: string, i: number) => (
                                                            <li key={`sub-en-${idx}-${i}`}>{s}</li>
                                                        ))}
                                                </ul>

                                                <div>Responses:</div>
                                                <ul className="list-disc ml-4">
                                                    {Array.isArray(sub.responses?.kh) &&
                                                        sub.responses.kh.map((r: string, i: number) => (
                                                            <li key={`sub-res-kh-${idx}-${i}`}>🇰🇭 {r}</li>
                                                        ))}
                                                    {Array.isArray(sub.responses?.en) &&
                                                        sub.responses.en.map((r: string, i: number) => (
                                                            <li key={`sub-res-en-${idx}-${i}`}>🇺🇸 {r}</li>
                                                        ))}
                                                </ul>
                                            </div>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => {
                                setEditingMode('edit')
                                if (editingIntent) preloadFormFromIntent(editingIntent)
                            }}
                            className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded text-sm"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleDeleteIntent}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                        >
                            Delete
                        </button>
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
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            checked={newEnabled}
                            onChange={(e) => setNewEnabled(e.target.checked)}
                            className="accent-teal-500"
                        />
                        <label className="text-xs text-light-900/60">
                            Enabled
                        </label>
                    </div>

                    {/* Static fields */}
                    <input
                        value={newIntentName}
                        onChange={e => setNewIntentName(e.target.value)}
                        placeholder="Intent ID (e.g. ask_delivery_fee)"
                        className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={newConfidence}
                        onChange={e => setNewConfidence(parseFloat(e.target.value))}
                        placeholder="Intent Confidence (e.g. 0.85)"
                        className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />

                    {/* Flow Payload Dropdown */}
                    <label className="block text-xs text-light-100/60 mb-1">Select Flow</label>

                    <select
                        value={newPayload}
                        onChange={e => setNewPayload(e.target.value)}
                        className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
                    >
                        <option value="">ជ្រើសរើស flow…</option>
                        {flowList.length > 0 ? (
                            flowList.map(flow => (
                                <option key={flow.id} value={`${flow.type}.${flow.id}`}>
                                    🧩 {flow.type} – {flow.name || flow.id}
                                </option>
                            ))
                        ) : (
                            <option disabled value="">⚠️ No flows available</option>
                        )}
                    </select>

                    <input
                        value={newDisplayKH}
                        onChange={e => setNewDisplayKH(e.target.value)}
                        placeholder="Khmer Display Name"
                        className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />
                    <input
                        value={newDisplayEN}
                        onChange={e => setNewDisplayEN(e.target.value)}
                        placeholder="English Display Name"
                        className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />

                    {/* Scrollable Examples */}
                    <div>
                        <label className="text-xs text-light-200">Khmer Examples</label>
                        <div className="max-h-[150px] overflow-y-auto scrollbar-dark-teal space-y-1 mt-1 border border-dark-600 rounded-md p-2">
                            {newExamplesKM.map((sample, i) => (
                                <input
                                    key={`kh-${i}`}
                                    value={sample}
                                    onChange={e => handleUpdate('example', 'kh', i, e.target.value)}
                                    placeholder={`Khmer Sample ${i + 1}`}
                                    className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => handleAdd('example', 'kh')}
                            className="text-xs text-teal-400 hover:text-teal-300 mt-1 transition-colors duration-200"
                        >
                            + Add Khmer Sample
                        </button>
                    </div>

                    <div>
                        <label className="text-xs text-light-100/60">English Examples</label>
                        <div className="max-h-[150px] overflow-y-auto scrollbar-dark-teal space-y-1 mt-1 border border-dark-600 rounded-md p-2">
                            {newExamplesEN.map((sample, i) => (
                                <input
                                    key={`en-${i}`}
                                    value={sample}
                                    onChange={e => handleUpdate('example', 'en', i, e.target.value)}
                                    placeholder={`English Sample ${i + 1}`}
                                    className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => handleAdd('example', 'en')}
                            className="text-xs text-teal-400 hover:text-teal-300 mt-1 transition-colors duration-200"
                        >
                            + Add English Sample
                        </button>
                    </div>

                    {/* Scrollable Responses */}
                    <div>
                        <label className="text-xs text-light-100/60">Khmer Responses</label>
                        <div className="max-h-[150px] overflow-y-auto scrollbar-dark-teal space-y-1 mt-1 border border-dark-600 rounded-md p-2">
                            {newResponsesKM.map((res, i) => (
                                <input
                                    key={`res-kh-${i}`}
                                    value={res}
                                    onChange={e => handleUpdate('response', 'kh', i, e.target.value)}
                                    placeholder={`Khmer Response ${i + 1}`}
                                    className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => handleAdd('response', 'kh')}
                            className="text-xs text-teal-400 hover:text-teal-300 mt-1 transition-colors duration-200"
                        >
                            + Add Khmer Response
                        </button>
                    </div>

                    <div>
                        <label className="text-xs text-light-100/60">English Responses</label>
                        <div className="max-h-[150px] overflow-y-auto scrollbar-dark-teal space-y-1 mt-1 border border-dark-600 rounded-md p-2">
                            {newResponsesEN.map((res, i) => (
                                <input
                                    key={`res-en-${i}`}
                                    value={res}
                                    onChange={e => handleUpdate('response', 'en', i, e.target.value)}
                                    placeholder={`English Response ${i + 1}`}
                                    className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => handleAdd('response', 'en')}
                            className="text-xs text-teal-400 hover:text-teal-300 mt-1 transition-colors duration-200"
                        >
                            + Add English Response
                        </button>
                    </div>



                    <div className="mt-6 border-t border-dark-600 pt-4">
                        <label className="block text-sm text-light-100 mb-2">Sub‑Intents</label>

                        {newSubIntents.map((sub, idx) => (
                            <div
                                key={idx}
                                className="mb-6 p-4 border border-dark-600 rounded-md bg-dark-800 space-y-4"
                            >
                                {/* Flow selector */}
                                <select
                                    value={sub.payload || ""}
                                    onChange={e => {
                                        const updated = [...newSubIntents];
                                        updated[idx] = { ...updated[idx], payload: e.target.value };
                                        setNewSubIntents(updated);
                                    }}
                                    className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
                                >
                                    <option value="">ជ្រើសរើស flow…</option>
                                    {flowList.length > 0 ? (
                                        flowList.map(flow => (
                                            <React.Fragment key={flow.id}>
                                                <option value={`${flow.type}.${flow.id}`}>
                                                    🧩 {flow.type} – {flow.name || flow.id}
                                                </option>
                                                {Array.isArray(flow.sub_intents) &&
                                                    flow.sub_intents.map(subIntent => (
                                                        <option
                                                            key={`${flow.id}-${subIntent.intent}`}
                                                            value={`${flow.type}.${flow.id}.${subIntent.intent}`}
                                                        >
                                                            ↳ {subIntent.display_name?.en || subIntent.intent}
                                                        </option>
                                                    ))}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <option disabled value="">⚠️ No flows available</option>
                                    )}
                                </select>

                                {/* English Examples */}
                                <div>
                                    <label className="block text-xs text-light-200 mb-1">English Examples</label>
                                    {sub.examples.en.map((ex, i) => (
                                        <input
                                            key={`sub-en-${idx}-${i}`}
                                            value={ex}
                                            onChange={e => handleSubIntentExampleUpdate(idx, 'en', i, e.target.value)}
                                            placeholder={`EN Example ${i + 1}`}
                                            className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                                        />
                                    ))}
                                    <button
                                        onClick={() => handleAddSubIntentExample(idx, 'en')}
                                        className="text-xs text-teal-400 hover:text-teal-300"
                                    >
                                        ➕ Add EN Example
                                    </button>
                                </div>

                                {/* Khmer Examples */}
                                <div>
                                    <label className="block text-xs text-light-200 mb-1">Khmer Examples</label>
                                    {sub.examples.kh.map((ex, i) => (
                                        <input
                                            key={`sub-kh-${idx}-${i}`}
                                            value={ex}
                                            onChange={e => handleSubIntentExampleUpdate(idx, 'kh', i, e.target.value)}
                                            placeholder={`KH Example ${i + 1}`}
                                            className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                                        />
                                    ))}
                                    <button
                                        onClick={() => handleAddSubIntentExample(idx, 'kh')}
                                        className="text-xs text-teal-400 hover:text-teal-300"
                                    >
                                        ➕ Add KH Example
                                    </button>
                                </div>

                                {/* Responses */}
                                <div>
                                    <label className="block text-xs text-light-200 mb-1">Responses (EN + KH)</label>
                                    {sub.responses.en.map((res, i) => (
                                        <input
                                            key={`sub-res-en-${idx}-${i}`}
                                            value={res}
                                            onChange={e => handleSubIntentResponseUpdate(idx, 'en', i, e.target.value)}
                                            placeholder={`EN Response ${i + 1}`}
                                            className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                                        />
                                    ))}
                                    <button
                                        onClick={() => handleAddSubIntentResponse(idx, 'en')}
                                        className="text-xs text-teal-400 hover:text-teal-300"
                                    >
                                        ➕ Add EN Response
                                    </button>

                                    {sub.responses.kh.map((res, i) => (
                                        <input
                                            key={`sub-res-kh-${idx}-${i}`}
                                            value={res}
                                            onChange={e => handleSubIntentResponseUpdate(idx, 'kh', i, e.target.value)}
                                            placeholder={`KH Response ${i + 1}`}
                                            className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                                        />
                                    ))}
                                    <button
                                        onClick={() => handleAddSubIntentResponse(idx, 'kh')}
                                        className="text-xs text-teal-400 hover:text-teal-300"
                                    >
                                        ➕ Add KH Response
                                    </button>
                                </div>

                                {/* Delete Sub‑Intent */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleDeleteSubIntent(idx)}
                                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs"
                                    >
                                        ❌ Delete Sub‑Intent
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add New Sub‑Intent */}
                        <button
                            onClick={handleAddSubIntent}
                            className="text-xs text-teal-400 hover:text-teal-300 mt-2"
                        >
                            ➕ Add Sub‑Intent
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


