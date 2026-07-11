"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Loader2, Save, User } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { updateProfile } from "@/lib/auth"

export default function ProfilePage() {
  const { user, setUser, token } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name || "")
  const [college, setCollege] = useState(user?.college || "")
  const [targetRole, setTargetRole] = useState(user?.target_role || "")

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "")
      setCollege(user.college || "")
      setTargetRole(user.target_role || "")
    }
  }, [user])

  const hasChanges =
    fullName !== (user?.full_name || "") ||
    college !== (user?.college || "") ||
    targetRole !== (user?.target_role || "")

  const handleSave = async () => {
    if (!hasChanges || !token) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await updateProfile({
        full_name: fullName,
        college: college || undefined,
        target_role: targetRole || undefined,
      })
      setUser(updated, token)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update profile."
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#0D1F0D]">Profile</h1>
        <p className="text-[#6B7280] text-sm mt-1">Manage your personal information</p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-5 pb-6 border-b border-[#E5E7EB]">
          <div className="w-16 h-16 rounded-full bg-[#0D1F0D] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {user?.full_name
              ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              : "?"}
          </div>
          <div>
            <p className="text-lg font-bold text-[#0D1F0D]">{user?.full_name}</p>
            <p className="text-sm text-[#6B7280]">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#4B5563] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#9CA3AF] bg-[#F9FAFB] outline-none cursor-not-allowed"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] mb-1">
              College
            </label>
            <input
              type="text"
              placeholder="e.g. IIT Bombay"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5563] mb-1">
              Target Role
            </label>
            <input
              type="text"
              placeholder="e.g. SDE Intern"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full bg-[#0D1F0D] text-white rounded-full py-3 font-bold hover:bg-[#1A2B1A] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-300" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  )
}
