import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

export type AuthUser = {
  id: string
  name: string
  email: string
}

type AuthState =
  | { status: "unauthenticated" }
  | { status: "guest"; messagesUsed: number }
  | { status: "authenticated"; user: AuthUser }

const GUEST_MSG_LIMIT = 4
const AUTH_KEY = "qm_auth_user"
const GUEST_KEY = "qm_guest_msgs"

function loadAuthState(): AuthState {
  try {
    const user = localStorage.getItem(AUTH_KEY)
    if (user) return { status: "authenticated", user: JSON.parse(user) }
    const guestRaw = localStorage.getItem(GUEST_KEY)
    if (guestRaw) {
      const { messagesUsed } = JSON.parse(guestRaw)
      return { status: "guest", messagesUsed: messagesUsed || 0 }
    }
  } catch {}
  return { status: "unauthenticated" }
}

type AuthContextType = {
  authState: AuthState
  guestMsgLimit: number
  signUp: (name: string, email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  continueAsGuest: () => void
  incrementGuestMessages: () => boolean
  showAuthModal: boolean
  setShowAuthModal: (v: boolean) => void
  showLimitNotif: boolean
  setShowLimitNotif: (v: boolean) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(loadAuthState)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showLimitNotif, setShowLimitNotif] = useState(false)

  useEffect(() => {
    if (authState.status === "unauthenticated") {
      setShowAuthModal(true)
    }
  }, [authState.status])

  const signUp = useCallback(async (name: string, email: string, _password: string) => {
    const user: AuthUser = { id: crypto.randomUUID(), name, email }
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    localStorage.removeItem(GUEST_KEY)
    setAuthState({ status: "authenticated", user })
    setShowAuthModal(false)
  }, [])

  const signIn = useCallback(async (email: string, _password: string) => {
    const existing = localStorage.getItem(AUTH_KEY)
    let user: AuthUser
    if (existing) {
      user = JSON.parse(existing)
      if (user.email !== email) {
        user = { id: crypto.randomUUID(), name: email.split("@")[0], email }
      }
    } else {
      user = { id: crypto.randomUUID(), name: email.split("@")[0], email }
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    setAuthState({ status: "authenticated", user })
    setShowAuthModal(false)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(GUEST_KEY)
    setAuthState({ status: "unauthenticated" })
    setShowAuthModal(true)
  }, [])

  const continueAsGuest = useCallback(() => {
    const state = { messagesUsed: 0 }
    localStorage.setItem(GUEST_KEY, JSON.stringify(state))
    setAuthState({ status: "guest", messagesUsed: 0 })
    setShowAuthModal(false)
  }, [])

  const incrementGuestMessages = useCallback((): boolean => {
    if (authState.status !== "guest") return true
    const next = authState.messagesUsed + 1
    localStorage.setItem(GUEST_KEY, JSON.stringify({ messagesUsed: next }))
    setAuthState({ status: "guest", messagesUsed: next })
    if (next >= GUEST_MSG_LIMIT) {
      setTimeout(() => setShowLimitNotif(true), 800)
    }
    return true
  }, [authState])

  return (
    <AuthContext.Provider value={{
      authState,
      guestMsgLimit: GUEST_MSG_LIMIT,
      signUp,
      signIn,
      signOut,
      continueAsGuest,
      incrementGuestMessages,
      showAuthModal,
      setShowAuthModal,
      showLimitNotif,
      setShowLimitNotif,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export { GUEST_MSG_LIMIT }
