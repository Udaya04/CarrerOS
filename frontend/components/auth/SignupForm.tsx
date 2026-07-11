"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { Loader2, CheckCircle } from "lucide-react"
import { signUp } from "@/lib/auth"

const targetRoles = [
  "SDE Intern",
  "ML Intern",
  "Full Stack Intern",
  "DevOps Intern",
  "Data Analyst Intern",
]

interface SignupFormData {
  full_name: string
  email: string
  password: string
  college?: string
  target_role: string
}

export function SignupForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>()

  useEffect(() => {
    if (isSuccess) {
      let count = 3
      setCountdown(3)
      const timer = setInterval(() => {
        count--
        setCountdown(count)
        if (count === 0) {
          clearInterval(timer)
          router.push("/auth/login")
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isSuccess])

  const onSubmit = async (data: SignupFormData) => {
    setError("")
    try {
      await signUp(data)
      setIsSuccess(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Signup failed. Please try again."
      setError(msg)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-[#0D1F0D]" />
        </div>
        <h3 className="text-xl font-bold text-[#0D1F0D] mt-4">
          Account Created Successfully!
        </h3>
        <p className="text-[#6B7280] text-sm mt-2">
          Welcome to CareerOS. Please login to start your journey.
        </p>
        <p className="text-[#9CA3AF] text-xs mt-4">
          Redirecting to login in {countdown}s...
        </p>
        <Link href="/auth/login">
          <button className="mt-6 bg-[#0D1F0D] text-white rounded-full px-8 py-3 font-bold w-full hover:bg-[#1A2B1A] transition">
            Go to Login &rarr;
          </button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#4B5563]">
          Full Name
        </label>
        <input
          type="text"
          placeholder="John Doe"
          {...register("full_name", { required: "Full name is required" })}
          disabled={isSubmitting}
          className="mt-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
        />
        {errors.full_name && (
          <p className="text-red-500 text-xs mt-1">
            {errors.full_name.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#4B5563]">
          Email
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
          })}
          disabled={isSubmitting}
          className="mt-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#4B5563]">
          Password
        </label>
        <input
          type="password"
          placeholder="••••••••"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          })}
          disabled={isSubmitting}
          className="mt-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
        />
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#4B5563]">
          College <span className="text-[#9CA3AF]">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="NIT Rourkela"
          {...register("college")}
          disabled={isSubmitting}
          className="mt-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#4B5563]">
          Target Role
        </label>
        <select
          {...register("target_role", { required: "Target role is required" })}
          disabled={isSubmitting}
          className="mt-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#0D1F0D] outline-none focus:border-[#0D1F0D] transition-colors disabled:opacity-60 bg-white"
        >
          <option value="">Select a role</option>
          {targetRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {errors.target_role && (
          <p className="text-red-500 text-xs mt-1">
            {errors.target_role.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0D1F0D] text-white rounded-full py-3 font-bold hover:bg-[#1A2B1A] transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account →"
        )}
      </button>

      <p className="text-center text-sm text-[#6B7280]">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-[#0D1F0D] font-bold underline"
        >
          Login
        </Link>
      </p>
    </form>
  )
}
