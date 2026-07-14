"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Bell, User, Settings, LogOut, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/ats": "ATS Checker",
  "/dashboard/quiz": "Quiz Engine",
  "/dashboard/interview": "Mock Interview",
  "/dashboard/jobs": "Job Board",
  "/dashboard/roadmap": "Roadmap",
  "/dashboard/blog": "Blog",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const title =
    Object.entries(pageTitles).find(([key]) =>
      key === "/dashboard" ? pathname === key : pathname.startsWith(key)
    )?.[1] || "Dashboard"

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 lg:px-8">
      <h1 className="text-xl font-bold text-[#0D1F0D]">{title}</h1>

      <div className="flex items-center gap-4">
        <button className="text-[#6B7280] hover:text-[#0D1F0D] transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#0D1F0D] flex items-center justify-center text-white font-bold text-xs">
              {initials}
            </div>
            <ChevronDown className="w-4 h-4 text-[#6B7280] hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-2">
              <div className="px-4 py-2 border-b border-[#E5E7EB]">
                <p className="text-sm font-medium text-[#0D1F0D] truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-[#6B7280] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { router.push("/dashboard/profile"); setDropdownOpen(false) }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B5563] hover:bg-[#F3F4F6] w-full transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => { router.push("/dashboard/settings"); setDropdownOpen(false) }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B5563] hover:bg-[#F3F4F6] w-full transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B5563] hover:bg-[#F3F4F6] w-full transition-colors border-t border-[#E5E7EB] mt-1 pt-3"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
