"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  RotateCcw,
  TrendingUp,
  Cpu,
  Database,
  Network,
  Box,
  Bookmark,
  GraduationCap,
} from "lucide-react"
import {
  generateQuiz,
  submitQuiz,
  listAttempts,
  getAttempt,
  addBookmark,
  removeBookmark,
  listBookmarks,
} from "@/lib/quiz"
import type {
  QuestionResponse,
  QuizResultResponse,
  AttemptSummary,
  BookmarkResponse,
} from "@/lib/quiz"
import {
  CircularProgress,
  ScoreBar,
  scoreTextColor,
  scoreColor,
} from "@/components/ui/ScoreDisplay"

const ALL_TOPICS = ["OS", "DBMS", "CN", "OOP"]
const DIFFICULTIES = ["easy", "medium", "hard"] as const
const QUESTION_COUNTS = [10, 15, 20] as const
const TIME_LIMITS: Record<number, number> = { 10: 15, 15: 20, 20: 30 }
const OPTION_LABELS = ["A", "B", "C", "D"]

function formatDate(dateStr?: string): string {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  })
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export default function QuizPage() {
  const [activeTab, setActiveTab] = useState<"new" | "history" | "bookmarks">("new")
  const [error, setError] = useState<string | null>(null)

  // Setup state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<string>("medium")
  const [questionCount, setQuestionCount] = useState(10)
  const [generating, setGenerating] = useState(false)

  // Quiz state
  const [quizState, setQuizState] = useState<"setup" | "quiz" | "result" | "review">("setup")
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuestionResponse[]>([])
  const [timeLimitSec, setTimeLimitSec] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Result state
  const [result, setResult] = useState<QuizResultResponse | null>(null)
  const [historyResult, setHistoryResult] = useState<QuizResultResponse | null>(null)

  // History state
  const [history, setHistory] = useState<AttemptSummary[]>([])

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set())
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)
  const [bookmarkList, setBookmarkList] = useState<BookmarkResponse[]>([])
  const [loadingBookmarkList, setLoadingBookmarkList] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasAutoSubmitted = useRef(false)

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  const handleGenerate = async () => {
    if (selectedTopics.length === 0) return
    setGenerating(true)
    setError(null)
    try {
      const res = await generateQuiz({
        topics: selectedTopics,
        difficulty,
        total_questions: questionCount,
      })
      setAttemptId(res.attempt_id)
      setQuestions(res.questions)
      setTimeLimitSec(res.time_limit_minutes * 60)
      setTimeRemaining(res.time_limit_minutes * 60)
      setAnswers(new Array(res.questions.length).fill(-1))
      setCurrentIndex(0)
      setQuizState("quiz")
      setBookmarks(new Set())
      hasAutoSubmitted.current = false
      setLoadingBookmarks(true)
      listBookmarks().then(all => {
        const ids = new Set(
          all.filter(b => b.attempt_id === res.attempt_id).map(b => b.question_index)
        )
        setBookmarks(ids)
      }).catch(() => {}).finally(() => setLoadingBookmarks(false))
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string }, status?: number } })?.response?.data?.message
        || "Failed to generate quiz. Please try again."
      setError(msg)
    } finally {
      setGenerating(false)
    }
  }

  const toggleBookmark = async (index: number) => {
    if (!attemptId) return
    try {
      if (bookmarks.has(index)) {
        await removeBookmark(attemptId, index)
        setBookmarks(prev => { const n = new Set(prev); n.delete(index); return n; })
      } else {
        const note = window.prompt("Add a note for this bookmark (optional):")
        await addBookmark({ attempt_id: attemptId, question_index: index, note: note || undefined })
        setBookmarks(prev => new Set(prev).add(index))
      }
    } catch {
      setError("Failed to update bookmark")
    }
  }

  const handleAutoSubmit = useCallback(async () => {
    if (hasAutoSubmitted.current || !attemptId) return
    hasAutoSubmitted.current = true
    setSubmitting(true)
    try {
      const res = await submitQuiz(attemptId, answers)
      setResult(res)
      setQuizState("result")
      setHistory((prev) => [
        {
          id: res.attempt_id,
          topics: selectedTopics,
          difficulty,
          total_questions: res.total_questions,
          correct_answers: res.correct_answers,
          score_percentage: res.score_percentage,
          created_at: res.created_at,
        },
        ...prev,
      ])
    } catch {
      setError("Failed to submit quiz. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }, [attemptId, answers, selectedTopics, difficulty])

  useEffect(() => {
    if (quizState !== "quiz" || timeRemaining <= 0 || hasAutoSubmitted.current) return
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [quizState, timeRemaining, handleAutoSubmit])

  const handleSubmitQuiz = async () => {
    const unanswered = answers.filter((a) => a === -1).length
    if (unanswered > 0) {
      const confirm = window.confirm(
        `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`
      )
      if (!confirm) return
    }
    if (!attemptId) return
    setSubmitting(true)
    try {
      const res = await submitQuiz(attemptId, answers)
      setResult(res)
      setQuizState("result")
      setHistory((prev) => [
        {
          id: res.attempt_id,
          topics: selectedTopics,
          difficulty,
          total_questions: res.total_questions,
          correct_answers: res.correct_answers,
          score_percentage: res.score_percentage,
          created_at: res.created_at,
        },
        ...prev,
      ])
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to submit quiz."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewHistory = async (id: string) => {
    try {
      const data = await getAttempt(id)
      setHistoryResult(data)
      setActiveTab("new")
      setBookmarks(new Set())
      setLoadingBookmarks(true)
      listBookmarks().then(all => {
        const ids = new Set(
          all.filter(b => b.attempt_id === id).map(b => b.question_index)
        )
        setBookmarks(ids)
      }).catch(() => {}).finally(() => setLoadingBookmarks(false))
    } catch {
      setError("Failed to load attempt")
    }
  }

  const handleNewQuiz = () => {
    setQuizState("setup")
    setAttemptId(null)
    setQuestions([])
    setAnswers([])
    setResult(null)
    setHistoryResult(null)
    setCurrentIndex(0)
    setBookmarks(new Set())
    setError(null)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => {
    listAttempts().then(setHistory).catch(() => {})
  }, [])

  useEffect(() => {
    if (quizState === "quiz") {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
      }
      window.addEventListener("beforeunload", handler)
      return () => window.removeEventListener("beforeunload", handler)
    }
  }, [quizState])

  useEffect(() => {
    if (activeTab === "bookmarks") {
      setLoadingBookmarkList(true)
      listBookmarks()
        .then(setBookmarkList)
        .catch(() => {})
        .finally(() => setLoadingBookmarkList(false))
    }
  }, [activeTab])

  const displayResult = result || historyResult

  // ────────────────── SETUP ──────────────────
  if (quizState === "setup" && !displayResult) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("new")}
            className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
              activeTab === "new"
                ? "text-[#0D1F0D] border-[#0D1F0D]"
                : "text-[#9CA3AF] border-transparent"
            }`}
          >
            New Quiz
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
              activeTab === "history"
                ? "text-[#0D1F0D] border-[#0D1F0D]"
                : "text-[#9CA3AF] border-transparent"
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
              activeTab === "bookmarks"
                ? "text-[#0D1F0D] border-[#0D1F0D]"
                : "text-[#9CA3AF] border-transparent"
            }`}
          >
            Bookmarks
          </button>
        </div>

        {activeTab === "history" ? (
          // ── HISTORY ──
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <h3 className="font-bold text-[#0D1F0D] mb-4">Past Attempts</h3>
            {history.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-8">
                No quiz attempts yet.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-[#F9FAFB] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex gap-1">
                        {h.topics.map((t) => (
                          <span
                            key={t}
                            className="inline-block bg-[#0D1F0D]/10 text-[#0D1F0D] rounded-full text-xs px-2 py-0.5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-[#6B7280] capitalize">
                        {h.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-sm font-bold ${scoreTextColor(h.score_percentage)}`}
                      >
                        {Math.round(h.score_percentage)}%
                      </span>
                      <button
                        onClick={() => handleViewHistory(h.id)}
                        className="text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "bookmarks" ? (
          // ── BOOKMARKS ──
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <h3 className="font-bold text-[#0D1F0D] mb-4">Bookmarked Questions</h3>
            {loadingBookmarkList ? (
              <div className="flex items-center justify-center py-8 animate-logo-pulse">
                <GraduationCap className="w-8 h-8 text-[#C8FF00]" />
                <span className="ml-2 font-bold text-[#0D1F0D]">CareerOS</span>
              </div>
            ) : bookmarkList.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-8">
                No bookmarked questions yet. Bookmark questions during a quiz to review them later.
              </p>
            ) : (
              <div className="space-y-3">
                {bookmarkList.map((bm) => (
                  <div key={bm.id} className="flex flex-col gap-1 py-3 px-4 rounded-lg hover:bg-[#F9FAFB] transition-colors border border-transparent hover:border-[#E5E7EB]">
                    <div className="flex items-start gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-yellow-500 fill-current flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-[#0D1F0D]">{bm.question_text}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-5">
                      <span className="inline-block bg-[#0D1F0D]/10 text-[#0D1F0D] rounded-full text-xs px-2 py-0.5">
                        {bm.topic}
                      </span>
                      <span className="text-xs text-[#6B7280] capitalize">{bm.difficulty}</span>
                      {bm.note && (
                        <span className="text-xs text-[#9CA3AF] italic">Note: {bm.note}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // ── SETUP ──
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8">
              <h1 className="text-2xl font-bold text-[#0D1F0D] text-center">
                Test Your Knowledge
              </h1>
              <p className="text-[#6B7280] text-sm text-center mt-1">
                Choose your topics and difficulty to begin
              </p>

              <div className="mt-8 space-y-6">
                {/* Topics */}
                <div>
                  <label className="block text-sm font-medium text-[#4B5563] mb-3">
                    Topics <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {ALL_TOPICS.map((topic) => {
                      const selected = selectedTopics.includes(topic)
                      return (
                        <button
                          key={topic}
                          onClick={() => toggleTopic(topic)}
                          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                            selected
                              ? "bg-[#0D1F0D] text-white"
                              : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-[#0D1F0D]"
                          }`}
                        >
                          {topic}
                        </button>
                      )
                    })}
                  </div>
                  {selectedTopics.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Select at least one topic
                    </p>
                  )}
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-[#4B5563] mb-3">
                    Difficulty
                  </label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map((d) => {
                      const selected = difficulty === d
                      return (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                            selected
                              ? "bg-[#0D1F0D] text-white"
                              : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-[#0D1F0D]"
                          }`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Question Count */}
                <div>
                  <label className="block text-sm font-medium text-[#4B5563] mb-3">
                    Number of Questions
                  </label>
                  <div className="flex gap-2">
                    {QUESTION_COUNTS.map((count) => {
                      const selected = questionCount === count
                      return (
                        <button
                          key={count}
                          onClick={() => setQuestionCount(count)}
                          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            selected
                              ? "bg-[#0D1F0D] text-white"
                              : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-[#0D1F0D]"
                          }`}
                        >
                          {count}
                          <span className="block text-[10px] opacity-70 mt-0.5">
                            {TIME_LIMITS[count]} min
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Start */}
                <button
                  onClick={handleGenerate}
                  disabled={selectedTopics.length === 0 || generating}
                  className="w-full bg-[#0D1F0D] text-white rounded-full py-3 font-bold hover:bg-[#1A2B1A] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <div className="flex items-center gap-3 animate-logo-pulse">
                      <GraduationCap className="w-6 h-6 text-[#C8FF00]" />
                      <span className="font-bold">CareerOS</span>
                      <span className="text-sm font-medium opacity-70">Generating your quiz...</span>
                    </div>
                  ) : (
                    "Start Quiz →"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ────────────────── QUIZ ──────────────────
  if (quizState === "quiz" && questions.length > 0) {
    const total = questions.length
    const question = questions[currentIndex]
    const currentAnswer = answers[currentIndex]
    const answeredCount = answers.filter((a) => a !== -1).length
    const progress = ((currentIndex + 1) / total) * 100
    const isLast = currentIndex === total - 1

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Timer alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Top Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#4B5563]">
              Question {currentIndex + 1} of {total}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold flex items-center gap-1 ${
                  timeRemaining < 60 ? "text-red-500" : "text-[#0D1F0D]"
                }`}
              >
                <Clock className="w-4 h-4" />
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          <div className="bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#0D1F0D] h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block bg-[#0D1F0D]/10 text-[#0D1F0D] rounded-full text-xs px-3 py-1">
              {question.topic}
            </span>
            <button
              onClick={() => toggleBookmark(currentIndex)}
              disabled={loadingBookmarks}
              className={`p-1.5 rounded-lg transition-colors ${
                bookmarks.has(currentIndex)
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-[#9CA3AF] hover:text-[#4B5563]"
              }`}
              title={bookmarks.has(currentIndex) ? "Remove bookmark" : "Bookmark this question"}
            >
              <Bookmark className={`w-5 h-5 ${bookmarks.has(currentIndex) ? "fill-current" : ""}`} />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-[#0D1F0D] leading-relaxed">
            {question.question}
          </h2>

          <div className="mt-6 space-y-3">
            {question.options.map((option, idx) => {
              const selected = currentAnswer === idx
              return (
                <button
                  key={idx}
                  onClick={() => {
                    const copy = [...answers]
                    copy[currentIndex] = idx
                    setAnswers(copy)
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    selected
                      ? "border-[#0D1F0D] bg-[#0D1F0D]/5"
                      : "border-[#E5E7EB] bg-white hover:border-[#0D1F0D]/40"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      selected
                        ? "bg-[#0D1F0D] text-white"
                        : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {OPTION_LABELS[idx]}
                  </span>
                  <span className="text-sm text-[#4B5563]">{option}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl p-4">
          <button
            onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="hidden sm:flex items-center gap-1.5">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                  answers[idx] !== -1
                    ? "bg-[#0D1F0D] text-white"
                    : idx === currentIndex
                    ? "border-2 border-[#0D1F0D] text-[#0D1F0D]"
                    : "border border-[#E5E7EB] text-[#9CA3AF]"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {isLast ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="bg-[#0D1F0D] text-white rounded-full px-6 py-2 text-sm font-bold hover:bg-[#1A2B1A] transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center gap-2 animate-logo-pulse">
                  <GraduationCap className="w-4 h-4 text-[#C8FF00]" />
                  <span className="font-bold text-sm">CareerOS</span>
                  <span className="text-xs opacity-70">Submitting...</span>
                </div>
              ) : (
                "Submit Quiz"
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((p) => Math.min(total - 1, p + 1))}
              className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ────────────────── RESULT ──────────────────
  if (quizState === "result" && result) {
    const res = result
    const catScores = res.topic_scores
    const skillUpdated = res.skill_scores_updated
    const color = scoreColor(res.score_percentage)

    const topicIcons: Record<string, React.ReactNode> = {
      OS: <Cpu className="w-4 h-4" />,
      DBMS: <Database className="w-4 h-4" />,
      CN: <Network className="w-4 h-4" />,
      OOP: <Box className="w-4 h-4" />,
    }

    const heroMessage =
      res.score_percentage >= 80
        ? "Excellent work!"
        : res.score_percentage >= 60
        ? "Good effort!"
        : "Keep practicing!"

    return (
      <div className="space-y-8">
        {/* Score Hero */}
        <div
          className="bg-gradient-to-br from-white to-[#FAFFE9] border border-[#E5E7EB] rounded-2xl p-6 lg:p-8 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
            <div style={{ filter: `drop-shadow(0 0 20px ${color}40)` }}>
              <CircularProgress
                score={res.score_percentage}
                size={180}
                strokeWidth={12}
              />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <p className="text-3xl font-bold text-[#0D1F0D]">
                {heroMessage}
              </p>
              <p className="text-lg text-[#4B5563] mt-2">
                {res.correct_answers} out of {res.total_questions} questions correct
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-2 mt-4">
                {selectedTopics.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 bg-[#0D1F0D]/10 text-[#0D1F0D] rounded-full text-xs px-3 py-1"
                  >
                    {topicIcons[t]}
                    {t}
                  </span>
                ))}
                <span className="inline-flex items-center bg-[#F3F4F6] text-[#6B7280] rounded-full text-xs px-3 py-1 capitalize">
                  {res.questions[0]?.difficulty || difficulty}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-3">
                {formatDate(res.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Topic Breakdown */}
        {Object.keys(catScores).length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-[#0D1F0D] mb-4">
              Topic Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(catScores).map(([topic, ts]) => {
                const topicColor = scoreColor(ts.percentage)
                return (
                  <div
                    key={topic}
                    className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm"
                    style={{ backgroundColor: `${topicColor}08` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${topicColor}18` }}
                      >
                        <span style={{ color: topicColor }}>
                          {topicIcons[topic]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0D1F0D]">
                          {topic}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {ts.correct}/{ts.total} correct
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(ts.percentage, 100)}%`,
                          backgroundColor: topicColor,
                        }}
                      />
                    </div>
                    <p
                      className={`text-right text-xs font-bold mt-1 ${scoreTextColor(ts.percentage)}`}
                    >
                      {Math.round(ts.percentage)}%
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Skill Scores Updated */}
        {Object.keys(skillUpdated).length > 0 && (
          <div className="bg-white border-2 border-[#0D1F0D]/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-bold text-[#0D1F0D] text-lg">
                Skill Scores Updated
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(skillUpdated).map(([topic, scoreVal]) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full text-sm px-4 py-1.5 shadow-sm"
                >
                  <span className="font-bold text-[#0D1F0D]">{topic}</span>
                  <span className={`font-bold ${scoreTextColor(scoreVal)}`}>
                    {scoreVal}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Review + Retake */}
        <div className="flex gap-4">
          <button
            onClick={() => setQuizState("review")}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-[#0D1F0D] text-[#0D1F0D] rounded-full py-3 font-bold text-sm hover:bg-[#0D1F0D]/5 transition"
          >
            <Eye className="w-4 h-4" />
            Review Answers
          </button>
          <button
            onClick={handleNewQuiz}
            className="flex-1 flex items-center justify-center gap-2 bg-[#0D1F0D] text-white rounded-full py-4 font-bold text-sm hover:bg-[#1A2B1A] transition shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            Take Another Quiz
          </button>
        </div>
      </div>
    )
  }

  // ────────────────── HISTORY RESULT ──────────────────
  if (historyResult && !result) {
    const res = historyResult
    const catScores = res.topic_scores

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setHistoryResult(null); setActiveTab("history") }}
            className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to History
          </button>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-10">
            <CircularProgress score={res.score_percentage} />
            <div className="flex-1 text-center lg:text-left">
              <p className="text-2xl font-bold text-[#0D1F0D]">
                {res.correct_answers} / {res.total_questions} correct
              </p>
              <p className="text-sm text-[#6B7280] mt-1">
                {formatDate(res.created_at)}
              </p>
            </div>
          </div>
        </div>

        {Object.keys(catScores).length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-[#0D1F0D] mb-4">
              Topic Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(catScores).map(([topic, ts]) => (
                <ScoreBar key={topic} label={topic} score={ts.percentage} />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => { setResult(historyResult); setQuizState("result") }}
          className="w-full border border-[#0D1F0D] text-[#0D1F0D] rounded-full py-3 font-bold text-sm hover:bg-[#0D1F0D]/5 transition"
        >
          Review Answers
        </button>
      </div>
    )
  }

  // ────────────────── REVIEW ──────────────────
  if (quizState === "review" && displayResult) {
    const res = displayResult

    return (
      <div className="space-y-6">
        <button
          onClick={() => setQuizState("result")}
          className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Results
        </button>

        <h2 className="text-xl font-bold text-[#0D1F0D]">Review Answers</h2>

        {res.questions.map((q, idx) => (
          <div
            key={idx}
            className={`bg-white border rounded-xl p-6 ${
              q.is_correct ? "border-[#E5E7EB]" : "border-red-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-[#6B7280]">
                Q{idx + 1}
              </span>
              {bookmarks.has(idx) && (
                <Bookmark className="w-3.5 h-3.5 text-yellow-500 fill-current" />
              )}
              <span className="inline-block bg-[#0D1F0D]/10 text-[#0D1F0D] rounded-full text-xs px-2 py-0.5">
                {q.topic}
              </span>
              <span className="inline-block bg-[#F3F4F6] text-[#6B7280] rounded-full text-xs px-2 py-0.5 capitalize">
                {q.difficulty}
              </span>
              {q.is_correct ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 ml-auto" />
              )}
            </div>

            <p className="text-sm font-semibold text-[#0D1F0D] mb-4">
              {q.question}
            </p>

            <div className="space-y-2">
              {q.options.map((opt, optIdx) => {
                const isCorrect = optIdx === q.correct_option
                const isSelected = optIdx === q.selected_option
                const isWrong = isSelected && !isCorrect
                return (
                  <div
                    key={optIdx}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                      isCorrect
                        ? "border-green-300 bg-green-50"
                        : isWrong
                        ? "border-red-300 bg-red-50"
                        : "border-[#E5E7EB]"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isCorrect
                          ? "bg-green-500 text-white"
                          : isWrong
                          ? "bg-red-500 text-white"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      {OPTION_LABELS[optIdx]}
                    </span>
                    <span className="text-sm text-[#4B5563]">{opt}</span>
                  </div>
                )
              })}
            </div>

            {/* Explanation */}
            <div className="mt-4 bg-[#F9FAFB] rounded-lg p-4">
              <p className="text-xs font-bold text-[#6B7280] uppercase mb-1">
                Explanation
              </p>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                {q.explanation}
              </p>
            </div>
          </div>
        ))}

        <button
          onClick={() => setQuizState("result")}
          className="w-full bg-[#0D1F0D] text-white rounded-full py-3 font-bold text-sm hover:bg-[#1A2B1A] transition"
        >
          Back to Results
        </button>
      </div>
    )
  }

  // Fallback
  return null
}
