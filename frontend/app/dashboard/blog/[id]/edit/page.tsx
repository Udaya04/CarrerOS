"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, X } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { getBlog, updateBlog } from "@/lib/blog"
import ReactMarkdown from "react-markdown"

export default function EditBlogPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [title, setTitle] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [content, setContent] = useState("")
  const [published, setPublished] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const blogId = params.id as string

  useEffect(() => {
    if (blogId) loadBlog()
  }, [blogId])

  async function loadBlog() {
    try {
      const blog = await getBlog(blogId)
      if (user && blog.author_id !== user.id) {
        router.replace("/dashboard/blog")
        return
      }
      setTitle(blog.title)
      setContent(blog.content)
      setCoverImage(blog.cover_image || "")
      setTags(blog.tags)
      setPublished(blog.published)
    } catch {
      router.push("/dashboard/blog")
    } finally {
      setLoading(false)
    }
  }

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && tagsInput.trim()) {
      e.preventDefault()
      const newTag = tagsInput.trim()
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag])
      }
      setTagsInput("")
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    try {
      const blog = await updateBlog(blogId, {
        title: title.trim(),
        content: content.trim(),
        cover_image: coverImage.trim() || undefined,
        tags,
        published,
      })
      router.push(`/dashboard/blog/${blog.id}`)
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="h-96 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/dashboard/blog/${blogId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1F0D] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      <h1 className="text-2xl font-bold text-[#0D1F0D] mb-8">Edit Blog Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Blog title..."
          className="w-full text-xl font-bold border-0 border-b-2 border-[#E5E7EB] pb-3 bg-transparent focus:outline-none focus:border-[#0D1F0D] transition placeholder:text-[#9CA3AF]"
          required
        />

        <input
          type="url"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="Cover image URL (optional)"
          className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8FF00] focus:border-transparent"
        />

        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-[#C8FF00]/20 text-[#0D1F0D] font-medium"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Type a tag and press Enter..."
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8FF00] focus:border-transparent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#0D1F0D]">Content (Markdown)</label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-[#6B7280] hover:text-[#0D1F0D] flex items-center gap-1 transition"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? "Edit" : "Preview"}
            </button>
          </div>
          {showPreview ? (
            <div className="min-h-96 border border-[#E5E7EB] rounded-xl p-4 prose prose-sm max-w-none overflow-y-auto">
              <ReactMarkdown>{content || "*Nothing to preview yet*"}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog content in markdown..."
              className="w-full min-h-96 border border-[#E5E7EB] rounded-xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C8FF00] focus:border-transparent resize-y"
              required
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#C8FF00] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0D1F0D]" />
          </label>
          <span className="text-sm text-[#6B7280]">Published</span>
        </div>

        <button
          type="submit"
          disabled={!title.trim() || !content.trim() || submitting}
          className="w-full bg-[#0D1F0D] text-white rounded-full py-3 font-bold hover:bg-[#1A2B1A] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Updating..." : "Update Blog"}
        </button>
      </form>
    </div>
  )
}
