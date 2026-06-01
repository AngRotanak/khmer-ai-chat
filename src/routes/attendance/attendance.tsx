import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { db } from '~/lib/firebase'
import { ref, push, getDatabase, get, onValue } from 'firebase/database'
import { lazy, Suspense } from 'react'
import { useAttendanceStore } from "~/stores/attendanceStore"
const CameraModal = lazy(() => import('./components/CameraModal'))
import { useTelegramWebApp } from '~/hooks/useTelegramWebApp'
import AttendanceFooter from './components/AttendanceFooter'
import { Link } from "@tanstack/react-router"
import useUserSettings from './components/useUserSettings'


export const Route = createFileRoute('/attendance')({
  component: AttendancePage,
})

interface OfficeDetectionResult {
  officeDetected: boolean
  officeName: string
  distance: number | null
  officeId: string
  status: string
  detail: string
}


function AttendancePage() {
  const tg = useTelegramWebApp()
  const [userId, setUserId] = useState<string | null>(null)
  const { settings, updateSetting } = useUserSettings(userId || "guest")

  const [loading, setLoading] = useState<'idle' | 'working' | 'success'>('idle')
  const [groupId, setGroupId] = useState<string>('unknown')
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [currentRole, setCurrentRole] = useState("member")
  const [showMore, setShowMore] = useState(false)
 const [pageReady, setPageReady] = useState(false)

  const {
    officeDetected,
    officeName,
    distance,
    officeId,          // ✅ now comes from store
    nextAction,
    lastCheckInTime,
    missedCheckout,
    status,
    detail,
    photo,
    setOfficeDetected,
    setOfficeName,
    setDistance,
    setOfficeId,       // ✅ store mutator
    setNextAction,
    setLastCheckInTime,
    setMissedCheckout,
    setStatus,
    setDetail,
    setPhoto,
  } = useAttendanceStore()
  const [reasonOptions, setReasonOptions] = useState<Record<string, string>>({})

  // Example effect: run detection only if not already detected
  useEffect(() => {
    if (!officeDetected) {
      detectOffice(nextAction) // no .then, because it doesn’t return anything
    }
  }, [officeDetected, nextAction])


  // ✅ Remove duplicate detectOffice effect
  // Detection now only runs inside initAttendance
  useEffect(() => {
    if (!officeDetected) {
      detectOffice(nextAction).then((result) => {
        setOfficeDetected(result.officeDetected)
        setOfficeName(result.officeName)
        setDistance(result.distance)
        setOfficeId(result.officeId)
        setStatus(result.status)
        setDetail(result.detail)
      })
    }
  }, [officeDetected, nextAction])


  const fallbackReasons: Record<string, string> = {
    traffic: "🚗 Traffic",
    medical: "🏥 Medical",
    family: "👨‍👩‍👧 Family",
    other: "✏️ Other",
  }


  // =========================
  // INIT TELEGRAM
  // =========================
  useEffect(() => {
    const init = async () => {
      if (!tg) return
      tg.ready()
      tg.expand()

      try {
        const rawParam = tg.initDataUnsafe?.start_param
        const userInfo = tg?.initDataUnsafe?.user || {}
        const uid = userInfo?.id || null
        setUserId(uid)

        await log({ type: "raw_start_param", raw: rawParam, user_id: uid, user_info: userInfo }, "logs/webapp/init")

        if (!rawParam) {
          setGroupId("unknown")
          setSessionLoaded(true)
          return
        }

        const normalized = rawParam.startsWith("?") ? rawParam : `?${rawParam}`
        const safeParam = normalized.replace(/\+/g, "%20")
        const params = new URLSearchParams(safeParam)
        const groupID = params.get("group_id") || rawParam

        setGroupId(groupID)
        setSessionLoaded(true)

        await log({ type: "parsed_start_param", group_id: groupID, user_id: uid, user_info: userInfo }, "logs/webapp/init")

        if (groupID && uid) {
          listenUserRole(groupID, uid, setCurrentRole)
        }
      } catch (err) {
        console.error("Init error:", err)
        setGroupId("unknown")
        setSessionLoaded(true)
        await log({ type: "init_error", error: String(err) }, "logs/webapp/init")
      }
    }

    init()
  }, [tg])


  // =========================
  // REASONS LISTENER
  // =========================
  useEffect(() => {
    if (!groupId) return
    const reasonsRef = ref(db, `khmer-autobot/attendance_config/${groupId}/reasons`)
    onValue(reasonsRef, (snapshot) => {
      const data = snapshot.val() || {}
      setReasonOptions({ ...fallbackReasons, ...data })
    })
  }, [groupId])

  useEffect(() => {
    (async () => {
      await initAttendance()
      await detectOffice(nextAction)   // ✅ detect office once at startup
    })()
  }, [])

// =========================
// INIT ATTENDANCE (reusable)
// =========================
async function initAttendance() {
  if (!sessionLoaded || !groupId || groupId === "unknown" || !userId) return

  // 🔹 Fetch today's last action
  const today = await fetchTodayLastAction(groupId, userId)
  if (!today) {
    // ❌ No record yet → default to checkin
    setNextAction("checkin")
    setLastCheckInTime(null)
    await detectOffice("checkin")

    await push(ref(db, `logs/webapp/${groupId}`), {
      type: "attendance_init",
      group_id: groupId,
      user_id: userId,
      lastAction: null,
      lastTimestamp: null,
      nextAction: "checkin",
      missed: false,
      timestamp: new Date().toISOString(),
      confirm: "No record found, defaulted to checkin",
    })
    return
  }

  const { lastAction = null, lastTimestamp = null } = today
  const normalizedAction = (lastAction || "").toLowerCase()

  // 🔹 Decide next action
  let decidedAction: "checkin" | "checkout" = "checkin"
  if (normalizedAction === "checkin") {
    decidedAction = "checkout"
    setLastCheckInTime(lastTimestamp)
  } else if (normalizedAction === "checkout") {
    decidedAction = "checkin"
    setLastCheckInTime(null)
  }

  // ✅ Flip nextAction in store
  setNextAction(decidedAction)

  // ✅ Trigger office detection once with fresh decidedAction
  await detectOffice(decidedAction)

  // 🔹 Check missed checkout from yesterday
  const missed = await checkMissedCheckout(groupId, userId)
  setMissedCheckout(missed)

  // ✅ Log init state with correct decidedAction
  await push(ref(db, `logs/webapp/${groupId}`), {
    type: "attendance_init",
    group_id: groupId,
    user_id: userId,
    lastAction: normalizedAction,
    lastTimestamp,
    nextAction: decidedAction,
    missed,
    timestamp: new Date().toISOString(),
    confirm: `Fetched lastAction=${normalizedAction}, decided nextAction=${decidedAction}`
  })
}


  // Run initAttendance on load
  useEffect(() => {
    initAttendance()
  }, [sessionLoaded, groupId, userId])


  // =========================
  // ATTENDANCE HANDLER
  // =========================
  const handleAttendance = async (extra?: { reason?: string }) => {
    if (!sessionLoaded) return
    if (!navigator.geolocation) return

    setLoading("working")

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const currentAction = nextAction  // ✅ current action at time of submit

        const payload = {
          action: currentAction,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          group_id: groupId,
          user: tg?.initDataUnsafe?.user || null,
          chat: tg?.initDataUnsafe?.chat || null,
          timestamp: new Date().toISOString(),
          bot_username: "autobot",
          photo: photo || null,
          office_id: officeId || "unknown",
          officeName: officeName || "Unknown Office",
          reason: extra?.reason || null,
        }

        console.log("Submitting attendance payload:", payload)

        await log(
          { type: "attendance_payload", actionSent: currentAction, payload: { ...payload, photo: "[PHOTO_PRESENT]" } },
          `logs/webapp/${groupId}`
        )

        try {
          const result = await submitAttendance(payload)
          console.log("Attendance response:", result)

          await log(
            { type: "attendance_response", actionSent: currentAction, result },
            `logs/webapp/${groupId}`
          )

          // ✅ Compute fresh nextAction
          const newAction = currentAction === "checkin" ? "checkout" : "checkin"

          // ✅ Flip locally
          setNextAction(newAction)

          // // ✅ Re-sync with Firebase
          // await initAttendance()


          setLoading("success")
          tg?.HapticFeedback?.notificationOccurred("success")
          setTimeout(() => tg?.close(), 1200)
        } catch (err) {
          setLoading("idle")
          await log({ type: "attendance_error", error: String(err) }, `logs/webapp/${groupId}`)
          alert("❌ Failed attendance: " + String(err))
        }
      },
      (err) => {
        setLoading("idle")
        log({ type: "location_error", error: err.message }, `logs/webapp/${groupId}`)
      }
    )
  }


  // =========================
  // Detect office (GPS fallback)
  // =========================
  const detectOffice = async (
    actionOverride?: "checkin" | "checkout"
  ): Promise<OfficeDetectionResult> => {
    const actionToSend = actionOverride || nextAction
    if (groupId === "unknown" || !actionToSend) {
      return {
        officeDetected: false,
        officeName: "Unknown Office",
        distance: null,
        officeId: "unknown",
        status: "error",
        detail: "Group unknown or action missing",
      }
    }

    return new Promise<OfficeDetectionResult>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const payload = {
              action: "office",
              nextAction: actionToSend,
              group_id: groupId,
              lat: pos.coords.latitude,   // ✅ use real GPS
              lon: pos.coords.longitude,  // ✅ use real GPS
              bot_username: "autobot",
              user: tg?.initDataUnsafe?.user || {},
              timestamp: new Date().toISOString(),
            }

            const res = await fetch("https://fea2-136-228-130-3.ngrok-free.app", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })

            const data = await res.json()

            const result: OfficeDetectionResult = {
              officeDetected:
                !!data.office_id && !!data.officeName && !data.status?.includes("error"),
              officeName: data.officeName || "Unknown Office",
              distance: data.distance ?? null,
              officeId: data.office_id || "unknown",
              status: data.status || "",
              detail: data.detail || "",
            }

            // ✅ Update store
            setOfficeId(result.officeId)
            setOfficeName(result.officeName)
            setStatus(result.status)
            setDetail(result.detail)
            setDistance(result.distance)
            setOfficeDetected(result.officeDetected)

            resolve(result)
          } catch (err) {
            resolve({
              officeDetected: false,
              officeName: "Unknown Office",
              distance: null,
              officeId: "unknown",
              status: "error",
              detail: String(err),
            })
          }
        },
        (err) => {
          resolve({
            officeDetected: false,
            officeName: "Unknown Office",
            distance: null,
            officeId: "unknown",
            status: "GPS denied",
            detail: err.message,
          })
        },
        { timeout: 30000 }
      )
    })
  }


  // =========================
  // Record listener (primary source)
  // =========================
 // Record listener
  useEffect(() => {
    if (!groupId || !userId) return
    const today = new Date().toISOString().slice(0, 10)
    const recordsRef = ref(db, `khmer-autobot/attendance_records/${groupId}/${userId}/${today}`)

    onValue(recordsRef, (snapshot) => {
      const data = snapshot.val() || {}
      const lastRecord = Object.values(data).pop() as any

      if (lastRecord) {
        setStatus(lastRecord.status || "")
        setDetail(lastRecord.detail || "")
        setOfficeId(lastRecord.office_id || "unknown")
        setOfficeName(lastRecord.officeName || "Unknown Office")

        const normalizedAction = (lastRecord.action || "").toLowerCase()
        setNextAction(normalizedAction === "checkin" ? "checkout" : "checkin")

        setPageReady(true) // ✅ mark ready after record restored
      } else {
        // No record yet → run initAttendance
        initAttendance().then(() => setPageReady(true))
      }

      setSessionLoaded(true)
    })
  }, [groupId, userId])


  // =========================
  // ROLE LISTENER
  // =========================
  function listenUserRole(
    groupId: string,
    userId: string,
    setRole: (role: string) => void
  ) {
    const roleRef = ref(
      db,
      `khmer-autobot/attendance_config/${groupId}/attendance_roles/${userId}`
    )

    onValue(roleRef, async (snapshot) => {
      const data = snapshot.val()
      const role = data?.role || data || "member"
      setRole(role)

      // Log role fetch event
      await log(
        {
          type: "role_fetch",
          groupId,
          userId,
          role,
          raw: data,
          confirm: `Fetched role=${role} for user=${userId}`,
        },
        `webapp/${groupId}` // consistent with your attendance logs
      )
    })
  }


  // =========================
  // SAFE LOGGER
  // =========================
  const log = async (entry: any, customPath?: string) => {
    try {
      const safeEntry = { ...entry }

      // 🚫 Remove heavy photo data before saving
      if (safeEntry.payload?.photo) {
        safeEntry.payload.photo = "[PHOTO_PRESENT]" // marker only
      }

      // ✅ Use customPath if provided, otherwise fallback to groupId
      const path = customPath || `logs/webapp/${entry.groupId || "unknown"}`
      await push(ref(db, path), {
        ...safeEntry,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.error("Firebase log error:", err)
    }
  }


  // =========================
  // Fetch today's last action
  // =========================
  async function fetchTodayLastAction(groupId: string, userId: string) {

    function getLocalDateKey() {
      const now = new Date()
      // Convert to local date string (Cambodia UTC+7)
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      return local.toISOString().slice(0, 10)
    }


    const todayKey = getLocalDateKey()
    const db = getDatabase()
    const userRef = ref(db, `khmer-autobot/attendance_records/${groupId}/${userId}/${todayKey}`)

    let snapshot
    try {
      snapshot = await get(userRef)
    } catch (err) {
      await push(ref(db, `logs/webapp/${groupId}`), {
        type: "attendance_fetch_error",
        path: `khmer-autobot/attendance_records/${groupId}/${userId}/${todayKey}`,
        error: String(err),
        timestamp: new Date().toISOString(),
      })
      return null
    }

    const rawData = snapshot.val()
    await push(ref(db, `logs/webapp/${groupId}`), {
      type: "attendance_fetch_today",
      path: `khmer-autobot/attendance_records/${groupId}/${userId}/${todayKey}`,
      exists: snapshot.exists(),
      raw: rawData,
      timestamp: new Date().toISOString(),
      confirm: snapshot.exists()
        ? `Found ${Object.keys(rawData || {}).length} records`
        : "No records found"
    })

    if (!snapshot.exists()) return null

    const sessions = Object.values(rawData || {})
    if (sessions.length === 0) return null

    sessions.sort(
      (a: any, b: any) =>
        new Date(a?.timestamp || 0).getTime() - new Date(b?.timestamp || 0).getTime()
    )

    const lastSession: any = sessions[sessions.length - 1] || {}
    const normalizedAction = (lastSession?.action || "").toString().toLowerCase()

    // ✅ Log confirmation of last session
    await push(ref(db, `logs/webapp/${groupId}`), {
      type: "attendance_last_session",
      lastAction: normalizedAction,
      lastTimestamp: lastSession?.timestamp || null,
      timestamp: new Date().toISOString(),
      confirm: `Last session action=${normalizedAction}, timestamp=${lastSession?.timestamp}`
    })

    return {
      lastAction: normalizedAction,
      lastTimestamp: lastSession?.timestamp || null,
    }
  }


  // Check missed checkout from yesterday
  async function checkMissedCheckout(groupId: string, userId: string) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().slice(0, 10)

    const db = getDatabase()
    const userRef = ref(db, `khmer-autobot/attendance_records/${groupId}/${userId}/${yesterdayKey}`)
    const snapshot = await get(userRef)

    if (!snapshot.exists()) return false

    const sessions = Object.values(snapshot.val() || {})
    if (sessions.length === 0) return false

    sessions.sort(
      (a: any, b: any) =>
        new Date(a?.timestamp || 0).getTime() - new Date(b?.timestamp || 0).getTime()
    )

    const lastSession: any = sessions[sessions.length - 1] || {}
    return (lastSession?.action || "").toString().toLowerCase() === "checkin"
  }


  // =========================
  // SUBMIT FUNCTION
  // =========================
  const submitAttendance = async (payload: any) => {
    const webhookUrl = "https://fea2-136-228-130-3.ngrok-free.app";

    let res: Response;
    let result: any;

    try {
      res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error("Network error: cannot reach server.");
    }

    try {
      result = await res.json();
    } catch (parseErr) {
      const text = await res.text();
      console.error("Failed to parse JSON, raw response:", text);
      result = null;
    }

    if (!res.ok) throw new Error(result?.error || `HTTP Error ${res.status}`);
    if (result && result.ok === false) throw new Error(result.error || "Backend rejected request");

    return result;
  };



  function BottomSheetMenu({
    currentRole,
    onClose,
    groupId,
    settings,
    updateSetting,
    openProfile,   // ✅ added
    openHelp       // ✅ added
  }: {
    currentRole: string
    onClose: () => void
    groupId: string
    settings: {
      theme: "dark" | "light"
      language: "en" | "kh"
      office_id?: string
      notifications?: {
        attendance_reminders?: boolean
        late_alerts?: boolean
        summary_reports?: boolean
      }
    }
    updateSetting: (key: keyof typeof settings, value: any) => void
    openProfile: () => void   // ✅ added
    openHelp: () => void      // ✅ added
  }) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
        <div className="w-full max-w-md bg-gray-900 rounded-t-2xl p-5 space-y-3 animate-slide-up shadow-lg">
          {/* Header row */}
          <div className="flex justify-between items-center border-b border-gray-700 pb-3">
            <h3 className="text-teal-400 font-semibold text-lg">More Options</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition text-xl"
            >
              ✖
            </button>
          </div>

          {/* Theme toggle */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-lg">
            <span className="text-teal-300">Theme</span>
            <button
              onClick={() =>
                updateSetting("theme", settings.theme === "dark" ? "light" : "dark")
              }
              className="px-3 py-1 rounded bg-teal-500 text-black hover:bg-teal-400"
            >
              {settings.theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>

          {/* Menu items */}
          <div className="flex flex-col space-y-2">
            <Link
              to="/attendance/viewhistory"
              search={{ group_id: groupId }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-teal-300 transition"
            >
              <span>📜</span><span>View History</span>
            </Link>

            <button
              onClick={openProfile}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-teal-300 transition"
            >
              <span>👤</span><span>Profile</span>
            </button>

            <Link
              to="/attendance/settings"
              search={{ group_id: groupId }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-teal-300 transition"
            >
              <span>⚙️</span><span>Settings</span>
            </Link>

            {/* Admin-only links */}
            {currentRole === "admin" && (
              <>
                <Link to="/attendance/register" search={{ group_id: groupId }} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-teal-300 transition">
                  <span>📝</span><span>Register / Lease License</span>
                </Link>
                <Link to="/attendance/admin/roles" search={{ group_id: groupId }} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-teal-300 transition">
                  <span>👑</span><span>Manage Roles</span>
                </Link>
                <Link to="/attendance/admin/config" search={{ group_id: groupId }} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-teal-300 transition">
                  <span>🏢</span><span>Attendance Config</span>
                </Link>
                <Link to="/attendance/report" search={{ group_id: groupId }} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-teal-300 transition">
                  <span>📊</span><span>Attendance Report</span>
                </Link>
              </>
            )}

            <button
              onClick={openHelp}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-teal-300 transition"
            >
              <span>❓</span><span>Help</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================
  // UI
  // ============================
  // Render guard
  if (!pageReady) {
    return <div className="flex items-center justify-center h-full">Loading attendance…</div>
  }
  return (
    <div
      className={`flex flex-col min-h-screen font-sans transition-colors duration-500 ${settings.theme === "dark"
        ? "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white"
        : "bg-gradient-to-b from-white via-gray-100 to-gray-200 text-gray-900"
        }`}
    >

      <header className="sticky top-0 w-full px-8 py-9 text-center backdrop-blur-md shadow-lg z-50 flex flex-col items-center">
        <h1 className="text-2xl font-bold tracking-wide flex items-center gap-2">
          🕒 Attendance
        </h1>

        {/* Info messages */}
        {sessionLoaded && (
          <>
            {!officeDetected ? (
              <p className="text-gray-400 text-sm mt-1 animate-pulse flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-teal-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                ⏳ Detecting office via GPS…
              </p>
            ) : officeName ? (
              <p className="text-green-400 text-sm mt-1 font-medium flex items-center gap-2">
                ✅  {officeName}
              </p>
            ) : (
              <p className="text-red-400 text-sm mt-1">
                ❌ Office not detected
              </p>
            )}
          </>
        )}
        {/* Status badge */}
        {sessionLoaded && officeDetected && status && (
          <div
            className={`mt-2 px-3 py-2 rounded-lg inline-block font-medium ${status.includes("✅")
              ? "bg-green-600 text-white"
              : status.includes("⚠️ យឺត")
                ? "bg-yellow-500 text-black"
                : status.includes("⚠️ ចេញមុន")
                  ? "bg-red-500 text-white"
                  : status.includes("⏱")
                    ? "bg-purple-500 text-white"
                    : "bg-gray-600 text-white"
              }`}
          >
            {status} {detail}
            {/* {distance !== null && (
              <span className="ml-2 text-xs text-gray-200">({distance}m away)</span>
            )} */}
          </div>
        )}

      </header>


      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-8">
        {!officeDetected ? (
          // 🔹 Show spinner overlay only until GPS detection succeeds
          <div className="flex flex-col items-center justify-center space-y-2">
            <svg
              className="animate-spin h-8 w-8 text-teal-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span className="text-sm text-gray-500">Detecting office via GPS…</span>
          </div>
        ) : (
          <>
            {/* Camera capture card */}
            <div
              className={`w-full max-w-md rounded-2xl shadow-xl p-6 border space-y-6 ${settings.theme === "dark"
                ? "bg-gray-900 border-teal-600"
                : "bg-white border-teal-400"
                }`}
            >
              {status.includes("Outside Office") ? (
                <div className="text-red-400 text-center text-sm">
                  ❌ You are {distance}m away from the office. Camera disabled.
                </div>
              ) : (
                // ✅ Wrap CameraModal in Suspense  ...
                <Suspense fallback={<div className="text-gray-400">Loading camera…</div>}>
                  <CameraModal
                    onCapture={(photoData) => setPhoto(photoData)}
                    disabled={false}
                  />
                </Suspense>
              )}

            </div>

            {/* Action area */}
            <div className="w-full max-w-md space-y-4">
              {loading === "success" ? (
                <div className="w-full text-center bg-green-900/40 border border-green-500 rounded-xl p-6 animate-fade-in">
                  <div className="text-green-400 text-5xl animate-bounce mb-3">✅</div>
                  <p className="text-green-400 text-lg font-semibold">
                    {nextAction === "checkin" ? "Check-In" : "Check-Out"} recorded for{" "}
                    {officeName || "Unknown Office"}
                  </p>
                  {nextAction === "checkout" && lastCheckInTime && (
                    <p className="text-gray-300 text-sm mt-1">
                      Last Check-In:{" "}
                      {new Date(lastCheckInTime).toLocaleTimeString()}
                    </p>
                  )}
                  <p className="text-gray-300 text-sm mt-1">
                    Thank you! Your attendance has been saved.
                  </p>
                </div>
              ) : (
                <>
                  {/* Confirm button */}
                  <button
                    onClick={() => {
                      if (!sessionLoaded || !status) return
                      if (status.includes("Outside Office")) {
                        alert(`❌ You are ${distance}m away from the office.`)
                        return
                      }
                      handleAttendance()
                    }}
                    disabled={
                      !officeDetected || // ✅ block until GPS detection succeeds
                      loading !== "idle" ||
                      !sessionLoaded ||
                      !status ||
                      status.includes("Outside Office")
                    }
                    className={`w-full py-3 rounded-xl shadow-lg font-semibold transition ${nextAction === "checkin"
                      ? settings.theme === "dark"
                        ? "bg-green-500 text-black hover:bg-green-400"
                        : "bg-green-600 text-white hover:bg-green-500"
                      : settings.theme === "dark"
                        ? "bg-red-500 text-white hover:bg-red-400"
                        : "bg-red-600 text-white hover:bg-red-500"
                      } ${!officeDetected || !status || status.includes("Outside Office")
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                      }`}
                  >
                    {loading === "working"
                      ? "Processing..."
                      : !status
                        ? "⏳ Detecting Office..."
                        : nextAction === "checkin"
                          ? "✅ Confirm Check-In"
                          : "✅ Confirm Check-Out"}
                  </button>

                  {/* Reason dropdown */}
                  {(status.includes("⚠️ យឺត") || status.includes("⚠️ ចេញមុន")) && (
                    <div className="w-full max-w-sm text-center mt-4">
                      <label className="block text-yellow-400 mb-2 text-sm font-semibold">
                        សូមជ្រើសរើសមូលហេតុដែលអ្នកយឺត/ចេញមុន
                      </label>
                      <select
                        onChange={(e) => {
                          const reason = e.target.value
                          if (reason === "✏️ Other") {
                            const custom = prompt("បញ្ចូលមូលហេតុផ្ទាល់ខ្លួន:")
                            handleAttendance({ reason: custom || "Other" })
                          } else if (reason) {
                            handleAttendance({ reason })
                          }
                        }}
                        defaultValue=""
                        className={`p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 text-center appearance-none ${settings.theme === "dark"
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-900"
                          }`}
                      >
                        <option value="" disabled>
                          -- Select Reason --
                        </option>
                        {Object.entries(reasonOptions).map(([key, label]) => (
                          <option key={key} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Info messages */}
                  {status === "" && loading === "working" && (
                    <p className="text-sm text-gray-400 mt-2 animate-pulse">
                      ⏳ Detecting office via GPS…
                    </p>
                  )}

                  {distance !== null && (
                    <p className="text-sm text-gray-400 mt-2">
                      📍 You are {distance} meters from {officeName || "office"}.
                    </p>
                  )}

                  {nextAction === "checkout" && lastCheckInTime && (
                    <p className="text-sm text-gray-400 mt-1">
                      Last Check-In: {new Date(lastCheckInTime).toLocaleTimeString()}
                    </p>
                  )}

                  {missedCheckout && (
                    <p className="text-red-400 text-sm mt-2">
                      ⚠️ You missed Check-Out yesterday. Attendance cancelled.
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>



      {/* Footer pinned at bottom */}
      {officeDetected && <AttendanceFooter />}

      {/* Symbol buttons row pinned above footer */}
      {officeDetected && (
        <div className="fixed bottom-20 left-0 w-full flex justify-center text-3xl text-teal-500 z-40">
          <button
            onClick={() => setShowMore(true)}
            className="hover:text-teal-300 transition"
          >
            ⋯
          </button>
        </div>
      )}

      {/* Bottom sheet modal */}
      {officeDetected && showMore && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-gray-900 rounded-t-2xl p-5 space-y-3 animate-slide-up shadow-lg">
            {/* Header + menu items */}
          </div>
        </div>
      )}

      {/* Floating KhmerAttend logo badge */}
      <div className="fixed bottom-6 right-6 z-50">
        <img
          src="/assets/KhmerAttend_64px.png"
          alt="KhmerAttend Logo"
          className="w-13 h-13 rounded-full border border-teal-500 animate-pulseGlow"
        />
      </div>

      {/* Floating menu */}
      {officeDetected && showMore && (
        <BottomSheetMenu
          currentRole={currentRole}
          onClose={() => setShowMore(false)}
          groupId={groupId}
          settings={settings}
          updateSetting={updateSetting}
          openProfile={() => alert("Profile clicked")}
          openHelp={() => alert("Help clicked")}
        />
      )}

    </div>
  );

}

