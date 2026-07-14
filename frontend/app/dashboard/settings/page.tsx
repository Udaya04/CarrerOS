"use client"

import { useState, useEffect } from "react"
import {
  Lock,
  Bell,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react"
import { changePassword } from "@/lib/auth"

interface Notifications {
  quiz_reminders: boolean
  interview_feedback: boolean
  job_alerts: boolean
}

const NOTIF_KEY = "careeros_notification_prefs"

function loadNotifs(): Notifications {
  if (typeof window === "undefined") return { quiz_reminders: true, interview_feedback: true, job_alerts: true }
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    return raw ? JSON.parse(raw) : { quiz_reminders: true, interview_feedback: true, job_alerts: true }
  } catch {
    return { quiz_reminders: true, interview_feedback: true, job_alerts: true }
  }
}

function saveNotifs(n: Notifications) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(n))
}

const notifLabels: Record<keyof Notifications, string> = {
  quiz_reminders: "Quiz reminders",
  interview_feedback: "Interview feedback reports",
  job_alerts: "New job alerts",
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? "bg-[#0D1F0D]" : "bg-[#E5E7EB]"
      }`}
    >
      <span
        className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<"password" | "notifications" | "danger">("password")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [notifs, setNotifs] = useState<Notifications>(loadNotifs)

  useEffect(() => {
    saveNotifs(notifs)
  }, [notifs])

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }
    setSavingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(false)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to change password."
      setPasswordError(msg)
    } finally {
      setSavingPassword(false)
    }
  }

  const tabs = [
    { key: "password" as const, label: "Password", icon: Lock },
    { key: "notifications" as const, label: "Notifications", icon: Bell },
    { key: "danger" as const, label: "Danger Zone", icon: AlertTriangle },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#0D1F0D]">Settings</h1>
        <p className="text-[#6B7280] text-sm mt-1">Manage your account preferences</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition ${
                tab === t.key
                  ? "bg-[#0D1F0D] text-white"
                  : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#0D1F0D]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === "password" && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#4B5563] mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={savingPassword}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 pr-10 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
              />
              <button
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#0D1F0D]"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={savingPassword}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 pr-10 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
              />
              <button
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#0D1F0D]"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={savingPassword}
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
            />
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Password changed successfully
            </div>
          )}

          <button
            onClick={handlePasswordChange}
            disabled={!currentPassword || !newPassword || !confirmPassword || savingPassword}
            className="w-full bg-[#0D1F0D] text-white rounded-full py-3 font-bold hover:bg-[#1A2B1A] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingPassword ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Changing password...</>
            ) : (
              <><Lock className="w-5 h-5" /> Change Password</>
            )}
          </button>
        </div>
      )}

      {tab === "notifications" && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8 space-y-5">
          <p className="text-sm text-[#6B7280]">Choose what notifications you&apos;d like to receive.</p>
          {(Object.keys(notifLabels) as (keyof Notifications)[]).map((key) => (
            <div key={key} className="flex items-center justify-between py-2">
              <span className="text-sm text-[#4B5563]">{notifLabels[key]}</span>
              <Toggle
                checked={notifs[key]}
                onChange={(v) => setNotifs((prev) => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}
          <p className="text-xs text-[#9CA3AF] pt-2">
            Preferences are saved locally on this device.
          </p>
        </div>
      )}

      {tab === "danger" && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-[#0D1F0D]">Delete Account</p>
              <p className="text-sm text-[#6B7280]">
                Permanently remove your account and all data
              </p>
            </div>
          </div>
          <p className="text-sm text-[#6B7280]">
            This action is irreversible. All your profile data, quiz attempts, interview
            sessions, and resume analyses will be permanently deleted.
          </p>
          <button
            disabled
            className="w-full bg-red-50 text-red-600 border border-red-200 rounded-full py-3 font-bold cursor-not-allowed opacity-60"
          >
            Delete Account (Coming Soon)
          </button>
        </div>
      )}
    </div>
  )
}
