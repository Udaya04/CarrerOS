"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  MapPin,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  ArrowUpRight,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import {
  searchJobs,
  saveJob,
  getSavedJobs,
  removeSavedJob,
  applyJob,
} from "@/lib/jobs"
import type { JobResponse } from "@/lib/jobs"

function daysAgo(dateStr?: string): string | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`
}

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Remote"]

const TYPE_MAP: Record<string, string[]> = {
  "Full-time":  ["full", "fulltime", "full-time"],
  "Part-time":  ["part", "parttime", "part-time"],
  "Internship": ["intern", "internship"],
  "Contract":   ["contract", "contractor"],
  "Remote":     ["remote"],
}

function matchesType(job: JobResponse, selectedTypes: string[]): boolean {
  if (selectedTypes.length === 0) return true
  const jt = (job.job_type || "").toLowerCase()
  return selectedTypes.some((selected) =>
    TYPE_MAP[selected]?.some((keyword) => jt.includes(keyword))
  )
}

function JobCard({
  job,
  isSaved,
  onToggleSave,
  onApply,
}: {
  job: JobResponse
  isSaved: boolean
  onToggleSave: (id: string) => void
  onApply: (id: string) => void
}) {
  const initial = job.company.charAt(0).toUpperCase()

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#0D1F0D]/30 transition-all">
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
        {job.posted_at && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {daysAgo(job.posted_at)}
          </span>
        )}
        {job.salary && <span className="font-medium text-[#0D1F0D]">{job.salary}</span>}
      </div>

      {job.description && (
        <p className="text-sm text-[#6B7280] line-clamp-2 mb-4">
          {job.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E5E7EB]">
        <button
          onClick={() => onToggleSave(job.id)}
          className={`flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 transition-all ${
            isSaved
              ? "bg-[#FAFFE9] text-[#0D1F0D]"
              : "text-[#6B7280] hover:bg-[#F3F4F6]"
          }`}
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
        </button>

        <button
          onClick={() => onApply(job.id)}
          className="flex items-center gap-1.5 bg-[#0D1F0D] text-white rounded-full text-sm px-4 py-1.5 hover:opacity-90 transition-opacity"
        >
          Apply Now
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#E5E7EB]" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-[#E5E7EB] rounded w-1/3" />
          <div className="h-3 bg-[#E5E7EB] rounded w-1/4" />
        </div>
      </div>
      <div className="h-5 bg-[#E5E7EB] rounded w-3/4 mb-3" />
      <div className="flex gap-3 mb-3">
        <div className="h-3 bg-[#E5E7EB] rounded w-16" />
        <div className="h-3 bg-[#E5E7EB] rounded w-20" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-[#E5E7EB] rounded w-full" />
        <div className="h-3 bg-[#E5E7EB] rounded w-2/3" />
      </div>
      <div className="h-8 bg-[#E5E7EB] rounded w-1/3" />
    </div>
  )
}

export default function JobsPage() {
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [page, setPage] = useState(1)
  const [jobs, setJobs] = useState<JobResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const fetchJobs = useCallback(
    async (q: string, loc: string | undefined, p: number) => {
      setLoading(true)
      setError(null)
      try {
        const res = await searchJobs(q, loc || undefined, p)
        setJobs(res.jobs)
        setTotal(res.total)
        setPage(res.page)
        setHasSearched(true)
      } catch {
        setError("Failed to fetch jobs. Please try again.")
        setHasSearched(true)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    getSavedJobs()
      .then((saved) => setSavedIds(new Set(saved.map((s) => s.job.id))))
      .catch(() => {})
    fetchJobs("Intern", undefined, 1)
  }, [fetchJobs])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim() && !location.trim()) return
    setPage(1)
    fetchJobs(query.trim() || "Intern", location.trim() || undefined, 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  const handleToggleSave = async (jobId: string) => {
    const wasSaved = savedIds.has(jobId)
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (wasSaved) next.delete(jobId)
      else next.add(jobId)
      return next
    })
    try {
      if (wasSaved) await removeSavedJob(jobId)
      else await saveJob(jobId)
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev)
        if (wasSaved) next.add(jobId)
        else next.delete(jobId)
        return next
      })
    }
  }

  const handleApply = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId)
    if (job?.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer")
    }
    try {
      await applyJob(jobId)
    } catch {
      // silently ignore if already applied
    }
  }

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const filteredJobs = jobs.filter((j) => matchesType(j, activeFilters))

  return (
    <div>
      <form
        onSubmit={handleSearch}
        className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search jobs (e.g. SDE Intern)"
              className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-[#0D1F0D] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0D1F0D] transition-colors"
            />
          </div>
          <div className="relative sm:w-48">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Location"
              className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-[#0D1F0D] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0D1F0D] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="bg-[#0D1F0D] text-white rounded-full px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </form>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sticky top-24">
            <h3 className="font-bold text-[#0D1F0D] mb-3">Filters</h3>
            <div className="space-y-2">
              {JOB_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.includes(type)}
                    onChange={() => toggleFilter(type)}
                    className="w-4 h-4 rounded border-[#D1D5DB] text-[#0D1F0D] focus:ring-[#0D1F0D] accent-[#0D1F0D]"
                  />
                  <span className="text-sm text-[#4B5563] group-hover:text-[#0D1F0D] transition-colors">
                    {type}
                  </span>
                </label>
              ))}
            </div>

            <hr className="my-4 border-[#E5E7EB]" />

            <nav className="space-y-2">
              <Link
                href="/dashboard/jobs/saved"
                className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                Saved Jobs
              </Link>
              <Link
                href="/dashboard/jobs/applied"
                className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                Applied Jobs
              </Link>
            </nav>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4 lg:hidden">
              {activeFilters.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-1 bg-[#FAFFE9] text-[#0D1F0D] border border-[#0D1F0D]/20 rounded-full text-xs px-3 py-1"
                >
                  {f}
                  <button onClick={() => toggleFilter(f)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filteredJobs.length === 0 && hasSearched ? (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
              <p className="text-[#6B7280] text-sm">
                No jobs found. Try different keywords.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedIds.has(job.id)}
                  onToggleSave={handleToggleSave}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}

          {total > 10 && !loading && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => {
                  const newPage = page - 1
                  setPage(newPage)
                  fetchJobs(query || "Intern", location || undefined, newPage)
                }}
                disabled={page <= 1}
                className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0D1F0D] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-[#6B7280]">Page {page}</span>
              <button
                onClick={() => {
                  const newPage = page + 1
                  setPage(newPage)
                  fetchJobs(query || "Intern", location || undefined, newPage)
                }}
                className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
