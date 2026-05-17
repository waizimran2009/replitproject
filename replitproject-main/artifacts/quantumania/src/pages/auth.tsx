import React, { useState } from "react"
import { ArrowRight, Ghost, Zap, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import robotImg from "@assets/image_1776629459510.png"

type Mode = "signin" | "signup"

function MovingLightInput({
  label,
  type,
  placeholder,
  value,
  onChange,
  showToggle,
  show,
  onToggle,
  error,
}: {
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  showToggle?: boolean
  show?: boolean
  onToggle?: () => void
  error?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="fg">
      <label style={{
        fontSize: 10,
        color: "rgba(238,242,246,0.4)",
        marginBottom: 4,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontWeight: 500,
        display: "block",
      }}>{label}</label>
      <div style={{ position: "relative", marginBottom: error ? 4 : 10 }}>
        {/* Always-on rotating circular light border */}
        <div style={{
          position: "absolute",
          inset: -1,
          borderRadius: 9,
          padding: 1,
          background: error
            ? "conic-gradient(from var(--angle, 0deg), rgba(239,68,68,0.8), rgba(239,68,68,0.3), rgba(239,68,68,0.8))"
            : focused
              ? "conic-gradient(from var(--angle, 0deg), #8b5cf6, #a78bfa, #6366f1, #8b5cf6, #6366f1, #a78bfa, #8b5cf6)"
              : "conic-gradient(from var(--angle, 0deg), rgba(139,92,246,0.6), rgba(99,102,241,0.2), rgba(167,139,250,0.5), rgba(99,102,241,0.2), rgba(139,92,246,0.6))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animation: `borderRotate ${focused ? "1.8s" : "4s"} linear infinite`,
          zIndex: 0,
        }} />
        <div style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          background: focused ? "rgba(139,92,246,0.06)" : "#1a1e24",
          borderRadius: 8,
          transition: "background 0.2s",
        }}>
          <input
            type={showToggle ? (show ? "text" : "password") : type}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "rgba(238,242,246,0.9)",
              padding: "9px 13px",
              fontSize: 12.5,
              fontFamily: "inherit",
            }}
          />
          {showToggle && (
            <button
              type="button"
              onClick={onToggle}
              style={{
                padding: "0 13px",
                color: "rgba(238,242,246,0.3)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
      </div>
      {error && (
        <p style={{ color: "rgba(239,68,68,0.85)", fontSize: 11, marginBottom: 8, paddingLeft: 2 }}>{error}</p>
      )}
    </div>
  )
}

export default function AuthPage() {
  const { signIn, signUp, continueAsGuest, guestMsgLimit } = useAuth()
  const [mode, setMode] = useState<Mode>("signup")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [animating, setAnimating] = useState(false)

  const switchMode = (next: Mode) => {
    if (animating || next === mode) return
    setAnimating(true)
    setErrors({})
    setTimeout(() => {
      setMode(next)
      setAnimating(false)
    }, 250)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (mode === "signup") {
      if (!firstName.trim()) e.firstName = "First name is required"
      if (!agreed) e.agreed = "You must accept terms to continue"
    }
    if (!email.trim()) e.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email"
    if (!password) e.password = "Password is required"
    else if (mode === "signup" && password.length < 6) e.password = "Min 6 characters"
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setErrors({})
    try {
      if (mode === "signup") {
        const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ")
        await signUp(fullName || firstName.trim(), email, password)
      } else {
        await signIn(email, password)
      }
      setSuccess(true)
    } catch (err: any) {
      setErrors({ general: err?.message || "Something went wrong. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes borderRotate {
          to { --angle: 360deg; }
        }
        @keyframes fu {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fi {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cardGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes panelFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerBtn {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .auth-root {
          font-family: "DM Sans", "Inter", system-ui, sans-serif;
          background: #07060e;
          color: #eef2f6;
          min-height: 100vh;
          display: flex;
          overflow: hidden;
        }
        /* LEFT PANEL */
        .auth-left {
          flex: 1.2;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 1.8rem 2rem;
          animation: fi 0.6s ease both;
        }
        .auth-left-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 55% 8%, rgba(139,92,246,0.13) 0%, transparent 55%),
            radial-gradient(ellipse at 15% 85%, rgba(99,102,241,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 60%, rgba(6,182,212,0.07) 0%, transparent 45%),
            #07060e;
          z-index: 0;
        }
        .auth-glow {
          position: absolute;
          bottom: 3%;
          left: 50%;
          transform: translateX(-50%);
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.06) 35%, transparent 68%);
          z-index: 1;
          pointer-events: none;
          animation: cardGlow 4s ease-in-out infinite;
        }
        .auth-robot-overlay {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          background:
            linear-gradient(to bottom, rgba(7,6,14,0.55) 0%, transparent 30%, transparent 55%, rgba(7,6,14,0.82) 100%),
            linear-gradient(to right, rgba(7,6,14,0.35) 0%, transparent 40%);
        }
        .auth-hero {
          position: absolute;
          top: 42%;
          left: 2rem;
          right: 2rem;
          transform: translateY(-70%);
          z-index: 5;
          animation: fu 0.7s 0.1s ease both;
        }
        .auth-hero h1 {
          font-size: clamp(2.8rem, 4.5vw, 4.2rem);
          font-weight: 800;
          line-height: 1.02;
          letter-spacing: -0.035em;
          color: #eef2f6;
        }
        .auth-hero h1 .ac {
          background: linear-gradient(135deg, #a78bfa, #8b5cf6, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .auth-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 1rem;
        }
        .auth-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(139,92,246,0.08);
          border: 0.5px solid rgba(139,92,246,0.25);
          border-radius: 20px;
          padding: 5px 13px;
          font-size: 11.5px;
          color: rgba(238,242,246,0.55);
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .auth-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8b5cf6;
          box-shadow: 0 0 8px #8b5cf6;
        }
        /* Testimonial cards */
        .auth-robot {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.55) contrast(1.1) saturate(0.7) hue-rotate(200deg);
          pointer-events: none;
          animation: fi 0.9s 0.2s ease both;
        }
        .auth-tcards {
          position: absolute;
          bottom: 1.8rem;
          left: 2rem;
          right: 2rem;
          z-index: 10;
          display: flex;
          gap: 9px;
          animation: fu 0.7s 0.3s ease both;
        }
        .auth-tc {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 13px;
          padding: 11px 13px;
          backdrop-filter: blur(16px);
          min-width: 0;
          transition: border-color 0.2s, background 0.2s;
        }
        .auth-tc:hover {
          border-color: rgba(139,92,246,0.35);
          background: rgba(139,92,246,0.05);
        }
        .auth-tc-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 5px;
        }
        .auth-av {
          width: 27px;
          height: 27px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .auth-av-1 { background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: #07060e; }
        .auth-av-2 { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #07060e; }
        .auth-av-3 { background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: #07060e; }
        .auth-tc-name { font-size: 11.5px; font-weight: 500; color: #eef2f6; }
        .auth-tc-role { font-size: 10px; color: rgba(238,242,246,0.3); }
        .auth-stars { display: flex; gap: 2px; margin-bottom: 3px; }
        .auth-star {
          width: 7px; height: 7px;
          background: #8b5cf6;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }
        .auth-tc-txt { font-size: 10.5px; color: rgba(238,242,246,0.5); line-height: 1.5; }
        /* RIGHT PANEL */
        .auth-right {
          flex: 0.85;
          background: #0f0e18;
          border-left: 0.5px solid rgba(255,255,255,0.07);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2.8rem 2.4rem;
          position: relative;
          overflow: hidden;
          animation: fi 0.7s 0.12s ease both;
        }
        .auth-right::before {
          content: "";
          position: absolute;
          top: -120px; right: -70px;
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-right::after {
          content: "";
          position: absolute;
          bottom: -90px; left: -50px;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-fh {
          margin-bottom: 1.5rem;
          animation: fu 0.6s 0.22s ease both;
        }
        .auth-fh h2 {
          font-size: clamp(1.9rem, 3vw, 2.6rem);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: #eef2f6;
        }
        /* Tabs */
        .auth-tabs {
          display: flex;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 9px;
          padding: 3px;
          margin-bottom: 1.4rem;
          width: fit-content;
        }
        .auth-tab {
          padding: 7px 22px;
          border-radius: 7px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          color: rgba(238,242,246,0.35);
          transition: all 0.2s;
          border: none;
          background: transparent;
          font-family: inherit;
        }
        .auth-tab.active {
          background: rgba(139,92,246,0.15);
          color: #eef2f6;
          border: 0.5px solid rgba(139,92,246,0.3);
        }
        /* Panel */
        .auth-panel { display: none; }
        .auth-panel.active {
          display: block;
          animation: panelFade 0.3s ease both;
        }
        /* Row */
        .auth-row { display: flex; gap: 9px; margin-bottom: 0; }
        .auth-row .fg { flex: 1; }
        /* Divider */
        .auth-divider {
          font-size: 10px;
          color: rgba(238,242,246,0.3);
          text-align: center;
          margin: 10px 0;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          position: relative;
        }
        .auth-divider::before, .auth-divider::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 36%;
          height: 0.5px;
          background: rgba(255,255,255,0.1);
        }
        .auth-divider::before { left: 0; }
        .auth-divider::after { right: 0; }
        /* Submit btn */
        .auth-sbtn {
          background: linear-gradient(135deg, #8b5cf6, #6366f1, #06b6d4);
          background-size: 200% auto;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: all 0.25s;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .auth-sbtn:hover:not(:disabled) {
          background-position: right center;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(139,92,246,0.4), 0 4px 12px rgba(6,182,212,0.2);
        }
        .auth-sbtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-subrow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 6px;
        }
        .auth-already {
          font-size: 11.5px;
          color: rgba(238,242,246,0.35);
        }
        .auth-already a {
          color: rgba(238,242,246,0.65);
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }
        .auth-checkbox-row {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 8px 0 14px;
        }
        .auth-checkbox-row input[type=checkbox] {
          width: 13px;
          height: 13px;
          accent-color: #8b5cf6;
          cursor: pointer;
          flex-shrink: 0;
        }
        .auth-checkbox-row span {
          font-size: 11px;
          color: rgba(238,242,246,0.35);
          line-height: 1.4;
        }
        .auth-checkbox-row a {
          color: rgba(238,242,246,0.6);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .auth-forgot {
          text-align: right;
          margin: 2px 0 14px;
        }
        .auth-forgot a {
          font-size: 11px;
          color: rgba(238,242,246,0.3);
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }
        .auth-error-box {
          background: rgba(239,68,68,0.08);
          border: 0.5px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          padding: 9px 13px;
          margin-bottom: 12px;
          color: rgba(239,68,68,0.9);
          font-size: 12px;
        }
        /* Guest button */
        .auth-guest-btn {
          width: 100%;
          padding: 10px 0;
          border-radius: 8px;
          border: 0.5px solid rgba(255,255,255,0.1);
          cursor: pointer;
          background: rgba(255,255,255,0.02);
          color: rgba(238,242,246,0.45);
          font-weight: 500;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.2s;
          font-family: inherit;
          margin-top: 10px;
        }
        .auth-guest-btn:hover {
          background: rgba(139,92,246,0.06);
          border-color: rgba(139,92,246,0.2);
          color: rgba(238,242,246,0.75);
        }
        .auth-guest-note {
          margin-top: 10px;
          padding: 9px 13px;
          border-radius: 9px;
          background: rgba(251,191,36,0.05);
          border: 0.5px solid rgba(251,191,36,0.15);
          display: flex;
          align-items: flex-start;
          gap: 7px;
          font-size: 11.5px;
          color: rgba(251,191,36,0.65);
          line-height: 1.5;
        }
        /* Moving light border on right panel */
        .auth-panel-glow {
          position: absolute;
          inset: 0;
          border-radius: 0;
          pointer-events: none;
          z-index: 0;
        }
        /* Input box glow card */
        .auth-form-card {
          position: relative;
          z-index: 1;
        }
        /* Responsive */
        @media (max-width: 768px) {
          .auth-left { display: none; }
          .auth-right {
            flex: 1;
            border-left: none;
            padding: 2rem 1.5rem;
          }
        }
        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>

      <div className="auth-root">
        {/* LEFT PANEL */}
        <div className="auth-left">
          <div className="auth-left-bg" />
          <div className="auth-glow" />

          <div className="auth-hero">
            <h1>Your <span className="ac">AI</span><br />Assistant</h1>
            <div className="auth-badges">
              <div className="auth-badge"><span className="auth-dot" />+15 Hours Saved</div>
              <div className="auth-badge"><span className="auth-dot" />+2000 Users</div>
              <div className="auth-badge"><span className="auth-dot" />Always Online</div>
            </div>
          </div>

          <img src={robotImg} alt="AI Robot" className="auth-robot" />
          <div className="auth-robot-overlay" />

          <div className="auth-tcards">
            <div className="auth-tc">
              <div className="auth-tc-header">
                <div className="auth-av auth-av-1">DS</div>
                <div>
                  <div className="auth-tc-name">David S.</div>
                  <div className="auth-tc-role">Product Designer</div>
                </div>
              </div>
              <div className="auth-stars">
                {[0,1,2,3,4].map(i => <div key={i} className="auth-star" />)}
              </div>
              <div className="auth-tc-txt">Saves me hours every day. Absolutely essential tool.</div>
            </div>
            <div className="auth-tc">
              <div className="auth-tc-header">
                <div className="auth-av auth-av-2">AK</div>
                <div>
                  <div className="auth-tc-name">Alisa K.</div>
                  <div className="auth-tc-role">Marketing Lead</div>
                </div>
              </div>
              <div className="auth-stars">
                {[0,1,2,3,4].map(i => <div key={i} className="auth-star" />)}
              </div>
              <div className="auth-tc-txt">The smartest AI I have used. Total game changer.</div>
            </div>
            <div className="auth-tc">
              <div className="auth-tc-header">
                <div className="auth-av auth-av-3">JR</div>
                <div>
                  <div className="auth-tc-name">James R.</div>
                  <div className="auth-tc-role">Founder</div>
                </div>
              </div>
              <div className="auth-stars">
                {[0,1,2,3,4].map(i => <div key={i} className="auth-star" />)}
              </div>
              <div className="auth-tc-txt">Onboarded my team in minutes. Productivity up 3x.</div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="auth-fh">
            <h2>Start Your<br />Journey.</h2>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab${mode === "signup" ? " active" : ""}`}
              onClick={() => switchMode("signup")}
            >Sign Up</button>
            <button
              className={`auth-tab${mode === "signin" ? " active" : ""}`}
              onClick={() => switchMode("signin")}
            >Sign In</button>
          </div>

          {success ? (
            <div style={{ textAlign: "center", padding: "32px 0", animation: "panelFade 0.5s ease both" }}>
              <div style={{
                width: 56, height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.3))",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
                boxShadow: "0 0 28px rgba(139,92,246,0.5)",
              }}>
                <span style={{ fontSize: 24 }}>✦</span>
              </div>
              <p style={{ color: "#a78bfa", fontWeight: 600, fontSize: 15 }}>Welcome to QuantuMania!</p>
              <p style={{ color: "rgba(238,242,246,0.35)", fontSize: 12, marginTop: 4 }}>Loading your experience...</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="auth-form-card"
              style={{
                opacity: animating ? 0 : 1,
                transition: "opacity 0.18s",
              }}
            >
              {errors.general && (
                <div className="auth-error-box">{errors.general}</div>
              )}

              {/* SIGNUP PANEL */}
              <div className={`auth-panel${mode === "signup" ? " active" : ""}`}>
                <div className="auth-row">
                  <MovingLightInput
                    label="First Name"
                    type="text"
                    placeholder="Alex"
                    value={firstName}
                    onChange={setFirstName}
                    error={errors.firstName}
                  />
                  <MovingLightInput
                    label="Last Name"
                    type="text"
                    placeholder="Chen"
                    value={lastName}
                    onChange={setLastName}
                  />
                </div>
                <MovingLightInput
                  label="Email"
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                />
                <MovingLightInput
                  label="Password"
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={setPassword}
                  showToggle
                  show={showPass}
                  onToggle={() => setShowPass(p => !p)}
                  error={errors.password}
                />
                <div className="auth-checkbox-row">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                  />
                  <span>Accept <a href="#">terms and conditions</a> to continue</span>
                </div>
                {errors.agreed && (
                  <p style={{ color: "rgba(239,68,68,0.85)", fontSize: 11, marginBottom: 10, marginTop: -8 }}>{errors.agreed}</p>
                )}
                <div className="auth-subrow">
                  <span className="auth-already">
                    Have an account?{" "}
                    <a onClick={() => switchMode("signin")}>Login</a>
                  </span>
                  <button type="submit" className="auth-sbtn" disabled={loading}>
                    {loading ? <><div className="auth-spinner" /> Processing...</> : <>Sign Up <ArrowRight size={13} /></>}
                  </button>
                </div>
              </div>

              {/* SIGNIN PANEL */}
              <div className={`auth-panel${mode === "signin" ? " active" : ""}`}>
                <MovingLightInput
                  label="Email"
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                />
                <MovingLightInput
                  label="Password"
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={setPassword}
                  showToggle
                  show={showPass}
                  onToggle={() => setShowPass(p => !p)}
                  error={errors.password}
                />
                <div className="auth-forgot"><a href="#">Forgot password?</a></div>
                <div className="auth-subrow">
                  <span className="auth-already">
                    No account?{" "}
                    <a onClick={() => switchMode("signup")}>Sign Up</a>
                  </span>
                  <button type="submit" className="auth-sbtn" disabled={loading}>
                    {loading ? <><div className="auth-spinner" /> Processing...</> : <>Sign In <ArrowRight size={13} /></>}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Guest mode */}
          {!success && (
            <>
              <div className="auth-divider" style={{ marginTop: 16 }}>or</div>
              <button className="auth-guest-btn" onClick={continueAsGuest} type="button">
                <Ghost size={14} />
                Continue without account
              </button>
              <div className="auth-guest-note">
                <Zap size={12} style={{ color: "rgba(251,191,36,0.7)", marginTop: 1, flexShrink: 0 }} />
                <span>
                  Guest mode gives you <strong style={{ color: "rgba(251,191,36,0.9)" }}>{guestMsgLimit} free messages</strong>. Create an account for unlimited access and full features.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
