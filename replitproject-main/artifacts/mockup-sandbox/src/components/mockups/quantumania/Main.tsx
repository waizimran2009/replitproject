import React, { useEffect, useRef, useState } from "react"
import {
  Plus,
  Mic,
  Send,
  MoreHorizontal,
  Youtube,
  BookOpen,
  Zap,
  PanelLeft,
  User,
} from "lucide-react"

export function Main() {
  const beatRef = useRef({ intensity: 0 })
  const [inputVal, setInputVal] = useState("")
  const [beatPulse, setBeatPulse] = useState(0)

  const triggerBeat = () => {
    beatRef.current.intensity = 1.0
    setBeatPulse(p => p + 1)
  }

  const handleSend = () => {
    if (!inputVal.trim()) return
    triggerBeat()
    setInputVal("")
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend()
  }

  const handlePillClick = () => {
    triggerBeat()
  }

  return (
    <div className="flex h-screen w-full bg-[#0c0c0e] text-white font-sans overflow-hidden relative">
      <style>
        {`
          @keyframes subtleFade {
            0%   { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes orbFloat {
            0%   { transform: translateY(0px); }
            50%  { transform: translateY(-14px); }
            100% { transform: translateY(0px); }
          }
          @keyframes orbRing {
            0%   { transform: scale(1);   opacity: 0.85; }
            100% { transform: scale(1.9); opacity: 0; }
          }
          @keyframes orbRing2 {
            0%   { transform: scale(1);   opacity: 0.5; }
            100% { transform: scale(1.55); opacity: 0; }
          }
          .fade-in { animation: subtleFade 0.6s ease forwards; }
          .fade-in-delay-1 { animation: subtleFade 0.6s ease 0.1s forwards; opacity: 0; }
          .fade-in-delay-2 { animation: subtleFade 0.6s ease 0.2s forwards; opacity: 0; }
          .fade-in-delay-3 { animation: subtleFade 0.6s ease 0.35s forwards; opacity: 0; }
          .fade-in-delay-4 { animation: subtleFade 0.6s ease 0.5s forwards; opacity: 0; }
        `}
      </style>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-20">
        <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-md hover:bg-white/5">
          <PanelLeft size={20} />
        </button>
        <button className="flex items-center gap-2 bg-[#1c1c22] hover:bg-[#252530] border border-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors">
          <Zap size={13} className="text-amber-400" />
          Upgrade
        </button>
      </div>

      {/* Main centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">

        {/* Subtle radial glow behind orb */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 320,
            height: 320,
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -62%)',
          }}
        />

        {/* 3D AI Orb */}
        <div
          className="fade-in mb-7 relative flex items-center justify-center"
          style={{ animation: 'subtleFade 0.6s ease forwards, orbFloat 3.5s ease-in-out infinite', width: 160, height: 160 }}
        >
          {/* CSS beat rings — perfectly circular, no canvas edge clipping */}
          {beatPulse > 0 && (
            <>
              <div
                key={`r1-${beatPulse}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 160, height: 160,
                  border: '2px solid rgba(167,139,250,0.85)',
                  animation: 'orbRing 0.75s cubic-bezier(0.2,0.6,0.4,1) forwards',
                }}
              />
              <div
                key={`r2-${beatPulse}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 160, height: 160,
                  border: '1.5px solid rgba(99,102,241,0.55)',
                  animation: 'orbRing2 0.6s cubic-bezier(0.2,0.6,0.4,1) 0.08s forwards',
                }}
              />
            </>
          )}
          <QuantumOrb3D size={160} beatRef={beatRef} />
        </div>

        {/* Heading */}
        <div className="fade-in-delay-1 text-center mb-3">
          <h1 className="text-3xl font-light text-gray-300 mb-1">
            Good to See You!
          </h1>
          <h2 className="text-3xl font-semibold text-white">
            How Can I{" "}
            <span className="font-bold italic">Help</span>{" "}
            You Today?
          </h2>
        </div>

        {/* Subtitle */}
        <p className="fade-in-delay-2 text-sm text-gray-500 mb-12 text-center">
          I'm available 24/7 for you, ask me anything.
        </p>

        {/* Input card */}
        <div className="fade-in-delay-3 w-full max-w-xl mb-4">
          {/* Pro plan banner */}
          <div className="flex items-center justify-between px-4 py-2 mb-px bg-[#141418] border border-white/[0.07] rounded-t-2xl text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-indigo-400" />
              Unlock more features with the Pro plan.
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-gray-400">Active extensions</span>
            </div>
          </div>

          {/* Input row */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#141418] border border-t-0 border-white/[0.07] rounded-b-2xl">
            <button className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5">
              <Plus size={15} />
            </button>
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything ..."
              className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none"
            />
            <button
              onClick={inputVal.trim() ? handleSend : undefined}
              className={`flex-shrink-0 p-1.5 transition-colors ${inputVal.trim() ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {inputVal.trim() ? <Send size={18} /> : <Mic size={18} />}
            </button>
          </div>
        </div>

        {/* Suggestion pills */}
        <div className="fade-in-delay-4 flex items-center gap-2 flex-wrap justify-center max-w-xl">
          <SuggestionPill icon={<User size={13} />} label="Any advice for me?" onClick={handlePillClick} />
          <SuggestionPill icon={<Youtube size={13} />} label="Some youtube video idea" onClick={handlePillClick} />
          <SuggestionPill icon={<BookOpen size={13} />} label="Life lessons from history" onClick={handlePillClick} />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141418] border border-white/[0.07] text-gray-500 hover:text-gray-300 text-xs transition-colors hover:bg-[#1c1c22]">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 text-center pb-5 text-xs text-gray-600">
        Unlock new era with QuantuMania.{" "}
        <button className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
          share us
        </button>
      </div>
    </div>
  )
}

function SuggestionPill({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141418] border border-white/[0.07] text-gray-400 hover:text-gray-200 text-xs transition-colors hover:bg-[#1c1c22]"
    >
      <span className="text-gray-500">{icon}</span>
      {label}
    </button>
  )
}

function QuantumOrb3D({
  size = 160,
  beatRef,
}: {
  size?: number
  beatRef?: React.MutableRefObject<{ intensity: number }>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const S = 110
    canvas.width = S
    canvas.height = S
    const cx = S / 2
    const cy = S / 2
    const R = S * 0.41

    const rawL = { x: -0.45, y: -0.65, z: 0.62 }
    const lLen = Math.sqrt(rawL.x ** 2 + rawL.y ** 2 + rawL.z ** 2)
    const L = { x: rawL.x / lLen, y: rawL.y / lLen, z: rawL.z / lLen }

    const imgData = ctx.createImageData(S, S)
    const d = imgData.data
    let t = 0
    let animId: number

    function draw() {
      const beat = beatRef?.current?.intensity ?? 0
      // Decay the beat each frame
      if (beatRef && beat > 0.005) {
        beatRef.current.intensity *= 0.88
      } else if (beatRef) {
        beatRef.current.intensity = 0
      }

      const rotY = t * 0.007
      const rotX = Math.sin(t * 0.004) * 0.65

      const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX)

      // Beat scale: sphere swells on beat
      const beatScale = 1 + beat * 0.22
      const Rb = R * beatScale

      for (let py = 0; py < S; py++) {
        for (let px = 0; px < S; px++) {
          const idx = (py * S + px) * 4
          const dx = (px - cx) / Rb
          const dy = (py - cy) / Rb
          const d2 = dx * dx + dy * dy

          if (d2 > 1) { d[idx + 3] = 0; continue }

          const dz = Math.sqrt(1 - d2)

          const wx0 = dx
          const wy0 = dy * cosX - dz * sinX
          const wz0 = dy * sinX + dz * cosX
          const wx = wx0 * cosY + wz0 * sinY
          const wy = wy0
          const wz = -wx0 * sinY + wz0 * cosY

          const lon = Math.atan2(wx, wz)
          const lat = Math.asin(Math.max(-1, Math.min(1, wy)))

          const f = t * 0.018
          const p1 = Math.sin(lon * 3.5 + f)
          const p2 = Math.sin(lat * 4.2 - f * 0.8)
          const p3 = Math.sin((lon + lat) * 2.8 + f * 0.6)
          const p4 = Math.sin(Math.sqrt(lon * lon + lat * lat) * 6 - f * 1.2)
          // Beat boosts the plasma energy — surface glows brighter on beat
          const plasma = (p1 * 0.3 + p2 * 0.28 + p3 * 0.24 + p4 * 0.18 + 1 + beat * 0.5) / (2 + beat * 0.5)

          let br: number, bg: number, bb: number
          if (plasma < 0.3) {
            const f2 = plasma / 0.3
            br = Math.round(15 + f2 * 70); bg = Math.round(8 + f2 * 30); bb = Math.round(60 + f2 * 170)
          } else if (plasma < 0.65) {
            const f2 = (plasma - 0.3) / 0.35
            br = Math.round(85 + f2 * 120); bg = Math.round(38 + f2 * 70); bb = Math.round(230 + f2 * 20)
          } else {
            const f2 = (plasma - 0.65) / 0.35
            br = Math.round(205 + f2 * 50); bg = Math.round(108 + f2 * 140); bb = 250
          }

          const NdotL = Math.max(0, dx * L.x + dy * L.y + dz * L.z)
          const Rz = 2 * dz * NdotL - L.z
          // Specular gets stronger on beat
          const spec = Math.pow(Math.max(0, Rz), 28) * (0.9 + beat * 0.6)

          const ambient = 0.13 + beat * 0.15
          const bright = ambient + NdotL * 0.78

          const edge = 1 - Math.pow(d2, 4)

          d[idx]     = Math.min(255, br * bright + spec * 255)
          d[idx + 1] = Math.min(255, bg * bright + spec * 220)
          d[idx + 2] = Math.min(255, bb * bright + spec * 255)
          d[idx + 3] = Math.round(edge * 255)
        }
      }

      ctx.putImageData(imgData, 0, 0)

      t++
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        imageRendering: "auto",
        filter:
          "drop-shadow(0 0 28px rgba(139,92,246,0.85)) drop-shadow(0 0 70px rgba(99,102,241,0.5))",
      }}
    />
  )
}
