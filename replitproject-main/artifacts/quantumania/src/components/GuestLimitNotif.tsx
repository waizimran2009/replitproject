import React, { useEffect } from "react"
import { Sparkles, X, Zap, ArrowRight } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function GuestLimitNotif() {
  const { showLimitNotif, setShowLimitNotif, setShowAuthModal, guestMsgLimit } = useAuth()

  useEffect(() => {
    if (showLimitNotif) {
      const t = setTimeout(() => {}, 500)
      return () => clearTimeout(t)
    }
  }, [showLimitNotif])

  if (!showLimitNotif) return null

  return (
    <>
      <style>{`
        @keyframes notifSlideIn {
          from { transform: translateY(100px) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes notifGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(139,92,246,0.4), 0 20px 60px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 50px rgba(139,92,246,0.6), 0 20px 60px rgba(0,0,0,0.5); }
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={() => setShowLimitNotif(false)}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
        }}
      />

      {/* Notification card */}
      <div style={{
        position: "fixed",
        bottom: "50%",
        left: "50%",
        transform: "translate(-50%, 50%)",
        zIndex: 9999,
        width: "90%",
        maxWidth: 380,
        background: "rgba(8, 8, 28, 0.98)",
        border: "1px solid rgba(139,92,246,0.4)",
        borderRadius: 20,
        padding: "28px 24px",
        animation: "notifSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards, notifGlow 3s ease-in-out infinite 0.4s",
        textAlign: "center",
      }}>
        {/* Close */}
        <button
          onClick={() => setShowLimitNotif(false)}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(255,255,255,0.06)",
            border: "none", borderRadius: 8,
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            padding: "4px 6px",
            display: "flex", alignItems: "center",
          }}
        >
          <X size={14} />
        </button>

        {/* Icon */}
        <div style={{
          width: 64, height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))",
          border: "1px solid rgba(139,92,246,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px",
          animation: "iconPulse 2s ease-in-out infinite",
        }}>
          <Zap size={28} style={{ color: "#a78bfa" }} />
        </div>

        <h3 style={{
          margin: "0 0 8px",
          fontSize: 18,
          fontWeight: 700,
          background: "linear-gradient(135deg, #fff, #a78bfa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Message Limit Reached
        </h3>

        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 6px", lineHeight: 1.5 }}>
          You've used all <strong style={{ color: "rgba(255,255,255,0.8)" }}>{guestMsgLimit} free guest messages</strong>.
        </p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 24px", lineHeight: 1.5 }}>
          Create a free account to unlock unlimited conversations and full access to QuantuMania AI.
        </p>

        {/* Features */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginBottom: 22,
        }}>
          {["Unlimited messages", "Chat history", "Voice AI"].map(feat => (
            <div key={feat} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: 20,
              padding: "4px 10px",
              color: "rgba(255,255,255,0.6)",
              fontSize: 11,
              whiteSpace: "nowrap",
            }}>
              <Sparkles size={10} style={{ color: "#a78bfa" }} />
              {feat}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => {
            setShowLimitNotif(false)
            setShowAuthModal(true)
          }}
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 24px rgba(139,92,246,0.5)",
          }}
        >
          <Sparkles size={16} />
          Create Free Account
          <ArrowRight size={16} />
        </button>

        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 12, marginBottom: 0 }}>
          No credit card required — 100% free
        </p>
      </div>
    </>
  )
}
