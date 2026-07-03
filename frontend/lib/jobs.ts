import api from "./axios"

export interface JobResponse {
  id: string
  external_id: string
  title: string
  company: string
  location?: string
  job_type?: string
  description?: string
  apply_url?: string
  salary?: string
  posted_at?: string
  fetched_at?: string
}

export interface JobSearchResponse {
  jobs: JobResponse[]
  total: number
  page: number
  cached: boolean
}

export interface SavedJobResponse {
  id: string
  job: JobResponse
  saved_at: string
}

export interface AppliedJobResponse {
  id: string
  job: JobResponse
  applied_at: string
}

export async function searchJobs(
  q: string,
  location?: string,
  page = 1
): Promise<JobSearchResponse> {
  const params: Record<string, string | number> = { q, page }
  if (location) params.location = location
  const res = await api.get<JobSearchResponse>("/jobs/search", { params })
  return res.data
}

export async function saveJob(jobId: string): Promise<SavedJobResponse> {
  const res = await api.post<SavedJobResponse>(`/jobs/save/${jobId}`)
  return res.data
}

export async function getSavedJobs(): Promise<SavedJobResponse[]> {
  const res = await api.get<SavedJobResponse[]>("/jobs/saved")
  return res.data
}

export async function removeSavedJob(jobId: string): Promise<void> {
  await api.delete(`/jobs/saved/${jobId}`)
}

export async function applyJob(jobId: string): Promise<AppliedJobResponse> {
  const res = await api.post<AppliedJobResponse>(`/jobs/apply/${jobId}`)
  return res.data
}

export async function getAppliedJobs(): Promise<AppliedJobResponse[]> {
  const res = await api.get<AppliedJobResponse[]>("/jobs/applied")
  return res.data
}
