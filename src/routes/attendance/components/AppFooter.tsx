import { Link } from "@tanstack/react-router"

export function AppFooter() {
  return (
    <footer className="fixed bottom-0 left-0 w-full border-t border-gray-700 bg-gray-900 py-3 text-center text-sm">

      <Link
        to="/attendance"
        className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-200 transition font-semibold"
      >
        <svg xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24"
          strokeWidth={2} stroke="currentColor"
          className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Attendance
      </Link>
      <div className="text-gray-400 mb-1">
        KhmerAttend © 2026 — Powered by KhmerAutosoft
      </div>
    </footer>
  )
}
