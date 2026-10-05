/**
 * loading.tsx — payment-return route
 *
 * Next.js streams this instantly while the server verifies the Cashfree order
 * status and runs the DB confirmation. The user sees a polished "Processing..."
 * screen instead of a blank page during the 1-3 second API round-trip.
 */

export default function PaymentReturnLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Animated ring */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <span className="absolute inset-0 rounded-full border-4 border-rose-200 animate-ping opacity-60" />
            <svg
              className="absolute inset-0 w-full h-full animate-spin"
              viewBox="0 0 96 96"
              fill="none"
            >
              <circle cx="48" cy="48" r="40" stroke="#e7e5e4" strokeWidth="6" />
              <path
                d="M48 8 A40 40 0 0 1 88 48"
                stroke="#9f1239"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9f1239" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-stone-900">
            Verifying your payment…
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            Please wait while we confirm your transaction with Cashfree.
            <br />
            This usually takes a second or two.
          </p>
        </div>

        {/* Bouncing dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-rose-700"
              style={{ animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>

        <style>{`
          @keyframes dot-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40%            { transform: translateY(-6px); opacity: 1; }
          }
        `}</style>

        {/* Security note */}
        <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          100% Secure · Powered by Cashfree Payments
        </p>

      </div>
    </div>
  );
}
