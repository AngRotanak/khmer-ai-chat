// src/store/attendanceStore.ts
import { create } from "zustand"

interface AttendanceState {
  // GPS detection
  officeDetected: boolean
  officeName: string
  distance: number | null
  officeId: string

  // Attendance status
  nextAction: "checkin" | "checkout"
  lastCheckInTime: string | null
  missedCheckout: boolean
  status: string
  detail: string
  photo: string | null

  // Actions
  setOfficeDetected: (val: boolean) => void
  setOfficeName: (name: string) => void
  setDistance: (d: number | null) => void
  setOfficeId: (id: string) => void

  setNextAction: (action: "checkin" | "checkout") => void
  setLastCheckInTime: (time: string | null) => void
  setMissedCheckout: (val: boolean) => void
  setStatus: (s: string) => void
  setDetail: (d: string) => void
  setPhoto: (p: string | null) => void
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  // Initial values
  officeDetected: false,
  officeName: "",
  distance: null,
  officeId: "unknown",

  nextAction: "checkin",
  lastCheckInTime: null,
  missedCheckout: false,
  status: "",
  detail: "",
  photo: null,

  // Mutators
  setOfficeDetected: (val) => set({ officeDetected: val }),
  setOfficeName: (name) => set({ officeName: name }),
  setDistance: (d) => set({ distance: d }),
  setOfficeId: (id) => set({ officeId: id }),

  setNextAction: (action) => set({ nextAction: action }),
  setLastCheckInTime: (time) => set({ lastCheckInTime: time }),
  setMissedCheckout: (val) => set({ missedCheckout: val }),
  setStatus: (s) => set({ status: s }),
  setDetail: (d) => set({ detail: d }),
  setPhoto: (p) => set({ photo: p }),
}))
