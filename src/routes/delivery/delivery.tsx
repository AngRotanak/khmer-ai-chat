import { createFileRoute } from '@tanstack/react-router'
import CameraModal from './components/CameraModal'
import DriverInfoDrawer from './components/DriverInfoDrawer'
import DeliveryFooter from './components/DeliveryFooter'

export const Route = createFileRoute('/delivery')({
  component: DeliveryPage,
})

function DeliveryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="p-4 text-center font-semibold text-xl">
        Delivery Tracking
      </header>

      {/* Main content */}
      <main className="flex-1 relative">
        {/* ✅ Embed TrackPage via DeliveryMap */}
        {/* <DeliveryMap /> */}

        {/* Floating action buttons */}
        <div className="fixed bottom-20 right-6 flex flex-col space-y-3">
          <button className="bg-teal-500 text-white rounded-full p-3 shadow-lg">
            📷 Live Camera
          </button>
          <button className="bg-teal-500 text-white rounded-full p-3 shadow-lg">
            💬 Chat
          </button>
          <button className="bg-teal-500 text-white rounded-full p-3 shadow-lg">
            📞 Call
          </button>
        </div>
      </main>

      {/* Footer + Drawer components */}
      <DeliveryFooter />
      <CameraModal />
      <DriverInfoDrawer />
    </div>
  )
}

export default DeliveryPage
