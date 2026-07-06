"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Heart, MessageCircle, Plus, BookOpen } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { getBlogs, toggleLike, BlogSummary } from "@/lib/blog"

export default function BlogPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [blogs, setBlogs] = useState<BlogSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBlogs()
  }, [])

  async function loadBlogs() {
    try {
      const data = await getBlogs()
      setBlogs(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    e.preventDefault()
    try {
      const result = await toggleLike(id)
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, is_liked: result.liked, likes_count: result.likes_count } : b
        )
      )
    } catch {
      // silent
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F0D]">Blog</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Tips, guides, and insights for your career journey
          </p>
        </div>
        {user && (
          <Link
            href="/dashboard/blog/create"
            className="bg-[#0D1F0D] text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#1A2B1A] transition"
          >
            <Plus className="w-4 h-4" />
            Write Post
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 flex flex-col items-center justify-center gap-4">
          <div className="bg-[#F9FAFB] rounded-full p-6">
            <BookOpen className="w-10 h-10 text-[#9CA3AF]" />
          </div>
          <p className="text-[#9CA3AF] text-center max-w-sm">
            No blogs yet. Check back soon for new articles!
          </p>
          {user && (
            <Link
              href="/dashboard/blog/create"
              className="bg-[#0D1F0D] text-white rounded-full px-6 py-2.5 text-sm font-bold hover:bg-[#1A2B1A] transition"
            >
              Create the first post
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/dashboard/blog/${blog.id}`}
              className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              {blog.cover_image ? (
                <img
                  src={blog.cover_image}
                  alt={blog.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-[#0D1F0D] to-[#2d5a2d]" />
              )}
              <div className="p-5">
                {blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {blog.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-[#C8FF00]/20 text-[#0D1F0D] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <h3 className="font-bold text-[#0D1F0D] line-clamp-2 mb-2 group-hover:text-[#2d5a2d] transition">
                  {blog.title}
                </h3>
                <p className="text-xs text-[#6B7280] mb-3">
                  {blog.author_name} &middot; {blog.created_at ? new Date(blog.created_at).toLocaleDateString() : ""}
                </p>
                <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                  <button
                    onClick={(e) => handleLike(e, blog.id)}
                    className={`flex items-center gap-1 transition ${
                      blog.is_liked ? "text-red-500" : "hover:text-red-500"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${blog.is_liked ? "fill-red-500" : ""}`} />
                    {blog.likes_count}
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {blog.comments_count}
                  </span>
                  <span className="ml-auto text-[#0D1F0D] font-medium text-xs">
                    Read More &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
