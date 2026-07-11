"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { animate, splitText, stagger } from "animejs"
import {
  GraduationCap,
  Search,
  FileText,
  Target,
  Bot,
  Briefcase,
  Map,
  PenLine,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"

function FloatingBadge({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"))
  }, [])

  const journeyFeatures = [
    { icon: FileText,   title: "ATS Resume Checker",    desc: "Upload your resume and get an AI-powered ATS score with detailed improvement tips. Powered by Groq AI.",      badge: "Powered by Groq AI" },
    { icon: Target,     title: "CS Quiz Engine",         desc: "Practice OS, DBMS, CN and OOP with AI-generated MCQs. Track your skill scores over time.",                     badge: "AI Generated" },
    { icon: Bot,        title: "AI Mock Interview",      desc: "Resume-aware AI interviewer conducts real interviews, asks follow-up questions, gives honest feedback.",        badge: "Powered by Nemotron AI" },
    { icon: Map,        title: "Roadmap Generator",      desc: "Get a personalized learning path based on your quiz scores and target company.",                                badge: "Personalized" },
    { icon: Briefcase,  title: "Job Board",              desc: "Browse and apply to internship openings matched to your skills and target role.",                               badge: "Live Jobs" },
    { icon: PenLine,    title: "Community Blog",         desc: "Read and share interview experiences, market insights, and career tips with peers.",                            badge: "Community" },
  ]

  const journeySteps = [
    { number: "Step 01", title: "Upload Your Resume",          desc: "Get instant ATS score and improvement tips powered by Groq AI" },
    { number: "Step 02", title: "Practice CS Fundamentals",    desc: "AI-generated quizzes on OS, DBMS, CN and OOP. Track scores." },
    { number: "Step 03", title: "Take AI Mock Interview",      desc: "Resume-aware interviewer asks real follow-up questions." },
    { number: "Step 04", title: "Get Personalized Roadmap",    desc: "Custom learning path based on your quiz scores." },
    { number: "Step 05", title: "Browse Job Board",            desc: "Find internship openings matched to your skills and target role." },
    { number: "Step 06", title: "Share & Learn",               desc: "Read and write interview experiences with the community." },
  ]

  const testimonials = [
    { photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", name: "Rahul Sharma",  college: "NIT Rourkela, CSE 3rd Year", quote: "CareerOS helped me improve my ATS score from 45 to 89. Got calls from 3 companies in a week!" },
    { photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", name: "Priya Singh",   college: "KIIT, CSE 2nd Year",          quote: "The mock interview feature is incredible. It asked follow-up questions just like a real interviewer. Got placed at Wipro!" },
    { photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face", name: "Arjun Patel",   college: "VIT Vellore, CSE 3rd Year",   quote: "Quiz engine helped me score 9/10 in OS consistently. Cracked the Flipkart SDE intern round!" },
    { photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face", name: "Sneha Reddy",   college: "NIT Trichy, CSE 3rd Year",    quote: "The roadmap generator showed me exactly what to study. Went from confused to confident in 3 weeks!" },
    { photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face", name: "Karan Mehta",   college: "BITS Pilani, CSE 2nd Year",   quote: "ATS score went from 52 to 91 after following improvement tips. Got interview calls from Amazon!" },
    { photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face", name: "Ananya Das",    college: "NIT Rourkela, CSE 3rd Year",  quote: "Best platform for CSE students. The AI interview practice is so realistic. Highly recommended!" },
  ]

  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [visibleTestimonials, setVisibleTestimonials] = useState(4)

  useEffect(() => {
    const calc = () => setVisibleTestimonials(window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 2 : 1)
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex(i => i >= testimonials.length - visibleTestimonials ? 0 : i + 1)
    }, 4000)
    return () => clearInterval(timer)
  }, [visibleTestimonials])

  useEffect(() => {
    const split = splitText("#hero-title", { words: true })
    split.words.forEach(word => {
      word.style.opacity = "0"
      word.style.transform = "translateY(40px)"
      word.style.filter = "blur(8px)"
    })
    animate(split.words, {
      opacity: [0, 1],
      translateY: [40, 0],
      filter: ["blur(8px)", "blur(0px)"],
      duration: 800,
      delay: stagger(80),
      ease: "outExpo"
    })
  }, [])

  const maxTestimonialIndex = testimonials.length - visibleTestimonials
  return (
    <main className="min-h-screen bg-primary overflow-hidden">
      {/* SECTION 1 — NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/80 backdrop-blur-md border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-accent" />
                <span className="text-white font-bold text-xl">CareerOS</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#journey" className="text-white/70 hover:text-white text-sm transition">
                Features
              </a>
              <a href="#journey" className="text-white/70 hover:text-white text-sm transition">
                How It Works
              </a>
              <a href="#blog" className="text-white/70 hover:text-white text-sm transition">
                Blog
              </a>
            </div>
            <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"} className="bg-accent text-primary rounded-full px-4 py-1.5 font-bold text-sm hover:brightness-110 transition inline-block">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 2 — HERO */}
      <section className="min-h-[100vh] pt-32 lg:pt-40 pb-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start gap-12">

            {/* LEFT COLUMN — text content */}
            <div className="w-full lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center border border-accent/30 bg-accent/10 text-accent text-sm rounded-full px-4 py-1.5"
              >
                ✦ AI-Powered Career Platform for CSE Students
              </motion.div>

              <h1 id="hero-title" className="text-5xl lg:text-6xl font-bold mt-6 leading-tight text-left">
                Build & Launch Your
                <br />
                Career With
                <br />
                <span className="text-white">Career</span>
                <motion.span
                  className="text-accent inline-block"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  OS
                </motion.span>
              </h1>

              <p className="text-white/60 text-lg mt-4 max-w-lg leading-relaxed text-left">
                The all-in-one platform for CSE students to build skills, crack
                interviews, and land their dream internship.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"} className="bg-accent text-primary rounded-full px-8 py-3 font-bold hover:brightness-110 transition text-base inline-block">
                  Start For Free →
                </Link>
                <a href="#journey" className="border border-white/20 text-white rounded-full px-8 py-3 hover:border-white/40 transition text-base inline-block">
                  See How It Works
                </a>
              </div>

              <div className="mt-6 flex items-center">
                <div className="flex -space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                    alt="Student 1"
                    className="w-9 h-9 rounded-full object-cover border-2 border-[#0D1F0D]"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                    alt="Student 2"
                    className="w-9 h-9 rounded-full object-cover border-2 border-[#0D1F0D]"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face"
                    alt="Student 3"
                    className="w-9 h-9 rounded-full object-cover border-2 border-[#0D1F0D]"
                  />
                </div>
                <p className="ml-3 text-sm text-white/70">
                  Built for CSE students • 100% Free
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN — image with badges */}
            <motion.div
              className="w-full lg:w-1/2 relative min-h-[400px] lg:min-h-[500px] flex items-center justify-center lg:self-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="/images/students-hero.png"
                alt="CSE students building their career with CareerOS"
                className="w-full h-full object-contain max-h-[90%]"
              />

              <FloatingBadge
                delay={0}
                className="absolute top-4 right-4 bg-accent text-primary rounded-full px-3 py-1.5 text-sm font-bold shadow-lg"
              >
                ✓ ATS Score: 89%
              </FloatingBadge>
              <FloatingBadge
                delay={0.5}
                className="absolute top-4 left-4 bg-white text-primary rounded-full px-3 py-1.5 text-sm shadow-lg"
              >
                Quiz: OS 9/10
              </FloatingBadge>
              <FloatingBadge
                delay={1}
                className="absolute bottom-4 right-4 bg-white text-primary rounded-full px-3 py-1.5 text-sm shadow-lg"
              >
                Interview: Strong Yes
              </FloatingBadge>
              <FloatingBadge
                delay={1.5}
                className="absolute bottom-4 left-4 bg-accent text-primary rounded-full px-3 py-1.5 text-sm font-bold shadow-lg"
              >
                Roadmap: 3 weeks left
              </FloatingBadge>

              <motion.div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <a
                  href="#journey"
                  className="flex items-center justify-center w-10 h-10 bg-accent rounded-full shadow-lg"
                >
                  <ChevronDown className="w-5 h-5 text-primary" />
                </a>
              </motion.div>
            </motion.div>

          </div>

          <div className="mt-8">
            <p className="text-white/40 text-xs uppercase tracking-wider text-center">
              Trusted by students from
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {["NIT Rourkela", "KIIT", "VIT", "NIT Trichy", "BITS Pilani"].map(
                (name) => (
                  <span
                    key={name}
                    className="border border-white/10 text-white/50 text-xs px-3 py-1 rounded-full"
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — YOUR JOURNEY WITH CAREEROS */}
      <section id="journey" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left side — sticky preview */}
            <div className="lg:w-2/5 lg:sticky lg:top-24 lg:self-start">
              <span className="text-accent text-xs font-bold uppercase tracking-widest">
                YOUR JOURNEY
              </span>
              <h2 className="text-[#0D1F0D] text-4xl font-bold mt-3 leading-tight">
                From Confused Student
                <br />
                To Confident Intern
              </h2>
              <p className="text-[#4B5563] text-base mt-4 leading-relaxed">
                Follow the path. Click each step to explore the feature.
              </p>

              {/* Feature Preview Card */}
              <motion.div
                className="mt-8 bg-[#F0FDF4] border border-[#D1FAE5] rounded-2xl p-6 min-h-[200px]"
                animate={{ backgroundColor: hoveredStep !== null ? "#F0FDF4" : "#F0FDF4" }}
                transition={{ duration: 0.2 }}
              >
                {hoveredStep !== null ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {(() => {
                      const f = journeyFeatures[hoveredStep]
                      const IconComponent = f.icon
                      return (
                        <>
                          <div className="bg-white rounded-xl p-3 w-fit shadow-sm">
                            <IconComponent className="w-8 h-8 text-[#0D1F0D]" />
                          </div>
                          <h3 className="text-[#0D1F0D] text-xl font-bold mt-4">{f.title}</h3>
                          <p className="text-[#4B5563] text-sm mt-2 leading-relaxed">{f.desc}</p>
                          <span className="inline-block mt-3 bg-[#0D1F0D] text-white rounded-full text-xs px-3 py-1">
                            {f.badge}
                          </span>
                        </>
                      )
                    })()}
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[140px]">
                    <p className="text-[#0D1F0D]/50 text-sm">Hover a step to explore →</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right side — timeline */}
            <div className="lg:w-3/5">
              <div className="relative">
                {journeySteps.map((step, i) => (
                  <div
                    key={i}
                    className="relative pl-10 pb-8 last:pb-0"
                    onMouseEnter={() => setHoveredStep(i)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    {/* Dot */}
                    <div className="absolute left-[15px] top-2">
                      <motion.div
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          i === 5
                            ? "bg-[#C8FF00] w-4 h-4"
                            : hoveredStep === i
                            ? "bg-[#0D1F0D] w-4 h-4"
                            : "bg-[#E5E7EB]"
                        }`}
                      />
                    </div>

                    {/* SVG connecting line */}
                    {i < journeySteps.length - 1 && (
                      <div className="absolute left-[19px] top-5 w-[2px] bottom-0">
                        <div className="w-full h-full" style={{ backgroundColor: "#E5E7EB" }} />
                      </div>
                    )}

                    {/* Content */}
                    <motion.div
                      className={`rounded-xl px-4 py-3 transition-all duration-200 ${
                        hoveredStep === i ? "bg-[#F0FDF4]" : ""
                      }`}
                    >
                      <span
                        className={`text-xs uppercase tracking-wider transition-all duration-200 ${
                          hoveredStep === i ? "text-[#0D1F0D]" : "text-[#9CA3AF]"
                        }`}
                      >
                        {step.number}
                      </span>
                      <h3
                        className={`font-bold text-lg mt-1 transition-all duration-200 ${
                          i === 5 ? "text-[#0D1F0D]" : "text-[#0D1F0D]"
                        }`}
                      >
                        {i === 5 ? "Land Your Internship 🎯" : step.title}
                      </h3>
                      <p className="text-[#6B7280] text-sm mt-1 leading-relaxed">
                        {i === 5 ? "Apply to matched jobs with full confidence. Your journey complete!" : step.desc}
                      </p>
                    </motion.div>

                    {/* Left border indicator on hover */}
                    {hoveredStep === i && (
                      <motion.div
                        className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0D1F0D] rounded-full"
                        layoutId="stepBorder"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — STATS */}
      <section className="py-16 bg-white border-t border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="text-center py-8 md:py-0">
              <div className="text-5xl sm:text-6xl font-bold text-[#0D1F0D]">
                <AnimatedNumber value={500} suffix="+" />
              </div>
              <p className="text-[#6B7280] text-sm mt-2">Quizzes Generated</p>
            </div>
            <div className="text-center py-8 md:py-0 border-t md:border-t-0 md:border-l border-[#E5E7EB]">
              <div className="text-5xl sm:text-6xl font-bold text-[#9CA3AF]">
                <AnimatedNumber value={15} suffix="min+" />
              </div>
              <p className="text-[#6B7280] text-sm mt-2">Average Session Time</p>
            </div>
            <div className="text-center py-8 md:py-0 border-t md:border-t-0 md:border-l border-[#E5E7EB]">
              <div className="text-5xl sm:text-6xl font-bold text-[#0D1F0D]">
                <AnimatedNumber value={2000} suffix="+" />
              </div>
              <p className="text-[#6B7280] text-sm mt-2">
                Interview Questions Practiced
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — MARQUEE STRIP */}
      <section className="bg-accent py-6 overflow-hidden">
        <div className="marquee-track whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <span
              key={i}
              className="text-primary font-bold text-lg mx-4 uppercase tracking-wide"
            >
              DSA • Operating Systems • DBMS • Computer Networks • OOP • System
              Design • SQL • ATS Resume • Mock Interview • Career Roadmap •
            </span>
          ))}
        </div>
      </section>



      {/* SECTION 6 — FEATURED JOBS PREVIEW */}
      <section className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-accent text-xs font-bold uppercase tracking-widest">
              JOB BOARD
            </span>
            <h2 className="text-white text-4xl font-bold mt-3 leading-tight">
              Find Your Next
              <br />
              Internship Opportunity
            </h2>
          </div>

          {/* Search bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center bg-[#1E2E1E] border border-white/10 rounded-full px-6 py-3 gap-3">
              <Search className="w-5 h-5 text-accent" />
              <input
                type="text"
                placeholder="Search internships..."
                className="bg-transparent text-white placeholder-white/40 w-full outline-none text-sm"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="bg-[#C8FF00] text-[#0D1F0D] rounded-full px-4 py-1.5 text-xs font-bold">
              All
            </button>
            {["SDE Intern", "ML Intern", "Full Stack", "DevOps"].map(
              (cat) => (
                <button
                  key={cat}
                  className="border border-white/20 text-white/60 rounded-full px-4 py-1.5 text-xs hover:border-white/40 transition"
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Job cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="bg-[#1E2E1E] border border-white/8 rounded-xl p-5">
              <div className="w-10 h-10 rounded-full bg-[#C8FF00] flex items-center justify-center text-[#0D1F0D] font-bold text-sm">
                FK
              </div>
              <h3 className="text-white font-bold mt-4">
                SOFTWARE ENGINEER INTERN
              </h3>
              <p className="text-white/60 text-sm mt-1">Flipkart</p>
              <p className="text-white/40 text-xs mt-1">
                Bangalore • Remote
              </p>
              <div className="flex gap-2 mt-3">
                {["React", "Node.js", "AWS"].map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/5 rounded-full text-xs text-white/60 px-2.5 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"} className="mt-4 bg-[#C8FF00] text-[#0D1F0D] rounded-full text-sm font-bold py-2 px-4 w-full block text-center">
                Apply Now →
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-[#1E2E1E] border border-white/8 rounded-xl p-5">
              <div className="w-10 h-10 rounded-full bg-[#C8FF00] flex items-center justify-center text-[#0D1F0D] font-bold text-sm">
                GO
              </div>
              <h3 className="text-white font-bold mt-4">
                ML ENGINEER INTERN
              </h3>
              <p className="text-white/60 text-sm mt-1">Google</p>
              <p className="text-white/40 text-xs mt-1">
                Bangalore • Hybrid
              </p>
              <div className="flex gap-2 mt-3">
                {["Python", "TensorFlow", "NLP"].map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/5 rounded-full text-xs text-white/60 px-2.5 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"} className="mt-4 bg-[#C8FF00] text-[#0D1F0D] rounded-full text-sm font-bold py-2 px-4 w-full block text-center">
                Apply Now →
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-[#1E2E1E] border border-white/8 rounded-xl p-5">
              <div className="w-10 h-10 rounded-full bg-[#C8FF00] flex items-center justify-center text-[#0D1F0D] font-bold text-sm">
                AM
              </div>
              <h3 className="text-white font-bold mt-4">
                FULL STACK INTERN
              </h3>
              <p className="text-white/60 text-sm mt-1">Amazon</p>
              <p className="text-white/40 text-xs mt-1">
                Hyderabad • Remote
              </p>
              <div className="flex gap-2 mt-3">
                {["React", "Java", "Docker"].map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/5 rounded-full text-xs text-white/60 px-2.5 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"} className="mt-4 bg-[#C8FF00] text-[#0D1F0D] rounded-full text-sm font-bold py-2 px-4 w-full block text-center">
                Apply Now →
              </Link>
            </div>
          </div>

          {/* View All */}
          <div className="mt-8 text-center">
            <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"} className="border border-white text-white rounded-full px-8 py-3 font-bold text-sm hover:bg-white/10 transition inline-block">
              View All Jobs →
            </Link>
          </div>

          {/* Sidebar promo */}
          <div className="mt-8 bg-accent text-primary rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold">Your Next Internship</h3>
            <p className="text-primary/70 text-sm mt-2">
              is Just a Click Away!
            </p>
            <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"} className="mt-4 bg-primary text-white rounded-full px-6 py-2 font-bold text-sm hover:bg-secondary transition inline-block">
              Browse Jobs →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 7 — TESTIMONIALS */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-4 sm:mx-8 lg:mx-16 bg-[#FAFFE9] rounded-3xl px-8 py-16">
            <div className="text-center">
            <span className="text-[#0D1F0D] text-xs font-bold uppercase tracking-widest">
              TESTIMONIALS
            </span>
            <h2 className="text-[#0D1F0D] text-4xl font-bold mt-3 leading-tight">
              Why Students Love
              <br />
              CareerOS
            </h2>
            <p className="text-[#6B7280] text-base mt-3">
              Real stories from real students who landed their dream internship
            </p>
          </div>

          <div className="relative mt-12">
            <div className="overflow-hidden">
              <div
                className="flex gap-4 transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${testimonialIndex * (100 / visibleTestimonials)}%)` }}
              >
                {testimonials.map((t, i) => (
                  <div key={i} className="w-full md:w-1/2 lg:w-1/4 flex-shrink-0">
                    <div
                      className="bg-white border border-[#E5E7EB] rounded-2xl p-6 h-full"
                      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                    >
                      <p className="text-[#374151] text-sm leading-relaxed line-clamp-4">
                        {t.quote}
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        <img
                          src={t.photo}
                          alt={t.name}
                          className="rounded-full object-cover w-10 h-10"
                        />
                        <div>
                          <p className="text-[#0D1F0D] font-bold text-sm">
                            {t.name}
                          </p>
                          <p className="text-[#6B7280] text-xs mt-0.5">
                            {t.college}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                onClick={() => setTestimonialIndex(i => Math.max(0, i - 1))}
                className="bg-white border border-[#E5E7EB] rounded-full p-3 shadow-sm hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-5 h-5 text-[#0D1F0D]" />
              </button>
              <button
                onClick={() => setTestimonialIndex(i => i >= maxTestimonialIndex ? 0 : i + 1)}
                className="bg-[#0D1F0D] text-white rounded-full p-3 transition"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* SECTION 8 — BLOG PREVIEW */}
      <section id="blog" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-accent text-xs font-bold uppercase tracking-widest">
              RESOURCES
            </span>
            <h2 className="text-[#0D1F0D] text-4xl font-bold mt-3 leading-tight">
              Resources That Help You
              <br />
              Prepare With Intention
            </h2>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex justify-center gap-2">
            <button className="bg-accent text-primary rounded-full px-5 py-1.5 text-sm font-bold">
              Guides
            </button>
            <button className="text-[#6B7280] rounded-full px-5 py-1.5 text-sm hover:text-[#0D1F0D] transition">
              Articles
            </button>
          </div>

          {/* Blog cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div>
              <img
                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=300&fit=crop"
                alt="Student improving resume ATS score"
                className="w-full h-48 object-cover rounded-xl"
              />
              <h3 className="text-[#0D1F0D] font-bold mt-4 leading-snug">
                How I Improved My ATS Score From 45 to 89 in 2 Weeks
              </h3>
            </div>

            {/* Card 2 — Featured */}
            <div>
              <img
                src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600&h=300&fit=crop"
                alt="Mock interview preparation"
                className="w-full h-48 object-cover rounded-xl"
              />
              <h3 className="text-[#0D1F0D] font-bold mt-4 leading-snug">
                Complete Guide to CS Interview Preparation for 2026
              </h3>
            </div>

            {/* Card 3 */}
            <div>
              <img
                src="https://images.unsplash.com/photo-1586282391129-76a6df230234?w=600&h=300&fit=crop"
                alt="Resume writing tips"
                className="w-full h-48 object-cover rounded-xl"
              />
              <h3 className="text-[#0D1F0D] font-bold mt-4 leading-snug">
                Top 10 Resume Mistakes CSE Students Make
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 — CTA */}
      <section className="bg-[#FAFFE9] py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-[#0D1F0D] text-4xl sm:text-5xl font-bold leading-tight">
            Ready To Land Your
            <br />
            Dream Internship?
          </h2>
          <p className="text-[#4B5563] mt-4 leading-relaxed">
            Join thousands of CSE students already using CareerOS
          </p>
          <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"} className="mt-8 bg-[#0D1F0D] text-white rounded-full px-10 py-4 font-bold text-lg hover:bg-[#1A2B1A] transition inline-block">
            Get Started Free →
          </Link>
          <p className="text-[#6B7280] text-sm mt-4">
            <span className="text-[#0D1F0D] font-bold"><AnimatedNumber value={500} suffix="+" /></span> students •
            <span className="text-[#0D1F0D] font-bold"><AnimatedNumber value={95} suffix="%" /></span> success rate
          </p>
        </div>
      </section>

      {/* SECTION 10 — FOOTER */}
      <footer className="bg-primary border-t border-white/8 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Column 1 */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-accent" />
                <span className="text-white font-bold text-xl">CareerOS</span>
              </div>
              <p className="text-white/40 text-sm mt-2">
                Your AI-Powered Career OS
              </p>
              <div className="mt-4 space-y-1">
                <p className="text-white/70 text-sm">
                  <span className="text-accent">
                    <AnimatedNumber value={500} suffix="+" />
                  </span>{" "}
                  Students
                </p>
                <p className="text-white/70 text-sm">
                  <span className="text-accent">
                    <AnimatedNumber value={95} suffix="%" />
                  </span>{" "}
                  Success Rate
                </p>
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-white font-bold text-sm">Platform</h4>
              <ul className="mt-3 space-y-1.5">
                {["Features", "How It Works", "Job Board", "Blog"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-white/50 hover:text-white/80 text-sm transition"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-white font-bold text-sm">Practice</h4>
              <ul className="mt-3 space-y-1.5">
                {[
                  "ATS Checker",
                  "Quiz Engine",
                  "Mock Interview",
                  "Roadmap",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-white/50 hover:text-white/80 text-sm transition"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="text-white font-bold text-sm">Built For</h4>
              <ul className="mt-3 space-y-1.5">
                <li className="text-white/50 text-sm">Built for CSE students.</li>
                <li className="text-white/50 text-sm">Powered by AI.</li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/6 pt-4 mt-4 text-center">
            <p className="text-white/30 text-sm">
              © 2026 CareerOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
