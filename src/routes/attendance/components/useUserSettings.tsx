import { db } from "~/lib/firebase"
import { ref, get, set } from "firebase/database"
import { useEffect, useState } from 'react'

type UserSettings = {
  theme: "dark" | "light"
  language: "en" | "kh"
  office_id?: string
  notifications?: {
    attendance_reminders?: boolean
    late_alerts?: boolean
    summary_reports?: boolean
  }
}

export default function useUserSettings(userId: string) {
  const [settings, setSettings] = useState<UserSettings>({
    theme: "dark",
    language: "en",
  })

  useEffect(() => {
    const fetchSettings = async () => {
      const snapshot = await get(ref(db, `user_settings/${userId}`))
      if (snapshot.exists()) {
        setSettings(snapshot.val())
      }
    }
    fetchSettings()
  }, [userId])

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    await set(ref(db, `user_settings/${userId}`), newSettings)
  }

  return { settings, updateSetting }
}
