import { Link, useLocation } from "wouter";
import {
  BarChart2, Mail, Phone, Briefcase, FileText,
  Brain, Clock, Calendar, MessageSquare, Menu, X
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/", icon: MessageSquare, label: "AI Chat", color: "text-purple-400" },
  { path: "/hr-dashboard", icon: BarChart2, label: "HR Dashboard", color: "text-blue-400" },
  { path: "/email-automation", icon: Mail, label: "Email Automation", color: "text-pink-400" },
  { path: "/call-automation", icon: Phone, label: "Call Automation", color: "text-cyan-400" },
  { path: "/job-posting", icon: Briefcase, label: "Post Automation", color: "text-orange-400" },
  { path: "/ats-filtering", icon: FileText, label: "ATS / Resumes", color: "text-indigo-400" },
  { path: "/interviews", icon: Brain, label: "AI Interviews", color: "text-teal-400" },
  { path: "/attendance", icon: Clock, label: "Attendance", color: "text-green-400" },
  { path: "/leave-management", icon: Calendar, label: "Leave Management", color: "text-yellow-400" },
];

export function CompanyNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-sm rounded-lg md:hidden"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-56 bg-[#0d0d15] border-r border-white/10 z-40 flex flex-col pt-4 transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="px-4 py-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <span className="font-semibold text-white text-sm">Company AI</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2">
          {navItems.map(({ path, icon: Icon, label, color }) => {
            const active = location === path;
            return (
              <Link key={path} href={path} onClick={() => setOpen(false)}>
                <a
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all ${
                    active
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  }`}
                >
                  <Icon size={16} className={active ? color : ""} />
                  {label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-white/20 text-[10px]">Powered by Gemini AI</p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
