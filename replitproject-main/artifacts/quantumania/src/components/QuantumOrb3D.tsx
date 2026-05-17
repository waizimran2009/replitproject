import React, { useEffect, useRef } from "react"

export function QuantumOrb3D({
  size = 160,
  beatRef,
}: {
  size?: number
  beatRef?: React.MutableRefObject<{ intensity: number }>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heartbeatRef = useRef<{ phase: number; timer: ReturnType<typeof setTimeout> | null }>({ phase: 0, timer: null })

  useEffect(() => {
    function scheduleHeartbeat() {
      heartbeatRef.current.timer = setTimeout(() => {
        if (heartbeatRef.current.phase === 0) {
          if (beatRef) beatRef.current.intensity = Math.max(beatRef.current.intensity, 0.75)
          heartbeatRef.current.phase = 1
          scheduleHeartbeat()
        } else if (heartbeatRef.current.phase === 1) {
          if (beatRef) beatRef.current.intensity = Math.max(beatRef.current.intensity, 0.45)
          heartbeatRef.current.phase = 2
          scheduleHeartbeat()
        } else {
          heartbeatRef.current.phase = 0
          scheduleHeartbeat()
        }
      }, heartbeatRef.current.phase === 0 ? 700 : heartbeatRef.current.phase === 1 ? 180 : 520)
    }
    scheduleHeartbeat()
    return () => {
      if (heartbeatRef.current.timer) clearTimeout(heartbeatRef.current.timer)
    }
  }, [])

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
      if (beatRef && beat > 0.005) beatRef.current.intensity *= 0.88
      else if (beatRef) beatRef.current.intensity = 0

      const rotY = t * 0.007
      const rotX = Math.sin(t * 0.004) * 0.65
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
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
        width: size, height: size,
        imageRendering: "auto",
        filter: "drop-shadow(0 0 28px rgba(139,92,246,0.85)) drop-shadow(0 0 70px rgba(99,102,241,0.5))",
      }}
    />
  )
}
