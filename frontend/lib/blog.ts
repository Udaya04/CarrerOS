import api from "./axios"

export interface BlogSummary {
  id: string
  title: string
  cover_image?: string
  tags: string[]
  published: boolean
  author_name: string
  likes_count: number
  comments_count: number
  is_liked: boolean
  created_at?: string
}

export interface CommentResponse {
  id: string
  blog_id: string
  user_id: string
  content: string
  author_name: string
  created_at?: string
}

export interface BlogResponse {
  id: string
  title: string
  content: string
  cover_image?: string
  tags: string[]
  published: boolean
  author_id: string
  author_name: string
  likes_count: number
  comments_count: number
  is_liked: boolean
  created_at?: string
  updated_at?: string
  comments: CommentResponse[]
}

export async function getBlogs(): Promise<BlogSummary[]> {
  const res = await api.get<BlogSummary[]>("/blog/")
  return res.data
}

export async function getBlog(id: string): Promise<BlogResponse> {
  const res = await api.get<BlogResponse>(`/blog/${id}`)
  return res.data
}

export async function createBlog(data: {
  title: string
  content: string
  cover_image?: string
  tags?: string[]
  published?: boolean
}): Promise<BlogResponse> {
  const res = await api.post<BlogResponse>("/blog/", data)
  return res.data
}

export async function updateBlog(
  id: string,
  data: {
    title?: string
    content?: string
    cover_image?: string
    tags?: string[]
    published?: boolean
  }
): Promise<BlogResponse> {
  const res = await api.put<BlogResponse>(`/blog/${id}`, data)
  return res.data
}

export async function deleteBlog(id: string): Promise<void> {
  await api.delete(`/blog/${id}`)
}

export async function toggleLike(id: string): Promise<{ liked: boolean; likes_count: number }> {
  const res = await api.post<{ liked: boolean; likes_count: number }>(`/blog/${id}/like`)
  return res.data
}

export async function getComments(id: string): Promise<CommentResponse[]> {
  const res = await api.get<CommentResponse[]>(`/blog/${id}/comments`)
  return res.data
}

export async function addComment(id: string, content: string): Promise<CommentResponse> {
  const res = await api.post<CommentResponse>(`/blog/${id}/comments`, { content })
  return res.data
}

export async function deleteComment(id: string): Promise<void> {
  await api.delete(`/blog/comments/${id}`)
}
