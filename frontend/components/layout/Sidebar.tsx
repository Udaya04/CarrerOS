"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  Target,
  Bot,
  Briefcase,
  Map,
  PenLine,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/ats", label: "ATS Checker", icon: FileText },
  { href: "/dashboard/quiz", label: "Quiz Engine", icon: Target },
  { href: "/dashboard/interview", label: "Mock Interview", icon: Bot },
  { href: "/dashboard/jobs", label: "Job Board", icon: Briefcase },
  { href: "/dashboard/roadmap", label: "Roadmap", icon: Map },
  { href: "/dashboard/blog", label: "Blog", icon: PenLine },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#0D1F0D] text-white p-2 rounded-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-60 bg-[#0D1F0D] flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <Link href="/" className="flex items-center gap-2 px-5 pt-5 pb-6">
          <GraduationCap className="w-6 h-6 text-[#C8FF00]" />
          <span className="text-white font-bold text-lg">CareerOS</span>
        </Link>

        <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-[#C8FF00]/10 text-[#C8FF00] border-l-[3px] border-[#C8FF00]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#C8FF00] flex items-center justify-center text-[#0D1F0D] font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">
                {user?.full_name || "User"}
              </p>
              <p className="text-white/40 text-xs truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 mt-3 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
