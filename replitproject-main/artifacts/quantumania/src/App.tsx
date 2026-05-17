import { useState, useCallback } from "react"
import { Route, Switch } from "wouter"
import Home from "@/pages/home"
import NotFound from "@/pages/not-found"
import AuthPage from "@/pages/auth"
import GuestLimitNotif from "@/components/GuestLimitNotif"
import { IntroScreen } from "@/components/IntroScreen"
import { AuthProvider, useAuth } from "@/context/AuthContext"

function AppInner() {
  const { authState, showAuthModal } = useAuth()
  const [introDone, setIntroDone] = useState(false)
  const handleIntroDone = useCallback(() => setIntroDone(true), [])

  if (!introDone) {
    return <IntroScreen onDone={handleIntroDone} />
  }

  if (authState.status === "unauthenticated" || showAuthModal) {
    return <AuthPage />
  }

  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
      <GuestLimitNotif />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
