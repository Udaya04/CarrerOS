"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle,
  Briefcase,
  ArrowUpRight,
  MapPin,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { getAppliedJobs } from "@/lib/jobs"
import type { AppliedJobResponse } from "@/lib/jobs"

function daysAgo(dateStr?: string): string | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`
}

export default function AppliedJobsPage() {
  const [applied, setApplied] = useState<AppliedJobResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAppliedJobs()
      .then(setApplied)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors mb-4"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Job Board
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="w-6 h-6 text-[#0D1F0D]" />
        <h1 className="text-xl font-bold text-[#0D1F0D]">Applied Jobs</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-4 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#E5E7EB]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#E5E7EB] rounded w-1/3" />
                  <div className="h-3 bg-[#E5E7EB] rounded w-1/4" />
                </div>
              </div>
              <div className="h-5 bg-[#E5E7EB] rounded w-3/4 mb-3" />
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-[#E5E7EB] rounded w-full" />
                <div className="h-3 bg-[#E5E7EB] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : applied.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E5E7EB] rounded-2xl">
          <CheckCircle className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
          <p className="text-[#6B7280] text-sm mb-4">
            No applied jobs yet.
          </p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-1 bg-[#0D1F0D] text-white rounded-full px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Browse Jobs
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applied.map((entry) => {
            const job = entry.job
            const initial = job.company.charAt(0).toUpperCase()
            return (
              <div
                key={entry.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#0D1F0D]/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#0D1F0D]/10 flex items-center justify-center text-[#0D1F0D] font-bold text-sm flex-shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0D1F0D] truncate">
                        {job.company}
                      </p>
                      {job.location && (
                        <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {job.job_type && (
                    <span className="flex-shrink-0 bg-[#FAFFE9] text-[#0D1F0D] border border-[#0D1F0D]/20 rounded-full text-xs px-2 py-0.5 whitespace-nowrap">
                      {job.job_type}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#0D1F0D] line-clamp-1 mb-2">
                  {job.title}
                </h3>

                <div className="flex items-center gap-3 flex-wrap text-xs text-[#6B7280] mb-3">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Applied {daysAgo(entry.applied_at)}
                  </span>
                  {job.salary && (
                    <span className="font-medium text-[#0D1F0D]">{job.salary}</span>
                  )}
                </div>

                {job.description && (
                  <p className="text-sm text-[#6B7280] line-clamp-2 mb-4">
                    {job.description}
                  </p>
                )}

                <div className="flex items-center justify-end pt-2 border-t border-[#E5E7EB]">
                  {job.apply_url && (
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-[#0D1F0D] text-white rounded-full text-sm px-4 py-1.5 hover:opacity-90 transition-opacity"
                    >
                      View Application
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
