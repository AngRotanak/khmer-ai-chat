import { useState, useEffect, useRef } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { AdminLayout } from "./components/AdminLayout"
import { z } from "zod"
import { getGroupId, getUserId } from "./components/utils/telegram"
import { db } from '~/lib/firebase'
import { ref, push, set } from 'firebase/database'

export const Route = createFileRoute("/attendance/register")({
  component: RegisterPage,
  validateSearch: z.object({
    group_id: z.string().optional(),
  }),
})



function RegisterPage() {
  // At the top of your component....
  const TIMEOUT_MINUTES = 10   // change to 10 for production
  const TIMEOUT_SECONDS = TIMEOUT_MINUTES * 60
  const [remainingSeconds, setRemainingSeconds] = useState(TIMEOUT_SECONDS)

  const userId = getUserId() || "guest"   // ✅ real Telegram userId
  const groupId = getGroupId()


  const [selectedPackage, setSelectedPackage] = useState("basic")
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [md5, setMd5] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)

  const [showQRPanel, setShowQRPanel] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)

  const [licenseInfo, setLicenseInfo] = useState<{
    package: string
    expires_at: string
    license_id: string
    download_url: string
    user_limit: number
    duration_days: number
    issued_at: string
    status: string
    group_id: string
    owner_id: string
  } | null>(null)


  const qrRef = useRef<HTMLDivElement | null>(null)
  const thankYouRef = useRef<HTMLDivElement | null>(null)
  const payButtonRef = useRef<HTMLButtonElement | null>(null)

  const plans = [
    {
      id: "basic",
      name: "Basic Plan",
      price: "10,000 KHR",
      features: [
        "✔ Core features",
        "✔ 1 user license",
        "✔ Email support",
      ],
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "30,000 KHR",
      features: [
        "✔ All Basic features",
        "✔ 5 user licenses",
        "✔ Priority support",
        "✔ Advanced analytics",
      ],
      recommended: true,
    },
    {
      id: "enterprise",
      name: "Enterprise Plan",
      price: "100,000 KHR",
      features: [
        "✔ Unlimited users",
        "✔ Dedicated account manager",
        "✔ Custom integrations",
        "✔ SLA guarantee",
      ],
    },
  ]

  const resetPaymentState = () => {
    setQrImage(null)
    setAmount(null)
    setMd5(null)
    setRemainingSeconds(TIMEOUT_SECONDS)
    setTimeoutReached(false)
    setPaymentComplete(false)
    setLicenseInfo(null)
    setShowQRPanel(false)
    setShowThankYou(false)
  }


  const handleGenerateQR = async () => {
    setLoading(true)
    resetPaymentState()

    try {
      const res = await fetch("https://asia-east2-khmer-catalog.cloudfunctions.net/KhmerAutobot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "register",
          group_id: groupId,
          user: {
            id: "12345",
            name: "Demo User",
          },
          bot_username: "autobot",
          package: selectedPackage,
          timestamp: new Date().toISOString(),
        }),
      })

      const data = await res.json()

      setQrImage(`data:image/jpeg;base64,${data.qr_image}`)
      setAmount(data.amount)
      setMd5(data.md5)

      // smooth QR animation ..
      setTimeout(() => {
        setShowQRPanel(true)
      }, 150)
    } catch (err) {
      console.error("Error generating QR:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!md5 || paymentComplete || timeoutReached) return

    let secondsPassed = 0
    let countdownValue = 60

    const interval = setInterval(async () => {
      countdownValue -= 1
      secondsPassed += 1

      if (countdownValue === 10) {
        const warningBeep = new Audio("/warning.mp3")
        warningBeep.play().catch(err => console.error("Warning beep error:", err))
      }

      if (secondsPassed >= TIMEOUT_SECONDS) {
        setTimeoutReached(true)
        clearInterval(interval)
        return
      }

      if (countdownValue === 0) {
        const timeoutBeep = new Audio("/timeout.mp3")
        timeoutBeep.play().catch(err => console.error("Timeout beep error:", err))
        countdownValue = 60
      }

      if (secondsPassed % 5 === 0) {
        try {
          const res = await fetch("https://asia-east2-khmer-catalog.cloudfunctions.net/KhmerAutobot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "check_payment", md5, selected_package: selectedPackage, bot_username: "autobot" }),
          })
          const data = await res.json()

          if (data.status === "PAID") {
            clearInterval(interval)

            // ✅ Plan rules
            const planRules: Record<string, { user_limit: number; duration_days: number }> = {
              basic: { user_limit: 5, duration_days: 30 },
              pro: { user_limit: 15, duration_days: 90 },
              enterprise: { user_limit: 9999, duration_days: 365 }, // unlimited
            }

            const rules = planRules[selectedPackage] || planRules.basic

            // ✅ License object
            const licenseData = {
              license_id: data.license_id || md5,
              package: selectedPackage,
              user_limit: rules.user_limit,
              duration_days: rules.duration_days,
              issued_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + rules.duration_days * 86400000).toISOString(),
              status: "active",
              group_id: groupId,
              owner_id: userId,
              download_url: data.download_url || ""   // <-- add this
            }

            if (!groupId || groupId === "unknown" || !userId || userId === "guest") {
              console.error("Invalid groupId/userId, skipping license save", { groupId, userId })
              return
            }


            try {
              await saveLicense(licenseData, groupId, userId)

              await push(ref(db, `logs/webapp/${groupId}`), {
                type: "license_created",
                group_id: groupId,
                user_id: userId,
                licenseData,
                timestamp: new Date().toISOString(),
              })
            } catch (err) {
              console.error("Firebase update error:", err)
            }

            // ✅ Update UI
            setShowQRPanel(false)
            setTimeout(() => {
              setPaymentComplete(true)
              setLicenseInfo(licenseData)
              setShowThankYou(true)
            }, 500)
          }
        } catch (err) {
          console.error("Error checking payment:", err)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [md5, paymentComplete, timeoutReached, selectedPackage])

  useEffect(() => {
    if (showThankYou && thankYouRef.current) {
      setTimeout(() => {
        thankYouRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }, 400) // wait QR hide animation first
    }
  }, [showThankYou])

  useEffect(() => {
    if (!showQRPanel) return
    if (!qrRef.current) return

    const timer = setTimeout(() => {
      const element = qrRef.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const offsetTop = window.pageYOffset + rect.top - 120

      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [showQRPanel])

  useEffect(() => {
    if (timeoutReached) {
      const beep = new Audio("/warning.mp3")
      beep.play().catch(err => console.error("Beep error:", err))
      alert("⏳ Payment window expired. Please retry.")
    }
  }, [timeoutReached])

  useEffect(() => {
    if (!md5 || paymentComplete || timeoutReached) return

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimeoutReached(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [md5, paymentComplete, timeoutReached])



  function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }


  return (
    <AdminLayout title="📝 License">
      <div className="flex-1 px-4 py-6 max-w-md mx-auto space-y-6 pb-15">

        <h2 className="text-teal-400 text-lg font-bold text-center">
          Quick Registration
        </h2>

        {/* Plans */}
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
                  payButtonRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  })
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

                <span className="text-sm font-semibold text-gray-700">
                  {plan.price}
                </span>
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

        {/* QR PANEL ,,,,*/}
        <div
          ref={qrRef}
          className={`transition-all duration-700 ease-out overflow-hidden ${showQRPanel && qrImage && !paymentComplete
            ? "max-h-[700px] opacity-100 translate-y-0 scale-100 mt-6"
            : "max-h-0 opacity-0 translate-y-10 scale-95"
            }`}
        >
          {qrImage && !paymentComplete && (
            <div className="rounded-xl shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-6 relative flex flex-col items-center text-white">

              {/* Close button */}
              <button
                onClick={() => {
                  setShowQRPanel(false)
                  setTimeout(() => {
                    setQrImage(null)
                    setMd5(null)
                  }, 500)
                }}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              >
                ✕
              </button>

              {/* QR image with overlays */}
              <div className="relative flex justify-center w-full">
                <img
                  src={qrImage}
                  alt="Bakong QR"
                  className="rounded-lg border border-gray-200 shadow-md"
                />

                {/* Brand overlay near bottom */}
                <div className="absolute bottom-21 left-0 right-0 text-center">
                  <p className="text-teal-400 font-bold text-base tracking-wide">
                    KHMER AUTOSOFT
                  </p>
                </div>

                {/* Countdown overlay just below brand */}
                {!timeoutReached && (
                  <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                    <div className={`px-4 py-2 rounded-lg font-bold text-lg text-red-500`}>
                      ⏳ {formatTime(remainingSeconds)}
                    </div>
                  </div>

                )}

              </div>

              {/* Progress bar */}
              <div
                className={`w-full bg-gray-200 rounded-full h-2 mt-4 transition-opacity duration-1000 ${timeoutReached ? "opacity-0" : "opacity-100"
                  }`}
              >
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${remainingSeconds > TIMEOUT_SECONDS * 0.6
                    ? "bg-green-500"
                    : remainingSeconds > TIMEOUT_SECONDS * 0.3
                      ? "bg-yellow-500"
                      : "bg-red-500 animate-pulse"
                    }`}
                  style={{
                    width: `${((TIMEOUT_SECONDS - remainingSeconds) / TIMEOUT_SECONDS) * 100}%`,
                  }}
                />
              </div>


              {/* Payment info */}
              <div className="mt-4 text-center">
                <h3 className="font-bold text-teal-600">Scan to Pay</h3>
                {timeoutReached ? (
                  <p className="text-red-500 font-semibold">Payment Timeout</p>
                ) : (
                  <>
                    <p>Plan: {selectedPackage}</p>
                    <p>Amount: {amount} KHR</p>
                  </>
                )}
              </div>

              {/* Retry button ....*/}
              {timeoutReached && (
                <button
                  onClick={handleGenerateQR}
                  className="mt-4 w-full py-2 rounded-lg bg-red-600 text-white animate-bounce"
                >
                  🔄 Retry Payment
                </button>
              )}

            </div>
          )}
        </div>


        {/* THANK YOU SCREEN */}
        <div
          ref={thankYouRef}
          className={`transition-all duration-700 ease-out overflow-hidden ${showThankYou && paymentComplete && licenseInfo
            ? "max-h-[700px] opacity-100 translate-y-0 scale-100 mt-6"
            : "max-h-0 opacity-0 translate-y-10 scale-95"
            }`}
        >
          {paymentComplete && licenseInfo && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl shadow-lg p-8 text-center text-white">

              {/* Title */}
              <h3 className="text-green-400 font-bold text-lg mb-3 animate-bounce">
                ✅ Payment Complete
              </h3>

              {/* Message */}
              <p className="text-gray-300">
                Your license has been activated.
              </p>

              {/* Info */}
              <div className="mt-4 space-y-1">
                <p className="text-gray-300">Plan: {licenseInfo.package}</p>
                <p className="text-gray-300">License ID: {licenseInfo.license_id}</p>
                <p className="text-gray-300">
                  Expires: {new Date(licenseInfo.expires_at).toLocaleDateString()}
                </p>
                <p className="text-gray-300">User Limit: {licenseInfo.user_limit}</p>
                <p className="text-gray-300">Duration: {licenseInfo.duration_days} days</p>
                <p className="text-gray-300">
                  Issued: {new Date(licenseInfo.issued_at).toLocaleDateString()}
                </p>
                <p className="text-gray-300">Status: {licenseInfo.status}</p>
              </div>

              {/* Download */}
              {licenseInfo.download_url && (
                <a
                  href={licenseInfo.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition"
                >
                  Download License PDF
                </a>
              )}

              {/* Copy button */}
              <button
                onClick={() => navigator.clipboard.writeText(licenseInfo.license_id)}
                className="mt-3 w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition"
              >
                Copy License ID
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-15 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white border px-4 py-4 rounded-xl shadow-lg z-50">
        <div className="flex items-center gap-3">
          <span className="px-3 py-2 rounded-lg bg-teal-100 text-teal-700 font-semibold text-sm">
            {plans.find((p) => p.id === selectedPackage)?.price}
          </span>

          <button
            ref={payButtonRef}
            onClick={handleGenerateQR}
            disabled={loading}
            className="flex-1 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Generating QR...
              </span>
            ) : (
              "Pay with KHQR"
            )}
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-400 text-center">
          Secure KHQR payment
        </p>
      </div>
    </AdminLayout>
  )
}

async function saveLicense(licenseData: any, groupId: string, userId: string) {
  if (!groupId || groupId === "unknown" || !userId || userId === "guest") {
    throw new Error("Invalid groupId/userId, cannot save license")
  }

  const path = `khmer-autobot/licenses/${groupId}`
  console.log("Saving license to:", path, licenseData)

  await set(ref(db, path), licenseData)
  await push(ref(db, `logs/webapp/${groupId}`), {
    type: "license_created",
    group_id: groupId,
    user_id: userId,
    licenseData,
    timestamp: new Date().toISOString(),
  })
}
