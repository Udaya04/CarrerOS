import api from "./axios"

export interface RoadmapTopic {
  title: string
  description: string
  duration: string
  resources: { name: string; url: string }[]
}

export interface RoadmapCategory {
  title: string
  description: string
  duration: string
  topics: RoadmapTopic[]
}

export interface RoadmapResponse {
  id: string
  topic: string
  target_role?: string
  categories: RoadmapCategory[]
  created_at?: string
}

export interface RoadmapSummary {
  id: string
  topic: string
  target_role?: string
  created_at?: string
}

export async function generateRoadmap(
  topic: string,
  target_role?: string
): Promise<RoadmapResponse> {
  const res = await api.post<RoadmapResponse>(
    "/roadmap/generate",
    { topic, target_role }
  )
  return res.data
}

export async function getRoadmapHistory(): Promise<RoadmapSummary[]> {
  const res = await api.get<RoadmapSummary[]>("/roadmap/history")
  return res.data
}

export async function getRoadmap(id: string): Promise<RoadmapResponse> {
  const res = await api.get<RoadmapResponse>(`/roadmap/${id}`)
  return res.data
}

export async function deleteRoadmap(id: string): Promise<void> {
  await api.delete(`/roadmap/${id}`)
}
