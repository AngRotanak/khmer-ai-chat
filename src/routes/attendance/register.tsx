import { useState, useEffect, useRef } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { AdminLayout } from "./components/AdminLayout"

export const Route = createFileRoute("/attendance/register")({
  component: RegisterPage,
})

function RegisterPage() {
  const [selectedPackage, setSelectedPackage] = useState("basic")
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [md5, setMd5] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const [minutesLeft, setMinutesLeft] = useState(10)
  const [countdown, setCountdown] = useState(60)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [licenseInfo, setLicenseInfo] = useState<{
    package: string
    expires: string
    license_id: string
    download_url: string
  } | null>(null)

  const groupId = "-1002174749045"
  const payButtonRef = useRef<HTMLButtonElement | null>(null)

  const plans = [
    {
      id: "basic",
      name: "Basic Plan",
      price: "10,000 KHR",
      features: ["✔ Core features", "✔ 1 user license", "✔ Email support"],
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "30,000 KHR",
      features: ["✔ All Basic features", "✔ 5 user licenses", "✔ Priority support", "✔ Advanced analytics"],
      recommended: true,
    },
    {
      id: "enterprise",
      name: "Enterprise Plan",
      price: "100,000 KHR",
      features: ["✔ Unlimited users", "✔ Dedicated account manager", "✔ Custom integrations", "✔ SLA guarantee"],
    },
  ]

  const handleGenerateQR = async () => {
    setLoading(true)
    setTimeoutReached(false)
    setPaymentComplete(false)
    setQrImage(null)
    setAmount(null)
    setMd5(null)
    setMinutesLeft(10)
    setCountdown(60)

    try {
      const res = await fetch("https://b0df-136-228-130-3.ngrok-free.app/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          group_id: groupId,
          user: { id: "12345", name: "Demo User" },
          bot_username: "autobot",
          package: selectedPackage,
          timestamp: new Date().toISOString(),
        }),
      })
      const data = await res.json()

      setQrImage(`data:image/jpeg;base64,${data.qr_image}`)
      setAmount(data.amount)
      setMd5(data.md5)
    } catch (err) {
      console.error("Error generating QR:", err)
    } finally {
      setLoading(false)
    }
  }

  // Poll backend every minute
  useEffect(() => {
    if (!md5 || paymentComplete || timeoutReached) return

    let minutesPassed = 0
    const interval = setInterval(async () => {
      minutesPassed += 1
      setMinutesLeft(10 - minutesPassed)
      setCountdown(60)

      if (minutesPassed >= 10) {
        setTimeoutReached(true)
        clearInterval(interval)
        return
      }

      try {
        const res = await fetch("https://b0df-136-228-130-3.ngrok-free.app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "check_payment", md5, selected_package: selectedPackage }),
        })
        const data = await res.json()
        if (data.status === "PAID") {
          setPaymentComplete(true)
          setLicenseInfo(data.license)
          clearInterval(interval)
        }
      } catch (err) {
        console.error("Error checking payment:", err)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [md5, paymentComplete, timeoutReached])

  // Countdown display
  useEffect(() => {
    if (!md5 || paymentComplete || timeoutReached) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [md5, paymentComplete, timeoutReached])

  return (
    <AdminLayout title="📝 Register / Lease License">
      <div className="flex-1 px-4 py-6 max-w-md mx-auto space-y-6 pb-32">

        <h2 className="text-teal-400 text-lg font-bold text-center">
          Quick Registration
        </h2>

        {/* Plan selection cards */}
        <div className="space-y-4">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`block rounded-lg border-2 p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-teal-400 ${selectedPackage === plan.id
                ? "border-teal-600 bg-teal-50 shadow-md scale-[1.02]"
                : "border-gray-300 bg-white"
                }`}
              onClick={() => {
                setSelectedPackage(plan.id)
                setTimeout(() => {
                  payButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                }, 150)
              }}
            >
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={selectedPackage === plan.id}
                onChange={(e) => setSelectedPackage(e.target.value)}
                className="hidden"
              />
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-teal-600 flex items-center gap-2">
                  {plan.name}
                  {selectedPackage === plan.id && (
                    <span className="text-green-600 text-lg">✅</span>
                  )}
                </h3>
                <span className="text-sm font-semibold text-gray-700">{plan.price}</span>
              </div>
              {plan.recommended && (
                <span className="inline-block mt-1 text-xs font-bold text-white bg-teal-600 px-2 py-1 rounded">
                  Recommended
                </span>
              )}
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                {plan.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </label>
          ))}
        </div>

        {/* Selected plan summary */}
        <div className="text-center mt-4 transition-opacity duration-500 ease-in-out">
          {plans.find((p) => p.id === selectedPackage) && (
            <p key={selectedPackage} className="text-sm font-semibold text-gray-700 animate-fade">
              You will pay {plans.find((p) => p.id === selectedPackage)?.price} for{" "}
              {plans.find((p) => p.id === selectedPackage)?.name}
            </p>
          )}
        </div>

        {/* Show QR */}
        {qrImage && !paymentComplete && !timeoutReached && (
          <div className="rounded-xl shadow-lg p-4 w-full flex flex-col items-center">
            <div className="relative inline-block">
              <div className="flex justify-center w-full">
                <img
                  src={qrImage}
                  alt="Bakong QR"
                  className="rounded-lg border border-gray-200 shadow-md"
                />
              </div>

              {/* Top overlay */}
              <div className="absolute top-2 left-0 right-0 text-center">
                <h3 className="text-black font-bold text-sm">Scan to Pay</h3>
                {timeoutReached ? (
                  <p className="text-red-600 font-semibold text-base">❌ Payment Timeout</p>
                ) : (
                  <>
                    <p className="text-red-500 font-semibold text-base">
                      Payment window: {minutesLeft} min left
                    </p>
                    <p className="text-red-500 text-sm">
                      Next check in {countdown}s
                    </p>
                  </>
                )}
              </div>

              {/* Bottom overlay */}
              <div className="absolute bottom-5 left-0 right-0 text-center">
                <p className="text-black font-semibold text-base">KHMER AUTOSOFT</p>
                <p className="text-black text-sm">Plan: {selectedPackage}</p>
                {amount && <p className="text-black text-sm">Amount: {amount} KHR</p>}
              </div>
            </div>

            {/* Footer below QR */}
            <div className="mt-4 text-xs text-gray-400">
              <p>Secure KHQR Payment • Licensed by Bakong</p>
            </div>

            {/* Retry button if timeout */}
            {timeoutReached && (
              <button
                onClick={handleGenerateQR}
                className="mt-4 w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition"
              >
                Retry Payment
              </button>
            )}
          </div>
        )}

        {/* Thank-you screen */}
        {paymentComplete && licenseInfo && (
          <div className="bg-green-50 rounded-xl shadow-lg p-8 w-full flex flex-col items-center text-center">
            <h3 className="text-green-600 font-bold text-lg mb-2">✅ Payment Complete</h3>
            <p className="text-black font-semibold text-base">Thank you for your payment!</p>
            <p className="text-black text-sm mt-2">Your license has been activated.</p>
            <p className="text-black text-sm">Plan: {licenseInfo.package}</p>
            <p className="text-black text-sm">License ID: {licenseInfo.license_id}</p>
            <p className="text-black text-sm">Expires: {licenseInfo.expires}</p>

            {/* Download button */}
            <a
              href={licenseInfo.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition"
            >
              Download License PDF
            </a>

            {/* Copy License ID button */}
            <button
              onClick={() => navigator.clipboard.writeText(licenseInfo.license_id)}
              className="mt-2 w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition"
            >
              Copy License ID
            </button>

            <div className="mt-4 text-xs text-gray-500">
              <p>KHMER AUTOSOFT • Licensed</p>
            </div>
          </div>
        )}
      </div>

{/* Sticky footer bar */}
<div className="fixed bottom-15 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white border border-gray-200 px-4 py-4 rounded-xl shadow-footer z-50 animate-slideup
                md:static md:w-full md:translate-x-0 md:rounded-none md:shadow-none">
  <div className="flex items-center justify-between gap-3">
    {/* Total amount badge */}
    {plans.find((p) => p.id === selectedPackage) && (
      <span className="inline-block px-3 py-2 rounded-lg bg-teal-100 text-teal-700 font-semibold text-sm">
        {plans.find((p) => p.id === selectedPackage)?.price}
      </span>
    )}

    {/* Pay button */}
    <button
      ref={payButtonRef}
      onClick={handleGenerateQR}
      disabled={loading}
      className="flex-1 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition disabled:opacity-50"
    >
      {loading ? "Preparing Payment QR..." : "Pay with KHQR"}
    </button>
  </div>

  {/* Reassurance line */}
  <p className="mt-2 text-xs text-gray-400 text-center">
    You’ll be redirected to KHQR secure payment
  </p>
</div>



    </AdminLayout>
  )
}
