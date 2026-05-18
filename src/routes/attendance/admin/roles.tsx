import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { ref, set, onValue, push, remove } from "firebase/database"
import { db } from "~/lib/firebase"   // ✅ use shared db instance
import { AdminLayout } from "../components/AdminLayout"

export const Route = createFileRoute("/attendance/admin/roles")({
  component: RolesPage,
})

type RoleInfo = {
  role: string
  assignedBy: string
  assignedAt: string
  fullName?: string
  username?: string
}

function RolesPage() {
  const [roles, setRoles] = useState<Record<string, RoleInfo>>({})
  const [newUserId, setNewUserId] = useState("")
  const [newRole, setNewRole] = useState("member")
  const [newName, setNewName] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null)


const params = new URLSearchParams(location.search)
let groupId = params.get("group_id") || ""

if (!groupId || groupId === "unknown") {
  const tg = (window as any).Telegram?.WebApp
  const rawParam = tg?.initDataUnsafe?.start_param
  if (rawParam) {
    groupId = rawParam
  }

  // =========================
  // SAFE LOGGER
  // =========================
  const log = async (entry: any, customPath?: string) => {
    try {
      const safeEntry = { ...entry }
      if (safeEntry.payload?.photo) {
        safeEntry.payload.photo = "[PHOTO_PRESENT]"
      }
      const path = customPath || `logs/webapp/${entry.groupId || "unknown"}`
      await push(ref(db, path), {
        ...safeEntry,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.error("Firebase log error:", err)
    }
  }

  // ✅ Load roles from Firebase with logging
  useEffect(() => {
    const rolesPath = `khmer-autobot/attendance_config/${groupId}/attendance_roles`
    const rolesRef = ref(db, rolesPath)

    onValue(rolesRef, async (snapshot) => {
      const data = snapshot.val() || {}
      console.log("Listening at:", rolesPath, "Snapshot:", data)

      try {
        await push(ref(db, `logs/webapp/${groupId}`), {
          type: "roles_snapshot",
          groupId,
          path: rolesPath,
          exists: snapshot.exists(),
          keys: Object.keys(data),
          raw: data,
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        console.error("Firebase log error:", err)
      }

      setRoles(data)
    })
  }, [groupId])

  const setUserRole = async (
    userId: string,
    role: string,
    assignedBy: string,
    fullName?: string,
    username?: string
  ) => {
    const roleRef = ref(db, `khmer-autobot/attendance_config/${groupId}/attendance_roles/${userId}`)
    await set(roleRef, {
      role,
      assignedBy,
      assignedAt: new Date().toISOString(),
      fullName,
      username,
    })
    await log({
      type: "role_update",
      groupId,
      user_id: userId,
      newRole: role,
      assignedBy,
      fullName,
      username,
      confirm: `Set role=${role} for user=${userId}`,
      path: `khmer-autobot/attendance_config/${groupId}/attendance_roles/${userId}`,
    })
  }

  const promote = (userId: string) =>
    setUserRole(userId, "admin", "system", roles[userId]?.fullName, roles[userId]?.username)
  const demote = (userId: string) =>
    setUserRole(userId, "member", "system", roles[userId]?.fullName, roles[userId]?.username)

  const removeUser = async (userId: string) => {
    const roleRef = ref(db, `khmer-autobot/attendance_config/${groupId}/attendance_roles/${userId}`)
    await remove(roleRef)
    await log({
      type: "role_remove",
      groupId,
      user_id: userId,
      confirm: `Removed user=${userId}`,
      path: `khmer-autobot/attendance_config/${groupId}/attendance_roles/${userId}`,
    })
    setConfirmUserId(null) // close modal
  }

  const addUser = () => {
    if (!newUserId) return
    setUserRole(newUserId, newRole, "system", newName, newUsername)
    setNewUserId("")
    setNewRole("member")
    setNewName("")
    setNewUsername("")
  }

  return (
    <AdminLayout title="👑 Manage Roles">
      {/* ✅ Add User Form */}
      <div className="bg-gray-800 p-4 rounded-lg flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Telegram ID (e.g. 736090330)"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          className="px-3 py-2 rounded bg-gray-700 text-white"
        />
        <input
          type="text"
          placeholder="Full Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="px-3 py-2 rounded bg-gray-700 text-white"
        />
        <input
          type="text"
          placeholder="Username (optional)"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="px-3 py-2 rounded bg-gray-700 text-white"
        />
        <div className="flex space-x-2">
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="px-3 py-2 rounded bg-gray-700 text-white"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={addUser}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-500"
          >
            Add User
          </button>
        </div>
      </div>

      {/* ✅ Existing Roles List */}
      {Object.entries(roles).map(([userId, info]) => (
        <div
          key={userId}
          className="flex flex-col bg-gray-800 rounded-lg overflow-hidden"
        >
          {/* User Info */}
          <div className="p-4 bg-gray-800 rounded-t-lg space-y-1">
            <p className="text-teal-300 font-semibold">ID: {userId}</p>
            <p className="text-gray-300">Role: {info.role}</p>
            {info.fullName && <p className="text-gray-300">Name: {info.fullName}</p>}
            {info.username && <p className="text-gray-300">Username: @{info.username}</p>}
          </div>



          {/* Action Buttons */}
          <div className="flex justify-around bg-gray-700 p-3">
            <button
              onClick={() => promote(userId)}
              className="flex-1 mx-1 px-3 py-2 bg-green-500 text-black rounded hover:bg-green-400"
            >
              Promote
            </button>
            <button
              onClick={() => demote(userId)}
              className="flex-1 mx-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-400"
            >
              Demote
            </button>
            <button
              onClick={() => setConfirmUserId(userId)}
              className="flex-1 mx-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-400"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* ✅ Confirmation Modal */}
      {confirmUserId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
            <p className="text-lg">
              Are you sure you want to remove user{" "}
              <span className="text-teal-300">{confirmUserId}</span>?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => removeUser(confirmUserId)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => setConfirmUserId(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}