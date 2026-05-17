import { useState, useEffect } from "react"
import { ref, get, push } from "firebase/database"
import { db } from "~/lib/firebase"

export interface AttendanceRecord {
    timestamp: string
    officeName: string
    action: string
    status: string
    detail?: string
    remark?: string
    full_name?: string
}



export function useAttendanceRecords(
    groupId: string,
    userId: string | undefined,
    mode: "monthly" | "daily",
    month: string,
    date: string
) {
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [groupedRecords, setGroupedRecords] = useState<Record<string, AttendanceRecord[]>>({})
    const [summary, setSummary] = useState({ checkins: 0, checkouts: 0, late: 0, early: 0 })

    useEffect(() => {
        const fetchRecords = async () => {
            const path = userId
                ? `khmer-autobot/attendance_records/${groupId}/${userId}`
                : `khmer-autobot/attendance_records/${groupId}`

            let snapshot
            try {
                snapshot = await get(ref(db, path))
            } catch (err) {
                await push(ref(db, `logs/webapp/${groupId}`), {
                    type: "attendance_fetch_error",
                    path,
                    error: String(err),
                    timestamp: new Date().toISOString(),
                })
                return
            }

            const allUsers = snapshot.val() || {}

            // 🔹 Log raw user keys
            await push(ref(db, `logs/webapp/${groupId}`), {
                type: "attendance_fetch_raw",
                path,
                month,
                date,
                userKeys: Object.keys(allUsers),
                timestamp: new Date().toISOString(),
            })

            let filtered: AttendanceRecord[] = []
            const grouped: Record<string, AttendanceRecord[]> = {}

            const normalize = (r: any): AttendanceRecord => ({
                timestamp: r.timestamp,
                officeName: r.officeName,
                action: r.action,
                status: r.status,
                detail: r.detail,
                remark: r.remark,
                full_name: r.full_name,
            })

            if (userId) {
                // Already at userId level → keys are dates
                Object.entries(allUsers).forEach(([dayKey, dayRecords]) => {
                    if (!dayRecords || typeof dayRecords !== "object") return

                    if (mode === "daily" && date) {
                        if (dayKey === date) {
                            const normalized = Object.values(dayRecords).map(normalize)
                            filtered.push(...normalized)
                            grouped[dayKey] = normalized
                        }
                    } else if (dayKey.startsWith(month)) {
                        const normalized = Object.values(dayRecords).map(normalize)
                        filtered.push(...normalized)
                        grouped[dayKey] = normalized
                    }
                })
            } else {
                // Group level → keys are user IDs
                Object.entries(allUsers).forEach(([, userDays]) => {
                    Object.entries(userDays as Record<string, any>).forEach(([dayKey, dayRecords]) => {
                        if (!dayRecords || typeof dayRecords !== "object") return

                        if (mode === "daily" && date) {
                            if (dayKey === date) {
                                const normalized = Object.values(dayRecords).map(normalize)
                                filtered.push(...normalized)
                                grouped[dayKey] = (grouped[dayKey] || []).concat(normalized)
                            }
                        } else if (dayKey.startsWith(month)) {
                            const normalized = Object.values(dayRecords).map(normalize)
                            filtered.push(...normalized)
                            grouped[dayKey] = (grouped[dayKey] || []).concat(normalized)
                        }
                    })
                })
            }


            setRecords(filtered)
            setGroupedRecords(grouped)

            const checkins = filtered.filter(r => r.action === "checkin").length
            const checkouts = filtered.filter(r => r.action === "checkout").length
            const late = filtered.filter(r => r.status.includes("⚠️ យឺត")).length
            const early = filtered.filter(r => r.status.includes("⚠️ ចេញមុន")).length
            setSummary({ checkins, checkouts, late, early })

            // 🔹 Save debug logs into Firebase
            await push(ref(db, `logs/webapp/${groupId}`), {
                type: "attendance_fetch",
                path,
                mode,
                month,
                date,
                recordsCount: filtered.length,
                groupedKeys: Object.keys(grouped),
                sampleRecord: filtered[0] || null,
                timestamp: new Date().toISOString(),
            })
        }

        fetchRecords()
    }, [groupId, userId, mode, month, date])

    return { records, groupedRecords, summary }
}
