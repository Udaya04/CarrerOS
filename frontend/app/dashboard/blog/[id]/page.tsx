"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Heart, Trash2, Edit3, Send } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import {
  getBlog,
  toggleLike,
  addComment,
  deleteComment,
  deleteBlog,
  BlogResponse,
} from "@/lib/blog"
import ReactMarkdown from "react-markdown"

export default function BlogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [blog, setBlog] = useState<BlogResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [commenting, setCommenting] = useState(false)

  const blogId = params.id as string

  useEffect(() => {
    if (blogId) loadBlog()
  }, [blogId])

  async function loadBlog() {
    try {
      const data = await getBlog(blogId)
      setBlog(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function handleLike() {
    if (!blog) return
    try {
      const result = await toggleLike(blog.id)
      setBlog({ ...blog, is_liked: result.liked, likes_count: result.likes_count })
    } catch {
      // silent
    }
  }

  async function handleAddComment() {
    if (!blog || !commentText.trim()) return
    setCommenting(true)
    try {
      const newComment = await addComment(blog.id, commentText.trim())
      setBlog({ ...blog, comments: [newComment, ...blog.comments], comments_count: blog.comments_count + 1 })
      setCommentText("")
    } catch {
      // silent
    } finally {
      setCommenting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!blog) return
    try {
      await deleteComment(commentId)
      setBlog({
        ...blog,
        comments: blog.comments.filter((c) => c.id !== commentId),
        comments_count: blog.comments_count - 1,
      })
    } catch {
      // silent
    }
  }

  async function handleDeleteBlog() {
    if (!blog || !confirm("Delete this blog post?")) return
    try {
      await deleteBlog(blog.id)
      router.push("/dashboard/blog")
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B7280]">Blog not found.</p>
        <Link href="/dashboard/blog" className="text-[#0D1F0D] font-medium underline mt-2 inline-block">
          Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard/blog"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1F0D] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      {blog.cover_image && (
        <img
          src={blog.cover_image}
          alt={blog.title}
          className="w-full rounded-2xl max-h-64 object-cover mb-6"
        />
      )}

      {blog.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {blog.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full bg-[#C8FF00]/20 text-[#0D1F0D] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <h1 className="text-2xl font-bold text-[#0D1F0D] mb-3">{blog.title}</h1>

      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-[#6B7280]">
          {blog.author_name} &middot;{" "}
          {blog.created_at ? new Date(blog.created_at).toLocaleDateString() : ""}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition ${
              blog.is_liked ? "text-red-500" : "text-[#6B7280] hover:text-red-500"
            }`}
          >
            <Heart className={`w-5 h-5 ${blog.is_liked ? "fill-red-500" : ""}`} />
            {blog.likes_count}
          </button>
          {user?.id === blog.author_id && (
            <>
              <Link
                href={`/dashboard/blog/${blog.id}/edit`}
                className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1F0D] transition"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={handleDeleteBlog}
                className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-red-500 transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="prose prose-sm max-w-none text-[#374151] mb-12">
        <ReactMarkdown>{blog.content}</ReactMarkdown>
      </div>

      <div className="border-t border-[#E5E7EB] pt-8">
        <h3 className="text-lg font-bold text-[#0D1F0D] mb-6">
          Comments ({blog.comments_count})
        </h3>

        <div className="flex gap-3 mb-8">
          <div className="w-9 h-9 rounded-full bg-[#0D1F0D] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="w-full border border-[#E5E7EB] rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8FF00] focus:border-transparent"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || commenting}
              className="mt-2 bg-[#0D1F0D] text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 hover:bg-[#1A2B1A] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              {commenting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>

        {blog.comments.length === 0 ? (
          <p className="text-[#9CA3AF] text-sm text-center py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          <div className="space-y-5">
            {blog.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0D1F0D] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {comment.author_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-[#0D1F0D]">
                      {comment.author_name}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">
                      {comment.created_at
                        ? new Date(comment.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-[#374151]">{comment.content}</p>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-[#9CA3AF] hover:text-red-500 transition flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
