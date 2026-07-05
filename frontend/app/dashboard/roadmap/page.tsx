"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Map, Loader2, Trash2, Clock,
  Target, Sparkles, ChevronRight,
  BookOpen, ExternalLink, ArrowLeft,
  ChevronDown, ChevronUp
} from "lucide-react"
import {
  generateRoadmap,
  getRoadmapHistory,
  getRoadmap,
  deleteRoadmap,
  type RoadmapResponse,
  type RoadmapCategory,
  type RoadmapSummary,
} from "@/lib/roadmap"

const TARGET_ROLES = [
  { value: "", label: "General (no specific role)" },
  { value: "SDE Intern", label: "SDE Intern" },
  { value: "ML Intern", label: "ML Intern" },
  { value: "Full Stack Intern", label: "Full Stack Intern" },
  { value: "DevOps Intern", label: "DevOps Intern" },
  { value: "Data Science Intern", label: "Data Science Intern" },
]

const CATEGORY_COLORS = [
  "bg-[#0D1F0D]",
  "bg-[#1a3a1a]",
  "bg-[#2d5a2d]",
  "bg-[#0f2f0f]",
  "bg-[#1f4f1f]",
  "bg-[#163016]",
  "bg-[#0a1f0a]",
  "bg-[#244824]",
]

function CategoryCard({
  category,
  index,
}: {
  category: RoadmapCategory
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null)
  const bgColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length]

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`${bgColor} text-white rounded-2xl px-5 py-3
          font-bold text-sm cursor-pointer transition-all
          hover:opacity-90 shadow-md w-48 text-center
          flex flex-col items-center gap-1`}
      >
        <span className="line-clamp-2">{category.title}</span>
        {category.duration && (
          <span className="text-white/60 text-xs font-normal">
            {category.duration}
          </span>
        )}
        {expanded
          ? <ChevronUp className="w-3 h-3 mt-1 text-white/60" />
          : <ChevronDown className="w-3 h-3 mt-1 text-white/60" />
        }
      </button>

      {expanded && category.topics.length > 0 && (
        <div className="w-0.5 h-4 bg-[#0D1F0D]/30" />
      )}

      {expanded && (
        <div className="flex flex-col gap-2 w-48">
          {category.topics.map((topic, ti) => (
            <div key={ti} className="flex flex-col items-center">
              <button
                onClick={() =>
                  setSelectedTopic(selectedTopic === ti ? null : ti)
                }
                className={`w-full border rounded-xl px-3 py-2 text-xs
                  text-left transition-all cursor-pointer
                  ${selectedTopic === ti
                    ? "border-[#0D1F0D] bg-[#0D1F0D]/5 text-[#0D1F0D]"
                    : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#0D1F0D]/40"
                  }`}
              >
                <div className="font-medium line-clamp-2">
                  {topic.title}
                </div>
                {topic.duration && (
                  <div className="text-[10px] text-[#9CA3AF] mt-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {topic.duration}
                  </div>
                )}
              </button>

              {selectedTopic === ti && (
                <div className="w-64 bg-white border border-[#E5E7EB]
                  rounded-xl p-3 mt-1 shadow-lg z-10">
                  <p className="text-xs text-[#4B5563] leading-relaxed mb-2">
                    {topic.description}
                  </p>
                  {topic.resources.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#0D1F0D] uppercase tracking-wide">
                        Resources
                      </p>
                      {topic.resources.map((r, ri) => (
                        <a
                          key={ri}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px]
                            text-[#0D1F0D] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          {r.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RoadmapView({
  roadmap,
  onBack,
}: {
  roadmap: RoadmapResponse
  onBack: () => void
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[#6B7280]
          hover:text-[#0D1F0D] transition-colors mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Roadmaps
      </button>

      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-5 h-5 text-[#0D1F0D]" />
        <div>
          <h3 className="text-lg font-bold text-[#0D1F0D]">
            {roadmap.topic}
          </h3>
          {roadmap.target_role && (
            <p className="text-sm text-[#6B7280]">
              {roadmap.target_role}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-6">
        <div className="flex flex-row items-start gap-4 min-w-max px-4">
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white border-2 border-[#0D1F0D]
              rounded-2xl px-6 py-4 font-bold text-[#0D1F0D]
              text-base shadow-sm min-w-[120px] text-center">
              {roadmap.topic}
            </div>
          </div>

          <div className="flex items-center self-start mt-6">
            <div className="w-8 h-0.5 bg-[#0D1F0D]/30" />
            <ChevronRight className="w-4 h-4 text-[#0D1F0D]/30 -ml-1" />
          </div>

          <div className="flex flex-row gap-6 items-start">
            {roadmap.categories.map((cat, i) => (
              <div key={i} className="flex flex-row items-start gap-2">
                <CategoryCard category={cat} index={i} />
                {i < roadmap.categories.length - 1 && (
                  <div className="flex items-center self-start mt-6">
                    <div className="w-4 h-0.5 bg-[#E5E7EB]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-[#9CA3AF] mt-2 text-center">
        ← Scroll horizontally to see all categories →
      </p>
    </div>
  )
}

export default function RoadmapPage() {
  const [topic, setTopic] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeRoadmap, setActiveRoadmap] =
    useState<RoadmapResponse | null>(null)
  const [history, setHistory] = useState<RoadmapSummary[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getRoadmapHistory()
      setHistory(data)
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setGenerating(true)
    setError(null)
    setActiveRoadmap(null)
    try {
      const result = await generateRoadmap(
        topic.trim(),
        targetRole || undefined
      )
      setActiveRoadmap(result)
      setViewingId(null)
      await fetchHistory()
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to generate roadmap"
      )
    } finally {
      setGenerating(false)
    }
  }

  const handleView = async (id: string) => {
    if (viewingId === id) {
      setViewingId(null)
      setActiveRoadmap(null)
      return
    }
    try {
      setViewingId(id)
      const data = await getRoadmap(id)
      setActiveRoadmap(data)
    } catch (e: any) {
      setError("Failed to load roadmap")
      setViewingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRoadmap(id)
      setHistory(prev => prev.filter(r => r.id !== id))
      if (viewingId === id) {
        setViewingId(null)
        setActiveRoadmap(null)
      }
    } catch {
      setError("Failed to delete roadmap")
    }
  }

  const handleBack = () => {
    setActiveRoadmap(null)
    setViewingId(null)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1F0D]">
          Roadmap Generator
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Generate AI-powered learning roadmaps for your career goals
        </p>
      </div>

      {!activeRoadmap && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#0D1F0D] mb-5">
            Generate Your Roadmap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. DSA, Python, System Design, React"
                className="w-full px-4 py-3 border border-[#E5E7EB]
                  rounded-lg text-[#0D1F0D] placeholder-[#9CA3AF]
                  focus:outline-none focus:border-[#0D1F0D]
                  focus:ring-1 focus:ring-[#0D1F0D] transition-colors"
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">
                Target Role (optional)
              </label>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB]
                  rounded-lg text-[#0D1F0D] focus:outline-none
                  focus:border-[#0D1F0D] transition-colors bg-white"
              >
                {TARGET_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-3">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || generating}
            className="mt-5 bg-[#0D1F0D] text-white rounded-full
              px-6 py-2.5 text-sm font-bold hover:bg-[#1A2B1A]
              transition disabled:opacity-50 disabled:cursor-not-allowed
              inline-flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Roadmap
              </>
            )}
          </button>

          {generating && (
            <p className="text-xs text-[#9CA3AF] mt-2">
              This usually takes 10-15 seconds...
            </p>
          )}
        </div>
      )}

      {activeRoadmap && (
        <RoadmapView
          roadmap={activeRoadmap}
          onBack={handleBack}
        />
      )}

      {!activeRoadmap && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0D1F0D] mb-4">
            Your Roadmaps
          </h2>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#0D1F0D]
                border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="bg-[#F9FAFB] rounded-full p-4">
                <Map className="w-8 h-8 text-[#9CA3AF]" />
              </div>
              <p className="text-[#9CA3AF] text-center">
                No roadmaps yet. Generate your first one above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2
              lg:grid-cols-3 gap-4">
              {history.map(item => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl p-4
                    transition-all cursor-pointer
                    ${viewingId === item.id
                      ? "border-[#0D1F0D] shadow-md"
                      : "border-[#E5E7EB] hover:border-[#0D1F0D] hover:shadow-md"
                    }`}
                  onClick={() => handleView(item.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-[#0D1F0D] text-sm">
                      {item.topic}
                    </h4>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDelete(item.id)
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {item.target_role && (
                    <div className="flex items-center gap-1
                      text-xs text-[#6B7280] mb-2">
                      <Target className="w-3 h-3" />
                      <span>{item.target_role}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1
                    text-xs text-[#6B7280]">
                    <Clock className="w-3 h-3" />
                    <span>
                      {item.created_at
                        ? new Date(item.created_at)
                            .toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
