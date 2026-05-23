import { useState, useCallback } from "react"
import { Route, Switch } from "wouter"
import Home from "@/pages/home"
import NotFound from "@/pages/not-found"
import AuthPage from "@/pages/auth"
import HRDashboard from "@/pages/hr-dashboard"
import EmailAutomation from "@/pages/email-automation"
import CallAutomation from "@/pages/call-automation"
import JobPosting from "@/pages/job-posting"
import ATSFiltering from "@/pages/ats-filtering"
import Interviews from "@/pages/interviews"
import Attendance from "@/pages/attendance"
import LeaveManagement from "@/pages/leave-management"
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
        <Route path="/hr-dashboard" component={HRDashboard} />
        <Route path="/email-automation" component={EmailAutomation} />
        <Route path="/call-automation" component={CallAutomation} />
        <Route path="/job-posting" component={JobPosting} />
        <Route path="/ats-filtering" component={ATSFiltering} />
        <Route path="/interviews" component={Interviews} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/leave-management" component={LeaveManagement} />
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
