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

  // Unified countdown + polling
useEffect(() => {
  if (!md5 || paymentComplete || timeoutReached) return

  let minutesPassed = 0

  const interval = setInterval(async () => {
    setCountdown(prev => {
      if (prev > 1) {
        return prev - 1
      } else {
        // reset countdown to 60 and decrement minutes
        minutesPassed += 1
        setMinutesLeft(10 - minutesPassed)

        if (minutesPassed >= 10) {
          setTimeoutReached(true)
          clearInterval(interval)
          return 0
        }

        // 🔹 Poll backend once per minute
        ;(async () => {
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
        })()

        return 60
      }
    })
  }, 1000)

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

        {/* ✅ Animated QR bottom sheet */}
        <div
          className={`fixed bottom-0 left-0 right-0 transition-all duration-500 ease-in-out 
            ${qrImage && !paymentComplete && !timeoutReached
              ? "max-h-[500px] opacity-100 translate-y-0"
              : "max-h-0 opacity-0 translate-y-4"} 
            bg-dark-800 border-t border-gray-700 p-4`}
        >
          {qrImage && !paymentComplete && !timeoutReached && (
            <div className="max-w-md mx-auto rounded-xl shadow-lg p-6 flex flex-col items-center relative">
              {/* Close button */}
              <button
                onClick={() => setQrImage(null)}
                className="absolute top-2 right-2 text-light-400 hover:text-red-400"
              >
                ✕
              </button>

              {/* QR image with overlay */}
              <div className="relative">
                <img
                  src={qrImage}
                  alt="Bakong QR"
                  className="rounded-lg border border-gray-200 shadow-md"
                />
                {/* Countdown badge overlay */}
                {!timeoutReached && !paymentComplete && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-red-400 px-3 py-1 rounded-lg text-sm font-semibold">
                    {minutesLeft}m : {countdown}s
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {!timeoutReached && !paymentComplete && (
                <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
                      countdown > 40 ? "bg-green-500" : countdown > 20 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${(countdown / 60) * 100}%` }}
                  />
                </div>
              )}

              {/* Payment info */}
              <div className="mt-3 text-center">
                <h3 className="text-teal-400 font-bold">Scan to Pay</h3>
                {timeoutReached ? (
                  <p className="text-red-600 font-semibold text-base">❌ Payment Timeout</p>
                ) : (
                  <>
                    <p className="text-light-300 text-sm">Plan: {selectedPackage}</p>
                    {amount && <p className="text-light-300 text-sm">Amount: {amount} KHR</p>}
                  </>
                )}
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
        </div>

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

          {/* Pay button*/}
          <button
            ref={payButtonRef}
            onClick={handleGenerateQR}
            disabled={loading}
            className="flex-1 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? "Start processing..." : "Pay with KHQR"}
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
