import type { ReactNode } from 'react'


export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[500px] max-w-full bg-dark-400 rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-white hover:text-red-400">✕</button>
        </div>
        <div className="text-sm text-light-900">{children}</div>
      </div>
    </div>
  )
}
