import React, { useEffect, useRef, useState, useCallback } from "react"
import { QuantumOrb3D } from "@/components/QuantumOrb3D"
import { useAuth } from "@/context/AuthContext"
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
  X,
  Sparkles,
  Bot,
  MessageSquare,
  Settings,
  Star,
  Trash2,
  Clock,
  Search,
  ChevronRight,
  LogOut,
  HelpCircle,
  Cpu,
  Crown,
  Lock,
  CheckCircle2,
  Image,
  Upload,
  Brain,
  Infinity,
  MessageCircle,
  AlertCircle,
  Copy,
  Check,
  ImageIcon,
  Pencil,
} from "lucide-react"

type Message = { role: "user" | "ai"; text: string; id: number; streaming?: boolean; imageUrl?: string }
type ChatSession = { id: number; title: string; preview: string; time: string }
type Plan = "free" | "premium"

const THEMES = {
  quantum: { name: "Quantum", emoji: "⚛️", primary: "#8b5cf6", secondary: "#6366f1", accent: "#06b6d4",
    userBubble: "linear-gradient(135deg,#6366f1,#8b5cf6)", aiBorder: "rgba(99,102,241,0.2)", aiText: "#818cf8",
    inputGlow: "rgba(99,102,241,0.25)", bg: "#06060a" },
  cyber:   { name: "Cyber",   emoji: "🌊", primary: "#06b6d4", secondary: "#3b82f6", accent: "#818cf8",
    userBubble: "linear-gradient(135deg,#0891b2,#3b82f6)", aiBorder: "rgba(6,182,212,0.2)", aiText: "#22d3ee",
    inputGlow: "rgba(6,182,212,0.25)", bg: "#020b10" },
  matrix:  { name: "Matrix",  emoji: "🟢", primary: "#22c55e", secondary: "#10b981", accent: "#86efac",
    userBubble: "linear-gradient(135deg,#16a34a,#10b981)", aiBorder: "rgba(34,197,94,0.2)", aiText: "#4ade80",
    inputGlow: "rgba(34,197,94,0.25)", bg: "#020a04" },
  solar:   { name: "Solar",   emoji: "☀️", primary: "#f59e0b", secondary: "#f97316", accent: "#fcd34d",
    userBubble: "linear-gradient(135deg,#d97706,#ea580c)", aiBorder: "rgba(245,158,11,0.2)", aiText: "#fbbf24",
    inputGlow: "rgba(245,158,11,0.25)", bg: "#080500" },
  crimson: { name: "Crimson", emoji: "🌸", primary: "#ec4899", secondary: "#f43f5e", accent: "#fb7185",
    userBubble: "linear-gradient(135deg,#db2777,#e11d48)", aiBorder: "rgba(236,72,153,0.2)", aiText: "#f472b6",
    inputGlow: "rgba(236,72,153,0.25)", bg: "#080205" },
} as const
type ThemeId = keyof typeof THEMES
const THEME_KEY = "qm_theme"
function getTheme(): ThemeId {
  try { const t = localStorage.getItem(THEME_KEY); if (t && t in THEMES) return t as ThemeId } catch {}
  return "quantum"
}

const FREE_MSG_LIMIT = 10
const FREE_IMG_LIMIT = 3
const FREE_FILE_LIMIT = 3
const PLAN_KEY = "qm_plan"
const DAILY_KEY = "qm_daily"

function getDailyCount(): number {
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (!raw) return 0
    const { count, date } = JSON.parse(raw)
    return date === new Date().toDateString() ? count : 0
  } catch { return 0 }
}
function setDailyCount(n: number) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify({ count: n, date: new Date().toDateString() })) } catch {}
}
function getPlan(): Plan {
  try { return (localStorage.getItem(PLAN_KEY) as Plan) || "free" } catch { return "free" }
}

const SUGGESTION_PILLS = [
  { icon: <User size={13} />, label: "Any advice for me?" },
  { icon: <Youtube size={13} />, label: "Some youtube video idea" },
  { icon: <BookOpen size={13} />, label: "Life lessons from history" },
]

const AI_REPLIES = [
  "That's a great question! Let me think about that for you...",
  "Interesting! Here's what I know about that topic.",
  "I love exploring this kind of thing. Here's my perspective:",
  "Great choice! There are so many angles to consider here.",
  "Absolutely! Here's what I'd recommend based on what I know.",
]

const RECENT_CHATS: ChatSession[] = [
  { id: 1, title: "How to improve focus", preview: "Try the Pomodoro technique...", time: "2m ago" },
  { id: 2, title: "YouTube channel ideas", preview: "Dark sky photography content...", time: "1h ago" },
  { id: 3, title: "History of the Roman Empire", preview: "The fall of Rome was caused by...", time: "3h ago" },
  { id: 4, title: "Best morning routines", preview: "Start with hydration and...", time: "Yesterday" },
  { id: 5, title: "Python vs JavaScript", preview: "Both have their strengths...", time: "Yesterday" },
  { id: 6, title: "Life philosophy advice", preview: "Stoicism suggests that...", time: "2d ago" },
]

export default function Home() {
  const { authState, signOut, setShowAuthModal, incrementGuestMessages, guestMsgLimit } = useAuth()
  const beatRef = useRef({ intensity: 0 })
  const [inputVal, setInputVal] = useState("")
  const [beatPulse, setBeatPulse] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [msgId, setMsgId] = useState(0)
  const [themeId, setThemeId] = useState<ThemeId>(getTheme)
  const theme = THEMES[themeId]
  const [searchVal, setSearchVal] = useState("")
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")
  const [voiceOrbOpen, setVoiceOrbOpen] = useState(false)
  const voiceOrbOpenRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Plan management ─────────────────────────────────
  const [plan, setPlanState] = useState<Plan>(getPlan)
  const [dailyCount, setDailyCountState] = useState<number>(getDailyCount)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const upgradePlan = useCallback((p: Plan) => {
    try { localStorage.setItem(PLAN_KEY, p) } catch {}
    setPlanState(p)
  }, [])

  const incrementDaily = useCallback(() => {
    const n = getDailyCount() + 1
    setDailyCount(n)
    setDailyCountState(n)
  }, [])

  useEffect(() => { voiceOrbOpenRef.current = voiceOrbOpen }, [voiceOrbOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const triggerBeat = () => {
    beatRef.current.intensity = 1.0
    setBeatPulse(p => p + 1)
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    if (authState.status === "guest") {
      if (authState.messagesUsed >= guestMsgLimit) return
      const canContinue = incrementGuestMessages()
      if (!canContinue) return
    } else {
      if (plan === "free" && dailyCount >= FREE_MSG_LIMIT) {
        setShowUpgrade(true)
        return
      }
      if (plan === "free") incrementDaily()
    }

    const userMsgId = msgId + 1
    setMsgId(userMsgId)
    setMessages(prev => [...prev, { role: "user", text: trimmed, id: userMsgId }])
    setChatOpen(true)
    setSidebarOpen(false)
    triggerBeat()
    setInputVal("")
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 900 + Math.random() * 900))

    const aiMsgId = userMsgId + 1
    setMsgId(aiMsgId)
    setIsTyping(false)
    const reply = AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)]
    setMessages(prev => [...prev, { role: "ai", text: reply, id: aiMsgId }])
    triggerBeat()
  }

  const handleSend = () => sendMessage(inputVal)
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend()
  }
  const handlePill = (label: string) => sendMessage(label)

  const handleEditSave = (msgId: number) => {
    const trimmed = editingText.trim()
    if (!trimmed) { setEditingMsgId(null); return }
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === msgId)
      if (idx === -1) return prev
      return prev.slice(0, idx)
    })
    setEditingMsgId(null)
    setEditingText("")
    sendMessage(trimmed)
  }

  const handleEditCancel = () => {
    setEditingMsgId(null)
    setEditingText("")
  }

  const startNewChat = () => {
    setChatOpen(false)
    setMessages([])
    setSidebarOpen(false)
  }

  const filteredChats = RECENT_CHATS.filter(c =>
    c.title.toLowerCase().includes(searchVal.toLowerCase())
  )

  return (
    <div
      className="flex h-screen w-full text-white font-sans overflow-hidden relative"
      style={{ background: plan === "premium" ? "#050308" : "#0c0c0e" }}
    >
      {/* ── Premium background ──────────────────────── */}
      {plan === "premium" && <PremiumCanvas />}
      <style>{`
        @keyframes subtleFade {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes rotateBorder {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rotateBorderReverse {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes lightPulse {
          0%, 100% { opacity: 0.65; }
          50%       { opacity: 0.9; }
        }
        @keyframes orbFloat {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-14px); }
          100% { transform: translateY(0px); }
        }
        @keyframes orbRing {
          0%   { transform: scale(1);    opacity: 0.85; }
          100% { transform: scale(1.9);  opacity: 0; }
        }
        @keyframes orbRing2 {
          0%   { transform: scale(1);    opacity: 0.5; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
        @keyframes slideInLeft {
          0%   { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0);     opacity: 1; }
        }
        @keyframes fadeBackdrop {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        .fade-in           { animation: subtleFade 0.6s ease forwards; }
        .fade-in-delay-1   { animation: subtleFade 0.6s ease 0.1s  forwards; opacity: 0; }
        .fade-in-delay-2   { animation: subtleFade 0.6s ease 0.2s  forwards; opacity: 0; }
        .fade-in-delay-3   { animation: subtleFade 0.6s ease 0.35s forwards; opacity: 0; }
        .fade-in-delay-4   { animation: subtleFade 0.6s ease 0.5s  forwards; opacity: 0; }
        .msg-in            { animation: subtleFade 0.35s ease forwards; }
        .sidebar-slide     { animation: slideInLeft 0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
        .backdrop-fade     { animation: fadeBackdrop 0.22s ease forwards; }
        .typing-dot        { animation: typingDot 1.2s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        /* ── Premium keyframes ───────────────────────── */
        @keyframes premiumStar {
          0%   { opacity: 0; transform: scale(0); }
          50%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.5) translateY(-20px); }
        }
        @keyframes premiumGoldPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(251,191,36,0.25), 0 0 40px rgba(245,158,11,0.1); }
          50% { box-shadow: 0 0 30px rgba(251,191,36,0.5), 0 0 70px rgba(245,158,11,0.25); }
        }
        @keyframes premiumCrownSpin {
          0%   { transform: rotate(-8deg) scale(1); }
          50%  { transform: rotate(8deg) scale(1.15); }
          100% { transform: rotate(-8deg) scale(1); }
        }
        @keyframes premiumShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes premiumAmbient {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes premiumBorderGold {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes premiumBorderGoldRev {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes premiumParticleFloat {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
          50%  { transform: translateY(-60px) translateX(20px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-120px) translateX(-10px) scale(0.6); opacity: 0; }
        }
        .premium-crown-anim { animation: premiumCrownSpin 3s ease-in-out infinite; }

        /* ── Voice Orb keyframes ─────────────────────── */
        @keyframes voiceOverlayIn {
          0%   { opacity: 0; backdrop-filter: blur(0px); }
          100% { opacity: 1; backdrop-filter: blur(20px); }
        }
        @keyframes voiceOrbIn {
          0%   { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes statusDot {
          0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
          40%            { opacity: 1;   transform: translateY(-3px); }
        }
        @keyframes voiceRing {
          0%   { transform: scale(0.85); opacity: 0.7; }
          60%  { transform: scale(1.18); opacity: 0; }
          100% { transform: scale(1.18); opacity: 0; }
        }
        @keyframes voiceRing2 {
          0%   { transform: scale(0.88); opacity: 0.55; }
          60%  { transform: scale(1.22); opacity: 0; }
          100% { transform: scale(1.22); opacity: 0; }
        }
        @keyframes voiceRing3 {
          0%   { transform: scale(0.92); opacity: 0.4; }
          60%  { transform: scale(1.26); opacity: 0; }
          100% { transform: scale(1.26); opacity: 0; }
        }
        @keyframes voiceRing4 {
          0%   { transform: scale(0.95); opacity: 0.25; }
          60%  { transform: scale(1.3);  opacity: 0; }
          100% { transform: scale(1.3);  opacity: 0; }
        }
        @keyframes waveBar {
          0%, 100% { transform: scaleY(0.25); opacity: 0.4; }
          50%       { transform: scaleY(1);    opacity: 1; }
        }
        @keyframes orbVoicePulse {
          0%, 100% { transform: scale(1);    filter: brightness(1); }
          50%       { transform: scale(1.04); filter: brightness(1.15); }
        }
        .voice-ring-1 { animation: voiceRing  2.4s ease-out infinite; }
        .voice-ring-2 { animation: voiceRing2 2.4s ease-out 0.5s infinite; }
        .voice-ring-3 { animation: voiceRing3 2.4s ease-out 1.0s infinite; }
        .voice-ring-4 { animation: voiceRing4 2.4s ease-out 1.5s infinite; }
        .orb-voice-pulse { animation: orbVoicePulse 1.8s ease-in-out infinite; }
        .status-dot { animation: statusDot 1.4s ease-in-out infinite; }
        .premium-shimmer-text {
          background: linear-gradient(90deg, #fbbf24, #f59e0b, #fde68a, #f59e0b, #fbbf24);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: premiumShimmer 2.5s linear infinite;
        }

        /* ── Mobile responsive ────────────────────────── */
        @media (max-width: 640px) {
          .qm-mobile-hide { display: none !important; }
          .qm-mobile-icon-only { padding-left: 8px !important; padding-right: 8px !important; min-width: 0 !important; }
          .qm-mobile-chat-px { padding-left: 12px !important; padding-right: 12px !important; }
          .qm-mobile-chat-pb { padding-bottom: 14px !important; }
          .qm-mobile-h1 { font-size: 1.4rem !important; line-height: 1.9rem !important; }
          .qm-mobile-h2 { font-size: 1.4rem !important; line-height: 1.9rem !important; }
          .qm-mobile-subtext { margin-bottom: 2rem !important; }
          .qm-topbar-gap { gap: 6px !important; }
        }
      `}</style>

      {/* ── Sidebar backdrop ───────────────────────────── */}
      {sidebarOpen && (
        <div
          className="backdrop-fade absolute inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────── */}
      {sidebarOpen && (
        <aside className="sidebar-slide absolute left-0 top-0 bottom-0 z-40 w-72 flex flex-col bg-[#101014] border-r border-white/[0.06]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
                <Cpu size={14} className="text-indigo-400" />
              </div>
              <span className="text-sm font-semibold text-white tracking-wide">QuantuMania</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-gray-500 hover:text-gray-300 rounded-md hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* New chat button */}
          <div className="px-3 pt-3 pb-2">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-sm font-medium transition-colors"
            >
              <Plus size={15} />
              New Chat
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl">
              <Search size={13} className="text-gray-500 shrink-0" />
              <input
                type="text"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search chats..."
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-600 outline-none"
              />
            </div>
          </div>

          {/* Recent chats */}
          <div className="flex-1 overflow-y-auto px-3 py-1">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-1 mb-2 flex items-center gap-1.5">
              <Clock size={10} /> Recent
            </p>
            <div className="space-y-0.5">
              {filteredChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setSidebarOpen(false)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <MessageSquare size={12} className="text-gray-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-300 font-medium truncate">{chat.title}</p>
                        <p className="text-[10px] text-gray-600 truncate mt-0.5">{chat.preview}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-gray-600">{chat.time}</span>
                      <button
                        onClick={e => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="px-3 py-2 border-t border-white/[0.06]">
            <div className="space-y-0.5">
              <SidebarNavItem icon={<Star size={14} />} label="Favourites" />
              <SidebarNavItem icon={<HelpCircle size={14} />} label="Help & Support" />
              <SidebarNavItem icon={<Settings size={14} />} label="Settings" badge="New" />
            </div>
          </div>

          {/* Plan usage bar — free plan only */}
          {plan === "free" && (
            <div className="px-3 pt-3 pb-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500 font-medium">Daily Messages</span>
                <span className="text-[10px] text-gray-500">{dailyCount}/{FREE_MSG_LIMIT}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((dailyCount / FREE_MSG_LIMIT) * 100, 100)}%`,
                    background: dailyCount >= FREE_MSG_LIMIT
                      ? "linear-gradient(to right, #ef4444, #dc2626)"
                      : dailyCount >= FREE_MSG_LIMIT * 0.7
                      ? "linear-gradient(to right, #f59e0b, #ea580c)"
                      : "linear-gradient(to right, #6366f1, #8b5cf6)",
                  }}
                />
              </div>
              {dailyCount >= FREE_MSG_LIMIT && (
                <p className="text-[10px] text-red-400 mt-1">Limit reached. Resets tomorrow.</p>
              )}
              <button
                onClick={() => setShowUpgrade(true)}
                className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/25 text-amber-300 text-xs font-medium transition-all"
              >
                <Crown size={11} />
                Upgrade to Premium
              </button>
            </div>
          )}

          {/* User profile */}
          <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${plan === "premium" ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`}>
                {plan === "premium" ? <Crown size={14} className="text-white" /> : <User size={14} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {authState.status === "authenticated" ? authState.user.name : authState.status === "guest" ? "Guest" : "User"}
                </p>
                <p className={`text-[10px] truncate font-medium ${plan === "premium" ? "text-amber-400" : authState.status === "guest" ? "text-orange-400" : "text-gray-500"}`}>
                  {plan === "premium" ? "✦ Premium Plan" : authState.status === "guest" ? `⚡ Guest · ${authState.messagesUsed}/${guestMsgLimit} msgs` : "Free Plan"}
                </p>
              </div>
              <ChevronRight size={13} className="text-gray-600 shrink-0" />
            </div>
            {authState.status === "guest" ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors text-xs font-medium"
              >
                <Sparkles size={13} />
                Create Account / Sign In
              </button>
            ) : (
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-colors text-xs"
              >
                <LogOut size={13} />
                Sign out
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ── Top bar ────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-20">
        <button
          onClick={() => setSidebarOpen(s => !s)}
          className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-md hover:bg-white/5"
          title="Open sidebar"
        >
          <PanelLeft size={20} />
        </button>
        <div className="flex items-center gap-2 qm-topbar-gap">
          {chatOpen && (
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-xs transition-colors"
            >
              <Plus size={12} /> <span className="qm-mobile-hide">New chat</span>
            </button>
          )}

          {/* Guest sign in/sign up buttons */}
          {authState.status === "guest" && (
            plan === "premium" ? (
              /* Premium-styled auth buttons */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="qm-mobile-hide"
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: "1px solid rgba(251,191,36,0.3)",
                    background: "rgba(251,191,36,0.06)",
                    color: "rgba(251,191,36,0.85)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(251,191,36,0.14)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.6)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(251,191,36,0.06)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.3)"; }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: "none",
                    background: "linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b)",
                    backgroundSize: "200% auto",
                    color: "#1a0a00",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    animation: "premiumShimmer 2.5s linear infinite",
                    fontFamily: "inherit",
                    boxShadow: "0 0 16px rgba(251,191,36,0.4)",
                  }}
                >
                  ✦ Sign Up Free
                </button>
              </div>
            ) : (
              /* Free-plan auth buttons */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="qm-mobile-hide px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-all"
                >
                  Sign Up
                </button>
              </div>
            )
          )}

          {plan === "free" ? (
            <button
              onClick={() => setShowUpgrade(true)}
              className="qm-mobile-icon-only flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-sm font-medium px-4 py-1.5 rounded-full transition-all"
            >
              <Crown size={13} className="text-amber-400" />
              <span className="qm-mobile-hide">Upgrade</span>
            </button>
          ) : (
            <div className="flex flex-col items-end gap-0.5">
              <div
                className="flex items-center gap-2 px-4 py-1.5 rounded-full cursor-pointer"
                onClick={() => setShowUpgrade(true)}
                style={{
                  background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))",
                  border: "1px solid rgba(251,191,36,0.4)",
                  animation: "premiumGoldPulse 3s ease-in-out infinite",
                }}
              >
                <Crown size={13} className="premium-crown-anim text-amber-400" />
                <span className="premium-shimmer-text text-sm font-bold">Premium</span>
              </div>
              <button
                onClick={() => { upgradePlan("free") }}
                className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-1"
              >
                Switch to Free
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Landing view ───────────────────────────────── */}
      {!chatOpen && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 320, height: 320,
              background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
              top: "50%", left: "50%",
              transform: "translate(-50%, -62%)",
            }}
          />

          <OrbWrapper beatPulse={beatPulse} beatRef={beatRef} size={160} floats />

          <div className="fade-in-delay-1 text-center mb-3">
            <h1 className="qm-mobile-h1 text-3xl font-light text-gray-300 mb-1">
              {authState.status === "authenticated"
                ? `Welcome back, ${authState.user.name.split(" ")[0]}!`
                : "Good to See You!"}
            </h1>
            <h2 className="qm-mobile-h2 text-3xl font-semibold text-white">
              How Can I <span className="font-bold italic">Help</span> You Today?
            </h2>
          </div>

          <p className="qm-mobile-subtext fade-in-delay-2 text-sm text-gray-500 mb-12 text-center">
            I'm available 24/7 for you, ask me anything.
          </p>

          <InputCard
            inputVal={inputVal}
            setInputVal={setInputVal}
            onSend={handleSend}
            onKey={handleKey}
            onMic={() => setVoiceOrbOpen(true)}
            isPremium={plan === "premium"}
            className="fade-in-delay-3"
          />

          <div className="fade-in-delay-4 flex items-center gap-2 flex-wrap justify-center max-w-xl mt-4">
            {SUGGESTION_PILLS.map(p => (
              <SuggestionPill key={p.label} icon={p.icon} label={p.label} onClick={() => handlePill(p.label)} />
            ))}
            <MoreGlowButton />
          </div>

        </div>
      )}

      {/* ── Chat view ──────────────────────────────────── */}
      {chatOpen && (
        <div className="flex-1 flex flex-col pt-16 pb-0">
          <div className="flex justify-center pt-4 pb-2 shrink-0">
            <OrbWrapper beatPulse={beatPulse} beatRef={beatRef} size={72} />
          </div>

          <div className="qm-mobile-chat-px flex-1 overflow-y-auto px-6 py-4 space-y-5 w-full">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`msg-in flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${theme.primary}22`, border: `1px solid ${theme.primary}44` }}>
                    <Sparkles size={14} style={{ color: theme.primary }} />
                  </div>
                )}
                <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                  {msg.role === "user" ? (
                    <div className="group/usermsg flex flex-col items-end gap-1">
                      {editingMsgId === msg.id ? (
                        /* ── Edit mode ── */
                        <div className="w-full min-w-[220px]" style={{ maxWidth: 340 }}>
                          <textarea
                            autoFocus
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(msg.id) }
                              if (e.key === "Escape") handleEditCancel()
                            }}
                            rows={Math.min(6, editingText.split("\n").length + 1)}
                            className="w-full px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white outline-none resize-none"
                            style={{
                              background: theme.userBubble,
                              border: `1.5px solid ${theme.primary}88`,
                              boxShadow: `0 0 16px ${theme.primary}44`,
                              fontFamily: "inherit",
                            }}
                          />
                          <div className="flex items-center gap-2 mt-1.5 justify-end">
                            <button
                              onClick={handleEditCancel}
                              className="px-3 py-1 text-xs rounded-lg text-gray-400 hover:text-white transition-colors"
                              style={{ background: "rgba(255,255,255,0.06)" }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleEditSave(msg.id)}
                              className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all"
                              style={{
                                background: theme.primary,
                                color: "#fff",
                                boxShadow: `0 0 10px ${theme.primary}55`,
                              }}
                            >
                              <Send size={11} /> Send
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Normal bubble ── */
                        <>
                          <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white"
                            style={{ background: theme.userBubble, boxShadow: `0 2px 16px ${theme.primary}33` }}>
                            {msg.text}
                          </div>
                          {/* Edit / Copy row — shows on hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover/usermsg:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => {
                                setEditingMsgId(msg.id)
                                setEditingText(msg.text)
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-gray-500 hover:text-gray-200 transition-colors"
                              style={{ background: "rgba(255,255,255,0.04)" }}
                              title="Edit message"
                            >
                              <Pencil size={10} />
                              Edit
                            </button>
                            <UserCopyButton text={msg.text} />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl rounded-tl-sm overflow-hidden"
                      style={{ background: "#ffffff", border: `1px solid ${theme.aiBorder}`, boxShadow: `0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(139,92,246,0.06)` }}>
                      {/* AI header bar */}
                      <div className="flex items-center justify-between px-3 py-2 border-b"
                        style={{ borderColor: "rgba(0,0,0,0.07)", background: `${theme.primary}18` }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.primary }}>✦ QuantuMania AI</span>
                          {msg.streaming && <span style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", animation: "pulse 1.5s ease-in-out infinite" }}>● generating</span>}
                        </div>
                        <CopyButton text={msg.text} color={theme.primary} />
                      </div>
                      {/* Message body */}
                      <div style={{ padding: "14px 16px", background: "#ffffff" }}>
                        <MarkdownMessage text={msg.text} accentColor={theme.primary} primaryColor={theme.primary} />
                      </div>
                      {msg.imageUrl && (
                        <div className="px-4 pb-4">
                          <img src={msg.imageUrl} alt="AI generated" className="w-full rounded-xl"
                            style={{ border: `1px solid ${theme.aiBorder}`, maxHeight: 400, objectFit: "cover" }} />
                          <a href={msg.imageUrl} download="quantumania-image.png"
                            className="mt-2 flex items-center gap-1.5 text-xs w-fit"
                            style={{ color: theme.primary }}>
                            <ImageIcon size={11} /> Download image
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={13} className="text-gray-400" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="msg-in flex gap-3 flex-row">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={13} className="text-indigo-400" />
                </div>
                <div className="bg-[#141418] border border-white/[0.07] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="qm-mobile-chat-px qm-mobile-chat-pb shrink-0 px-6 pb-6 w-full">
            <InputCard
              inputVal={inputVal}
              setInputVal={setInputVal}
              onSend={handleSend}
              onKey={handleKey}
              onMic={() => setVoiceOrbOpen(true)}
              isPremium={plan === "premium"}
            />
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────── */}
      {!chatOpen && (
        <div className="absolute bottom-0 left-0 right-0 text-center pb-5 text-xs text-gray-600">
          Unlock new era with QuantuMania.{" "}
          <button className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
            share us
          </button>
        </div>
      )}

      {/* ── Near-limit warning banner ───────────────────── */}
      {plan === "free" && dailyCount >= FREE_MSG_LIMIT - 2 && dailyCount < FREE_MSG_LIMIT && !chatOpen && (
        <div className="absolute bottom-14 left-0 right-0 flex justify-center px-4 z-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertCircle size={12} />
            {FREE_MSG_LIMIT - dailyCount} free message{FREE_MSG_LIMIT - dailyCount === 1 ? "" : "s"} remaining today
            <button onClick={() => setShowUpgrade(true)} className="underline underline-offset-2 hover:text-amber-200 transition-colors">Upgrade</button>
          </div>
        </div>
      )}

      {/* ── AI Voice Orb Overlay ────────────────────────── */}
      {voiceOrbOpen && (
        <AIVoiceOrbOverlay
          beatRef={beatRef}
          beatPulse={beatPulse}
          plan={plan}
          onClose={() => { setVoiceOrbOpen(false) }}
        />
      )}

      {/* ── Upgrade Modal ───────────────────────────────── */}
      {showUpgrade && (
        <UpgradeModal
          plan={plan}
          dailyCount={dailyCount}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => { upgradePlan("premium"); setShowUpgrade(false) }}
          onDowngrade={() => { upgradePlan("free"); setShowUpgrade(false) }}
        />
      )}

    </div>
  )
}

function SidebarNavItem({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-200 hover:bg-white/[0.05] transition-colors text-xs">
      <span className="text-gray-600">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[9px] font-semibold border border-indigo-500/20">
          {badge}
        </span>
      )}
    </button>
  )
}

function OrbWrapper({
  beatPulse,
  beatRef,
  size,
  floats = false,
}: {
  beatPulse: number
  beatRef: React.MutableRefObject<{ intensity: number }>
  size: number
  floats?: boolean
}) {
  return (
    <div
      className="fade-in relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
        animation: floats
          ? "subtleFade 0.6s ease forwards, orbFloat 3.5s ease-in-out infinite"
          : "subtleFade 0.6s ease forwards",
      }}
    >
      {beatPulse > 0 && (
        <>
          <div
            key={`r1-${beatPulse}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size, height: size,
              border: "2px solid rgba(167,139,250,0.85)",
              animation: "orbRing 0.75s cubic-bezier(0.2,0.6,0.4,1) forwards",
            }}
          />
          <div
            key={`r2-${beatPulse}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size, height: size,
              border: "1.5px solid rgba(99,102,241,0.55)",
              animation: "orbRing2 0.6s cubic-bezier(0.2,0.6,0.4,1) 0.08s forwards",
            }}
          />
        </>
      )}
      <QuantumOrb3D size={size} beatRef={beatRef} />
    </div>
  )
}

function PlusGlowButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9,
        background: hovered
          ? "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(59,130,246,0.35))"
          : "rgba(255,255,255,0.04)",
        border: hovered
          ? "1px solid rgba(167,139,250,0.8)"
          : "1px solid rgba(167,139,250,0.45)",
        color: hovered ? "#c4b5fd" : "#a78bfa",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: hovered
          ? "0 0 14px rgba(139,92,246,0.7), 0 0 30px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"
          : "0 0 8px rgba(139,92,246,0.4), 0 0 18px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <Plus size={15} />
    </button>
  )
}

function InputCard({
  inputVal,
  setInputVal,
  onSend,
  onKey,
  onMic,
  isPremium = false,
  className = "",
}: {
  inputVal: string
  setInputVal: (v: string) => void
  onSend: () => void
  onKey: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onMic?: () => void
  isPremium?: boolean
  className?: string
}) {
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const voiceRecRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function toggleVoiceToText() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    if (isVoiceListening) {
      if (voiceRecRef.current) {
        try { voiceRecRef.current.stop() } catch {}
        voiceRecRef.current = null
      }
      setIsVoiceListening(false)
      return
    }

    try {
      const rec = new SR()
      voiceRecRef.current = rec
      rec.continuous = true
      rec.interimResults = true
      rec.lang = "en-US"

      let finalText = inputVal

      rec.onresult = (e: any) => {
        let interim = ""
        let newFinal = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            newFinal += e.results[i][0].transcript
          } else {
            interim += e.results[i][0].transcript
          }
        }
        if (newFinal) {
          finalText = (finalText + " " + newFinal).trim()
          setInputVal(finalText)
        } else {
          setInputVal((finalText + " " + interim).trim())
        }
      }

      rec.onerror = () => {
        setIsVoiceListening(false)
        voiceRecRef.current = null
      }

      rec.onend = () => {
        setIsVoiceListening(false)
        voiceRecRef.current = null
        inputRef.current?.focus()
      }

      rec.start()
      setIsVoiceListening(true)
    } catch {
      setIsVoiceListening(false)
    }
  }

  return (
    <div className={`w-full max-w-xl mx-auto ${className}`}>
      <div className="relative rounded-2xl" style={{ padding: "1.5px" }}>

        {isPremium ? (
          /* ── Premium: gold rotating lights ───────────────── */
          <>
            {/* Primary gold rotating conic */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" aria-hidden="true">
              <div style={{
                position: "absolute", inset: "-80%",
                background: "conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.9) 40deg, rgba(245,158,11,1) 80deg, rgba(253,230,138,0.8) 120deg, transparent 160deg, transparent 200deg, rgba(245,158,11,0.7) 240deg, rgba(251,191,36,0.9) 280deg, transparent 320deg)",
                animation: "premiumBorderGold 3.5s linear infinite",
              }} />
            </div>
            {/* Secondary counter-rotating gold accent */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" aria-hidden="true">
              <div style={{
                position: "absolute", inset: "-80%",
                background: "conic-gradient(from 180deg, transparent 0deg, rgba(168,85,247,0.5) 50deg, rgba(251,191,36,0.4) 90deg, transparent 130deg)",
                animation: "premiumBorderGoldRev 5.5s linear infinite",
              }} />
            </div>
            {/* Gold glow bloom */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" aria-hidden="true" style={{
              boxShadow: "0 0 20px 3px rgba(251,191,36,0.3), 0 0 50px 6px rgba(245,158,11,0.15), 0 0 8px 1px rgba(251,191,36,0.2)",
              animation: "premiumGoldPulse 3s ease-in-out infinite",
            }} />
          </>
        ) : (
          /* ── Free: simple static elegant border ──────────── */
          <div className="absolute inset-0 rounded-2xl pointer-events-none" aria-hidden="true" style={{
            border: "1.5px solid rgba(99,102,241,0.2)",
            boxShadow: "0 0 10px 1px rgba(99,102,241,0.06)",
          }} />
        )}

        {/* Card content */}
        <div className="relative rounded-2xl overflow-hidden" style={{ background: isPremium ? "#0a0812" : "#0c0c0e" }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: isPremium ? "#0f0d14" : "#141418" }}>
            <PlusGlowButton onClick={() => {}} />
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={onKey}
              placeholder={isVoiceListening ? "Listening…" : "Ask anything…"}
              className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none"
            />

            {/* Voice-to-text mic button */}
            <button
              onClick={toggleVoiceToText}
              title={isVoiceListening ? "Stop voice input" : "Speak to type"}
              className="flex-shrink-0 p-1.5 rounded-lg transition-all"
              style={isVoiceListening
                ? { color: "#ef4444", background: "rgba(239,68,68,0.12)", animation: "premiumGoldPulse 1s ease-in-out infinite" }
                : { color: isPremium ? "rgba(251,191,36,0.6)" : "rgba(139,92,246,0.7)" }}
            >
              <Mic size={17} />
            </button>

            {/* Send / Voice Orb button */}
            <button
              onClick={inputVal.trim() ? onSend : (onMic ?? onSend)}
              title={inputVal.trim() ? "Send" : "Open voice chat"}
              className="flex-shrink-0 p-1.5 transition-colors rounded-lg hover:bg-white/10"
              style={{ color: isPremium ? "#f59e0b" : "#818cf8" }}
            >
              {inputVal.trim() ? <Send size={18} /> : <Bot size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PremiumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let W = canvas.offsetWidth
    let H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    const NODE_COUNT = 72
    const MAX_DIST = 160
    const COLORS = [
      { hex: "#8b5cf6", rgb: "139,92,246" },
      { hex: "#6366f1", rgb: "99,102,241" },
      { hex: "#a78bfa", rgb: "167,139,250" },
      { hex: "#7c3aed", rgb: "124,58,237" },
      { hex: "#c4b5fd", rgb: "196,181,253" },
      { hex: "#f59e0b", rgb: "245,158,11" },
    ]

    type Node = { x: number; y: number; vx: number; vy: number; r: number; colorIdx: number; phase: number; phaseSpeed: number }
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.8 + 0.8,
      colorIdx: Math.floor(Math.random() * COLORS.length),
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.012 + Math.random() * 0.018,
    }))

    /* Occasional "shooting star" streaks */
    type Streak = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }
    const streaks: Streak[] = []
    let streakTimer = 0

    const spawnStreak = () => {
      const edge = Math.random()
      let x = 0, y = 0, vx = 0, vy = 0
      if (edge < 0.5) { x = Math.random() * W; y = 0; vx = (Math.random() - 0.5) * 3; vy = 1.5 + Math.random() * 2 }
      else { x = 0; y = Math.random() * H; vx = 1.5 + Math.random() * 2; vy = (Math.random() - 0.5) * 3 }
      const maxLife = 60 + Math.random() * 60
      streaks.push({ x, y, vx, vy, life: maxLife, maxLife })
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      /* Streaming star timer */
      streakTimer++
      if (streakTimer > 120 && Math.random() < 0.015) { spawnStreak(); streakTimer = 0 }

      /* Draw streaks */
      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i]
        const alpha = (s.life / s.maxLife) * 0.7
        const tailLen = 60
        const grad = ctx.createLinearGradient(s.x - s.vx * tailLen, s.y - s.vy * tailLen, s.x, s.y)
        grad.addColorStop(0, `rgba(251,191,36,0)`)
        grad.addColorStop(1, `rgba(251,191,36,${alpha})`)
        ctx.beginPath()
        ctx.moveTo(s.x - s.vx * tailLen, s.y - s.vy * tailLen)
        ctx.lineTo(s.x, s.y)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.stroke()
        s.x += s.vx; s.y += s.vy; s.life--
        if (s.life <= 0 || s.x > W + 100 || s.y > H + 100) streaks.splice(i, 1)
      }

      /* Update nodes */
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy; n.phase += n.phaseSpeed
        if (n.x < 0) { n.x = 0; n.vx *= -1 }
        if (n.x > W) { n.x = W; n.vx *= -1 }
        if (n.y < 0) { n.y = 0; n.vy *= -1 }
        if (n.y > H) { n.y = H; n.vy *= -1 }
      }

      /* Draw connections */
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.35
            const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y)
            grad.addColorStop(0, `rgba(139,92,246,${alpha})`)
            grad.addColorStop(1, `rgba(99,102,241,${alpha * 0.6})`)
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = grad
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
      }

      /* Draw nodes */
      for (const n of nodes) {
        const pulse = Math.sin(n.phase) * 0.5 + 0.5
        const r = n.r + pulse * 2
        const alpha = 0.5 + pulse * 0.5
        const { hex, rgb } = COLORS[n.colorIdx]

        /* Glow */
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 5)
        glow.addColorStop(0, `rgba(${rgb},${alpha * 0.45})`)
        glow.addColorStop(1, "rgba(0,0,0,0)")
        ctx.beginPath()
        ctx.arc(n.x, n.y, r * 5, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        /* Core dot */
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.globalAlpha = alpha
        ctx.fillStyle = hex
        ctx.fill()
        ctx.globalAlpha = 1
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    const handleResize = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W
      canvas.height = H
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.65,
      }}
    />
  )
}

function UserCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-gray-500 hover:text-gray-200 transition-colors" style={{ background: "rgba(255,255,255,0.04)" }} title="Copy message">
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

function CopyButton({ text, color }: { text: string; color: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <button onClick={handleCopy} className="p-1 rounded-md transition-colors hover:bg-white/10" style={{ color: copied ? color : "#6b7280" }} title="Copy">
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  )
}

function MarkdownMessage({ text, accentColor, primaryColor }: { text: string; accentColor: string; primaryColor: string }) {
  if (!text) return null

  const renderInline = (raw: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let rest = raw
    let k = 0
    while (rest.length > 0) {
      const bold = rest.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/)
      if (bold && bold[1].length < rest.length) {
        if (bold[1]) parts.push(<span key={k++}>{bold[1]}</span>)
        parts.push(<strong key={k++} style={{ color: "#111", fontWeight: 700 }}>{bold[2]}</strong>)
        rest = bold[3]; continue
      }
      const inlineCode = rest.match(/^([\s\S]*?)`([^`]+)`([\s\S]*)$/)
      if (inlineCode && inlineCode[1].length < rest.length) {
        if (inlineCode[1]) parts.push(<span key={k++}>{inlineCode[1]}</span>)
        parts.push(<code key={k++} style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}44`, borderRadius: 4, padding: "1px 6px", fontFamily: "monospace", fontSize: "0.82em", color: accentColor }}>{inlineCode[2]}</code>)
        rest = inlineCode[3]; continue
      }
      const italic = rest.match(/^([\s\S]*?)\*([^*]+)\*([\s\S]*)$/)
      if (italic && italic[1].length < rest.length) {
        if (italic[1]) parts.push(<span key={k++}>{italic[1]}</span>)
        parts.push(<em key={k++} style={{ color: "#444", fontStyle: "italic" }}>{italic[2]}</em>)
        rest = italic[3]; continue
      }
      parts.push(<span key={k++}>{rest}</span>)
      break
    }
    return parts.length > 0 ? <>{parts}</> : <>{raw}</>
  }

  // Split into blocks, keeping single \n intact within blocks
  const blocks = text.split(/\n{2,}/)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {blocks.map((block, bi) => {
        const trimmed = block.trim()
        if (!trimmed) return null

        // Horizontal rule
        if (/^[-*_]{3,}$/.test(trimmed)) return (
          <hr key={bi} style={{ border: "none", borderTop: `1px solid rgba(139,92,246,0.25)`, margin: "4px 0" }} />
        )

        // Fenced code block
        const cbMatch = trimmed.match(/^```(\w*)\n?([\s\S]*?)```$/)
        if (cbMatch) {
          const lang = cbMatch[1]
          const code = cbMatch[2].replace(/\n$/, "")
          return (
            <div key={bi} style={{ position: "relative" }}>
              {lang && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.15)", borderRadius: "8px 8px 0 0", padding: "4px 12px", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: primaryColor, letterSpacing: "0.08em", textTransform: "uppercase" }}>{lang}</span>
                </div>
              )}
              <pre style={{
                background: "#050508",
                borderRadius: lang ? "0 0 8px 8px" : 8,
                padding: "12px 14px",
                overflowX: "auto",
                border: "1px solid rgba(139,92,246,0.2)",
                borderTop: lang ? "none" : undefined,
                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                fontSize: 12.5,
                color: "#e2e8f0",
                lineHeight: 1.65,
                margin: 0,
              }}>
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        const lines = trimmed.split("\n")

        // Blockquote
        if (lines.every(l => l.startsWith("> "))) return (
          <blockquote key={bi} style={{
            borderLeft: `3px solid ${primaryColor}`,
            paddingLeft: 14,
            margin: 0,
            color: "#444",
            fontStyle: "italic",
            background: `${primaryColor}0d`,
            borderRadius: "0 6px 6px 0",
            padding: "8px 8px 8px 14px",
          }}>
            {lines.map((l, li) => (
              <p key={li} style={{ margin: 0, lineHeight: 1.7 }}>{renderInline(l.replace(/^> /, ""))}</p>
            ))}
          </blockquote>
        )

        // H1
        const h1 = trimmed.match(/^# (.+)/)
        if (h1) return (
          <div key={bi}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "4px 0 6px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {renderInline(h1[1])}
            </h1>
            <div style={{ height: 2, background: `linear-gradient(to right, ${primaryColor}, transparent)`, borderRadius: 2, marginBottom: 2 }} />
          </div>
        )

        // H2
        const h2 = trimmed.match(/^## (.+)/)
        if (h2) return (
          <div key={bi}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#222", margin: "2px 0 4px", lineHeight: 1.3 }}>
              {renderInline(h2[1])}
            </h2>
            <div style={{ height: 1, background: `linear-gradient(to right, ${primaryColor}88, transparent)`, borderRadius: 1 }} />
          </div>
        )

        // H3
        const h3 = trimmed.match(/^### (.+)/)
        if (h3) return (
          <h3 key={bi} style={{ fontSize: 14, fontWeight: 700, color: primaryColor, margin: "2px 0", lineHeight: 1.3 }}>
            {renderInline(h3[1])}
          </h3>
        )

        // H4
        const h4 = trimmed.match(/^#### (.+)/)
        if (h4) return (
          <h4 key={bi} style={{ fontSize: 13, fontWeight: 600, color: accentColor, margin: "2px 0", lineHeight: 1.3 }}>
            {renderInline(h4[1])}
          </h4>
        )

        // Bullet list (mixed single-line bullets in one block)
        if (lines.length > 0 && lines.every(l => /^[-*•]\s/.test(l.trim()))) return (
          <ul key={bi} style={{ padding: 0, margin: 0, listStyleType: "none", display: "flex", flexDirection: "column", gap: 5 }}>
            {lines.map((l, li) => (
              <li key={li} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <span style={{ color: primaryColor, flexShrink: 0, marginTop: 1, fontSize: 14 }}>▸</span>
                <span style={{ color: "#222", lineHeight: 1.65 }}>{renderInline(l.trim().replace(/^[-*•]\s/, ""))}</span>
              </li>
            ))}
          </ul>
        )

        // Numbered list
        if (lines.length > 0 && lines.every(l => /^\d+\.\s/.test(l.trim()))) return (
          <ol key={bi} style={{ padding: 0, margin: 0, listStyleType: "none", display: "flex", flexDirection: "column", gap: 5 }}>
            {lines.map((l, li) => (
              <li key={li} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <span style={{ color: primaryColor, flexShrink: 0, fontWeight: 700, fontSize: 13, minWidth: 22, marginTop: 1 }}>{li + 1}.</span>
                <span style={{ color: "#222", lineHeight: 1.65 }}>{renderInline(l.trim().replace(/^\d+\.\s/, ""))}</span>
              </li>
            ))}
          </ol>
        )

        // Paragraph
        return (
          <p key={bi} style={{ margin: 0, lineHeight: 1.8, color: "#1a1a1a", fontSize: 13.5 }}>
            {lines.map((l, li) => (
              <React.Fragment key={li}>
                {renderInline(l)}
                {li < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function MoreGlowButton() {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "7px 13px",
        borderRadius: 999,
        background: hovered
          ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
          : "linear-gradient(135deg, rgba(124,58,237,0.55), rgba(59,130,246,0.55))",
        border: hovered
          ? "1px solid rgba(200,180,255,0.8)"
          : "1px solid rgba(167,139,250,0.55)",
        color: "#fff",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: hovered
          ? "0 0 18px rgba(139,92,246,0.75), 0 0 40px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.25)"
          : "0 0 10px rgba(139,92,246,0.45), 0 0 22px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      <MoreHorizontal size={14} />
    </button>
  )
}

function SuggestionPill({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 15px",
        borderRadius: 999,
        background: hovered
          ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
          : "linear-gradient(135deg, rgba(124,58,237,0.55), rgba(59,130,246,0.55))",
        border: hovered
          ? "1px solid rgba(200,180,255,0.8)"
          : "1px solid rgba(167,139,250,0.55)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: hovered
          ? "0 0 18px rgba(139,92,246,0.75), 0 0 40px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.25)"
          : "0 0 10px rgba(139,92,246,0.45), 0 0 22px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.85)" }}>{icon}</span>
      {label}
    </button>
  )
}

const VOICE_EN_CONFIG = {
  recLang: "en-US",
  ttsLangPrefix: ["en"],
  systemPrompt: "",
}

const FEMALE_VOICES = [
  "Samantha", "Karen", "Victoria", "Moira", "Fiona",
  "Google UK English Female", "Microsoft Aria Online (Natural)",
  "Microsoft Jenny Online (Natural)", "Microsoft Zira", "Google US English",
]
const MALE_VOICES = [
  "Google UK English Male", "Microsoft Guy Online (Natural)",
  "Microsoft Mark Online (Natural)", "Microsoft David Online (Natural)",
  "Daniel", "Oliver", "Thomas", "Alex", "Fred",
  "Google US English Male",
]


function cleanForSpeech(text: string): string {
  // Remove all emoji and symbol unicode blocks
  text = text.replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
  text = text.replace(/[\u{2300}-\u{27BF}]/gu, "")
  text = text.replace(/[\u{2B00}-\u{2BFF}]/gu, "")
  text = text.replace(/[\u{FE00}-\u{FEFF}]/gu, "")
  text = text.replace(/[\u{E0000}-\u{E007F}]/gu, "")
  // Remove markdown headings
  text = text.replace(/^#{1,6}\s+/gm, "")
  // Remove bold/italic (preserve inner text)
  text = text.replace(/\*{1,3}([^*\n]*)\*{1,3}/g, "$1")
  text = text.replace(/_{1,2}([^_\n]*)_{1,2}/g, "$1")
  // Remove inline code and code blocks
  text = text.replace(/```[\s\S]*?```/g, "")
  text = text.replace(/`[^`]*`/g, "")
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, ".")
  // Remove bullet/list prefixes
  text = text.replace(/^\s*[-*+>]\s+/gm, "")
  text = text.replace(/^\s*\d+[.)]\s+/gm, "")
  // Remove common special chars TTS reads badly
  text = text.replace(/[♂♀✦★☆⚡◆▸▶→←↑↓•·–—|\\/<>[\]{}@#$%^&]/g, " ")
  // Remove stray asterisks, hashes, underscores
  text = text.replace(/[*#_~]/g, "")
  // Collapse multiple newlines into a pause
  text = text.replace(/\n{2,}/g, ". ")
  text = text.replace(/\n/g, " ")
  // Collapse multiple spaces/punctuation
  text = text.replace(/\.{2,}/g, ".")
  text = text.replace(/\s{2,}/g, " ")
  return text.trim()
}

function AIVoiceOrbOverlay({
  beatRef,
  beatPulse,
  onClose,
  plan,
}: {
  beatRef: React.MutableRefObject<{ intensity: number }>
  beatPulse: number
  onClose: () => void
  plan: "free" | "premium"
}) {
  const isPremium = plan === "premium"
  const WAVE_BARS = 28
  const [voiceGender, setVoiceGender] = useState<"male" | "female" | null>(null)
  const [showVoiceSwitcher, setShowVoiceSwitcher] = useState(false)
  const [localStatus, setLocalStatus] = useState<"listening" | "thinking" | "speaking">("listening")
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const isActiveRef = useRef(true)
  const sendQueryExternalRef = useRef<((text: string) => void) | null>(null)

  useEffect(() => {
    if (!voiceGender) return
    isActiveRef.current = true
    let recognition: any = null
    const cfg = VOICE_EN_CONFIG

    function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
      const preferred = voiceGender === "female" ? FEMALE_VOICES : MALE_VOICES
      for (const name of preferred) {
        const v = voices.find(vv => vv.name.includes(name))
        if (v) return v
      }
      const keyword = voiceGender === "female" ? "female" : "male"
      const byKeyword = voices.find(vv => vv.name.toLowerCase().includes(keyword))
        ?? voices.find(vv => vv.lang.toLowerCase().startsWith("en"))
      if (byKeyword) return byKeyword
      return voices[0] ?? null
    }

    function speakResponse(text: string) {
      if (!isActiveRef.current) return
      const cleanText = cleanForSpeech(text)
      setLocalStatus("speaking")
      setAiText(text)

      if (!window.speechSynthesis) { setTimeout(listen, 300); return }
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(cleanText)
      utt.lang = cfg.recLang

      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices()
        const picked = pickVoice(voices)
        if (picked) utt.voice = picked
        if (voiceGender === "male") { utt.rate = 0.90; utt.pitch = 0.85; utt.volume = 1.0 }
        else { utt.rate = 0.88; utt.pitch = 1.08; utt.volume = 1.0 }
        utt.onend = () => { if (isActiveRef.current) setTimeout(listen, 600) }
        utt.onerror = () => { if (isActiveRef.current) setTimeout(listen, 600) }
        window.speechSynthesis.speak(utt)
      }

      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) trySpeak()
      else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null
          trySpeak()
        }
      }
    }

    async function sendQuery(text: string) {
      if (!isActiveRef.current) return
      setLocalStatus("thinking")
      setUserText(text)
      setAiText("")

      await new Promise(r => setTimeout(r, 900 + Math.random() * 700))

      if (!isActiveRef.current) return
      const reply = AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)]
      speakResponse(reply)
    }

    sendQueryExternalRef.current = sendQuery

    function listen() {
      if (!isActiveRef.current) return
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) { setLocalStatus("listening"); return }

      if (recognition) { try { recognition.abort() } catch {} recognition = null }

      let transcriptText = ""
      setLocalStatus("listening")
      setUserText("")

      const rec = new SR()
      recognition = rec
      rec.continuous = false
      rec.interimResults = true
      rec.lang = cfg.recLang

      rec.onresult = (e: any) => {
        let t = ""
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
        transcriptText = t
        setUserText(t)
      }

      rec.onend = () => {
        if (!isActiveRef.current) return
        if (transcriptText.trim()) {
          setTimeout(() => { if (isActiveRef.current) sendQuery(transcriptText) }, 900)
        } else {
          setTimeout(listen, 600)
        }
      }

      rec.onerror = (e: any) => {
        if (!isActiveRef.current) return
        if (e.error === "not-allowed") return
        setTimeout(() => { if (isActiveRef.current) listen() }, 800)
      }

      try { rec.start() } catch {}
    }

    listen()

    return () => {
      isActiveRef.current = false
      if (recognition) { try { recognition.abort() } catch {} }
      window.speechSynthesis?.cancel()
    }
  }, [voiceGender])

  const waveDelays = Array.from({ length: WAVE_BARS }, (_, i) => {
    const center = (WAVE_BARS - 1) / 2
    const dist = Math.abs(i - center) / center
    return 0.05 + dist * 0.55
  })

  const statusConfig = isPremium ? {
    listening: { label: "Listening",  ringColor: "rgba(251,191,36,",  textColor: "#fbbf24", dotClass: "bg-amber-400",   ringDur: "2.4s" },
    thinking:  { label: "Thinking",   ringColor: "rgba(251,146,60,",  textColor: "#fb923c", dotClass: "bg-orange-400",  ringDur: "3.5s" },
    speaking:  { label: "Speaking",   ringColor: "rgba(234,179,8,",   textColor: "#eab308", dotClass: "bg-yellow-400",  ringDur: "1.4s" },
  } : {
    listening: { label: "Listening",  ringColor: "rgba(139,92,246,",  textColor: "#a78bfa", dotClass: "bg-indigo-400",  ringDur: "2.4s" },
    thinking:  { label: "Thinking",   ringColor: "rgba(251,191,36,",  textColor: "#fbbf24", dotClass: "bg-amber-400",   ringDur: "3.5s" },
    speaking:  { label: "Speaking",   ringColor: "rgba(52,211,153,",  textColor: "#34d399", dotClass: "bg-emerald-400", ringDur: "1.4s" },
  }
  const sc = statusConfig[localStatus]

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: isPremium
          ? "linear-gradient(160deg, rgba(10,8,4,0.96) 0%, rgba(20,14,4,0.95) 50%, rgba(6,6,10,0.96) 100%)"
          : "rgba(6,6,10,0.92)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        animation: "voiceOverlayIn 0.35s ease forwards",
      }}
    >
      {isPremium && (
        <div className="absolute inset-0 rounded-none pointer-events-none" style={{
          boxShadow: "inset 0 0 80px rgba(251,191,36,0.04), inset 0 1px 0 rgba(251,191,36,0.12)",
        }} />
      )}

      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full border transition-colors"
        style={isPremium
          ? { background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)", color: "#d4a" }
          : { background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)", color: "#9ca3af" }}
      >
        <X size={18} />
      </button>

      <div className="absolute top-5 left-0 right-0 flex justify-center">
        {isPremium ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border"
            style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.25)", boxShadow: "0 0 20px rgba(251,191,36,0.1)" }}>
            <span className="text-amber-400 text-xs">♛</span>
            <span className="text-xs font-semibold tracking-wide" style={{ color: "#fbbf24" }}>QuantuMania Premium Voice</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <Cpu size={12} className="text-indigo-400" />
            <span className="text-xs font-medium text-indigo-300 tracking-wide">QuantuMania Voice</span>
          </div>
        )}
      </div>

      {!voiceGender && (
        <div className="flex flex-col items-center gap-6 px-6" style={{ animation: "voiceOrbIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards" }}>
          <div className="text-center">
            {isPremium && <div className="text-amber-400 text-2xl mb-2">♛</div>}
            <p className="text-white text-lg font-semibold mb-1">Choose a voice</p>
            <p className="text-gray-500 text-sm">Select the voice you'd like to talk with</p>
          </div>
          <div className="flex gap-5">
            <button
              onClick={() => setVoiceGender("female")}
              className="group flex flex-col items-center gap-3 px-10 py-7 rounded-2xl border transition-all"
              style={isPremium
                ? { background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)" }
                : { background: "rgba(236,72,153,0.08)", borderColor: "rgba(236,72,153,0.25)" }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
                style={isPremium
                  ? { background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }
                  : { background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.3)", color: "#f9a8d4" }}>♀</div>
              <span className="font-semibold text-sm tracking-wide" style={{ color: isPremium ? "#fbbf24" : "#f9a8d4" }}>Female</span>
            </button>
            <button
              onClick={() => setVoiceGender("male")}
              className="group flex flex-col items-center gap-3 px-10 py-7 rounded-2xl border transition-all"
              style={isPremium
                ? { background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)" }
                : { background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.25)" }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
                style={isPremium
                  ? { background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }
                  : { background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}>♂</div>
              <span className="font-semibold text-sm tracking-wide" style={{ color: isPremium ? "#fbbf24" : "#93c5fd" }}>Male</span>
            </button>
          </div>
        </div>
      )}

      {voiceGender && (
        <>
          <div className="absolute top-14 left-0 right-0 flex justify-center">
            <button
              onClick={() => setShowVoiceSwitcher(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-80 active:scale-95"
              style={isPremium
                ? { background: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.3)", color: "#fbbf24" }
                : voiceGender === "female"
                ? { background: "rgba(236,72,153,0.1)", borderColor: "rgba(236,72,153,0.25)", color: "#f9a8d4" }
                : { background: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.25)", color: "#93c5fd" }}
            >
              {isPremium && <span className="mr-0.5">♛</span>}
              {voiceGender === "female" ? "♀ Female voice" : "♂ Male voice"}
              <span className="ml-0.5 opacity-60">⇅</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center" style={{ animation: "voiceOrbIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards" }}>
            <div className="voice-ring-1 absolute rounded-full pointer-events-none"
              style={{ width: 300, height: 300, border: `1.5px solid ${sc.ringColor}0.55)`, animationDuration: sc.ringDur }} />
            <div className="voice-ring-2 absolute rounded-full pointer-events-none"
              style={{ width: 300, height: 300, border: `1.5px solid ${sc.ringColor}0.4)`, animationDuration: sc.ringDur }} />
            <div className="voice-ring-3 absolute rounded-full pointer-events-none"
              style={{ width: 300, height: 300, border: `1px solid ${sc.ringColor}0.3)`, animationDuration: sc.ringDur }} />
            <div className="voice-ring-4 absolute rounded-full pointer-events-none"
              style={{ width: 300, height: 300, border: `1px solid ${sc.ringColor}0.18)`, animationDuration: sc.ringDur }} />
            <div className="absolute rounded-full pointer-events-none"
              style={{
                width: 340, height: 340,
                background: isPremium
                  ? "radial-gradient(circle, rgba(251,191,36,0.18) 0%, rgba(234,179,8,0.08) 50%, transparent 70%)"
                  : "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)",
              }} />
            <div className="orb-voice-pulse">
              <OrbWrapper beatPulse={beatPulse} beatRef={beatRef} size={220} floats />
            </div>
          </div>

          <div className="mt-5 px-10 text-center max-w-sm" style={{ minHeight: 44 }}>
            {localStatus === "listening" && userText && <p className="text-sm text-gray-300 italic leading-relaxed">"{userText}"</p>}
            {localStatus === "listening" && !userText && <p className="text-xs text-gray-600 tracking-wide">Say anything to start…</p>}
            {localStatus === "thinking" && userText && <p className="text-sm text-gray-400 leading-relaxed">"{userText}"</p>}
            {localStatus === "speaking" && aiText && <p className="text-sm text-gray-200 leading-relaxed line-clamp-3">{aiText}</p>}
          </div>

          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-light tracking-widest" style={{ color: sc.textColor }}>{sc.label}</span>
              {localStatus !== "thinking" ? (
                <>
                  <span className={`status-dot w-1 h-1 rounded-full ${sc.dotClass} inline-block`} />
                  <span className={`status-dot w-1 h-1 rounded-full ${sc.dotClass} inline-block`} />
                  <span className={`status-dot w-1 h-1 rounded-full ${sc.dotClass} inline-block`} />
                </>
              ) : (
                <span className="flex gap-1 ml-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1 h-1 rounded-full bg-amber-400 inline-block typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </span>
              )}
            </div>

            <div className="flex items-end gap-[3px]" style={{ height: 32 }}>
              {waveDelays.map((delay, i) => {
                const listeningColor = `rgba(${i % 3 === 0 ? "139,92,246" : i % 3 === 1 ? "99,102,241" : "6,182,212"},0.8)`
                const thinkingColor  = `rgba(251,191,36,${0.2 + (i / WAVE_BARS) * 0.35})`
                const speakingColor  = `rgba(${i % 3 === 0 ? "52,211,153" : i % 3 === 1 ? "99,102,241" : "139,92,246"},0.9)`
                const barColor = localStatus === "thinking" ? thinkingColor : localStatus === "speaking" ? speakingColor : listeningColor
                const dur = localStatus === "speaking" ? 0.38 + (i % 5) * 0.07 : 0.7 + (i % 5) * 0.12
                return (
                  <div key={i} style={{
                    width: 3, height: 28, borderRadius: 4,
                    background: barColor,
                    transformOrigin: "bottom",
                    animation: `waveBar ${dur}s ease-in-out ${delay}s infinite`,
                    opacity: localStatus === "thinking" ? 0.45 : 1,
                  }} />
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            {showVoiceSwitcher ? (
              <div className="flex items-center gap-2 p-2 rounded-2xl border backdrop-blur-sm"
                style={isPremium
                  ? { background: "rgba(20,14,4,0.8)", borderColor: "rgba(251,191,36,0.2)" }
                  : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
                {([
                  { id: "female" as const, icon: "♀", label: "Female" },
                  { id: "male"   as const, icon: "♂", label: "Male" },
                ]).map(v => (
                  <button key={v.id}
                    onClick={() => { setVoiceGender(v.id); setShowVoiceSwitcher(false) }}
                    className="flex flex-col items-center gap-1 px-6 py-2.5 rounded-xl transition-all"
                    style={voiceGender === v.id
                      ? isPremium
                        ? { background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.5)", color: "#fbbf24" }
                        : { background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.5)", color: "#a78bfa" }
                      : { background: "transparent", border: "1px solid transparent", color: "#4b5563" }}>
                    <span className="text-lg leading-none">{v.icon}</span>
                    <span className="text-xs font-medium">{v.label}</span>
                  </button>
                ))}
                <button onClick={() => setShowVoiceSwitcher(false)}
                  className="ml-1 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-xs text-gray-500 hover:text-gray-300">✕</button>
              </div>
            ) : (
              <button onClick={() => setShowVoiceSwitcher(true)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium transition-all"
                style={isPremium
                  ? { background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)", color: "#92400e" }
                  : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#6b7280" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2h8v2H4zm-2 4h12v2H2zm2 4h8v2H4z"/></svg>
                <span style={isPremium ? { color: "#d97706" } : {}}>Switch voice</span>
              </button>
            )}

            <button onClick={onClose}
              className="flex items-center gap-2.5 px-7 py-3 rounded-full border text-sm font-medium transition-all"
              style={isPremium
                ? { background: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.25)", color: "#d97706" }
                : { background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.3)", color: "#c7d2fe" }}>
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: isPremium ? "#d97706" : "#818cf8" }} />
              End voice chat
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function UpgradeModal({
  plan,
  dailyCount,
  onClose,
  onUpgrade,
  onDowngrade,
}: {
  plan: Plan
  dailyCount: number
  onClose: () => void
  onUpgrade: () => void
  onDowngrade: () => void
}) {
  const freeFeatures = [
    { icon: <MessageCircle size={13} />, text: `${FREE_MSG_LIMIT} messages per day`, sub: `${dailyCount}/${FREE_MSG_LIMIT} used today` },
    { icon: <Zap size={13} />, text: "Basic AI model", sub: "Standard" },
    { icon: <Image size={13} />, text: `${FREE_IMG_LIMIT} photo generations/day`, sub: "Limited" },
    { icon: <Upload size={13} />, text: `${FREE_FILE_LIMIT} file uploads/day`, sub: "Limited" },
    { icon: <MessageSquare size={13} />, text: "Short responses", sub: "Concise answers" },
  ]

  const premiumFeatures = [
    { icon: <Infinity size={13} />, text: "Unlimited messages", sub: "No daily cap" },
    { icon: <Brain size={13} />, text: "Advanced AI model", sub: "Premium" },
    { icon: <Image size={13} />, text: "Unlimited photo generation", sub: "No limits" },
    { icon: <Upload size={13} />, text: "Unlimited file uploads", sub: "All formats" },
    { icon: <Sparkles size={13} />, text: "Detailed long answers", sub: "In-depth responses" },
    { icon: <Zap size={13} />, text: "Priority fast response", sub: "No waiting" },
    { icon: <Star size={13} />, text: "Memory & context", sub: "Remembers you" },
  ]

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(4,4,8,0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden" style={{ background: "#0d0d12", border: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-gray-500 hover:text-white transition-colors z-10">
          <X size={16} />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Crown size={12} className="text-amber-400" />
            <span className="text-xs text-amber-300 font-medium tracking-wide">QuantuMania Plans</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Unlock Your Full Potential</h2>
          <p className="text-sm text-gray-400">Choose the plan that's right for you</p>
        </div>

        {/* Cards */}
        <div className="p-6 grid grid-cols-2 gap-4">

          {/* Free Card */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">Free</h3>
              {plan === "free" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-medium">Current</span>
              )}
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">$0<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <p className="text-[10px] text-gray-600 mb-4">Forever free</p>

            <div className="space-y-2.5">
              {freeFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5 text-indigo-400">{f.icon}</div>
                  <div>
                    <p className="text-xs text-gray-300">{f.text}</p>
                    <p className="text-[10px] text-gray-600">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {plan === "free" ? (
              <div className="mt-5 h-9 flex items-center justify-center rounded-xl text-xs text-gray-500 border border-white/[0.06]">
                Your current plan
              </div>
            ) : (
              <button
                onClick={onDowngrade}
                className="mt-5 w-full h-9 flex items-center justify-center gap-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04] transition-all"
              >
                Switch to Free plan
              </button>
            )}
          </div>

          {/* Premium Card */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(234,88,12,0.08) 100%)", border: "1px solid rgba(251,191,36,0.2)" }}>
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 70% 20%, rgba(251,191,36,0.08) 0%, transparent 60%)" }} />

            <div className="flex items-center justify-between mb-1 relative">
              <div className="flex items-center gap-1.5">
                <Crown size={14} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Premium</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/20 text-amber-400 font-medium">Best Value</span>
            </div>
            <p className="text-2xl font-bold text-white mb-0.5 relative">
              $9.99<span className="text-sm font-normal text-gray-400">/mo</span>
            </p>
            <p className="text-[10px] text-amber-600/70 mb-4 relative">Billed monthly</p>

            <div className="space-y-2.5 relative">
              {premiumFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <p className="text-xs text-gray-200">{f.text}</p>
                    <p className="text-[10px] text-gray-500">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {plan === "premium" ? (
              <div className="mt-5 h-9 flex items-center justify-center rounded-xl text-xs text-amber-400 font-medium border border-amber-500/30 relative" style={{ background: "rgba(251,191,36,0.08)" }}>
                <Crown size={12} className="mr-1.5" /> Active Plan
              </div>
            ) : (
              <button
                onClick={onUpgrade}
                className="relative mt-5 w-full h-9 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)", boxShadow: "0 4px 24px rgba(251,191,36,0.3)" }}
              >
                <Crown size={13} />
                Get Premium — $9.99/mo
              </button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="px-8 pb-6 text-center">
          <p className="text-[11px] text-gray-600">
            Premium access is instant after payment.{" "}
            <span className="text-indigo-400">Contact support</span> if you have any questions.
          </p>
        </div>
      </div>
    </div>
  )
}

