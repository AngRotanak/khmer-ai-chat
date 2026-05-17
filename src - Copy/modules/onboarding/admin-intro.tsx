import { useAdminOnboarding } from '~/hooks/use-admin-onboarding'

export function AdminIntro() {
  const { showIntro, markComplete } = useAdminOnboarding()

  if (!showIntro) return null

  return (
    <div className="p-6 space-y-4 bg-dark-900 border border-dark-700 rounded text-light-100">
      <h2 className="text-lg font-semibold">ស្វាគមន៍! 👋</h2>
      <p className="text-sm">
        អ្នកអាចបន្ថែមពាក្យបញ្ចេញសារ និងមតិ ដើម្បីបើកប្លុកជាសារ។ ប្លុកអាចមានជំហានច្រើន
        ដូចជា សារ, រូបភាព, ឬប៊ូតុង។ អ្នកអាចកំណត់ fallback ប្លុកសម្រាប់ Messenger
        និងបើកការមើលជាមុន។
      </p>
      <button
        onClick={markComplete}
        className="px-4 py-2 rounded bg-teal-500 text-white text-sm hover:bg-teal-600"
      >
        ខ្ញុំយល់ហើយ
      </button>
    </div>
  )
}
