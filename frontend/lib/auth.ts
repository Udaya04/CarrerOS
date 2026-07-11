import api from "./axios"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  college?: string
  target_role?: string
  skill_scores: Record<string, number>
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

interface AuthResponse {
  token: string
  user: UserProfile
}

interface SignUpData {
  email: string
  password: string
  full_name: string
  college?: string
  target_role?: string
}

export async function signUp(data: SignUpData): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/signup", data)
  return res.data
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", { email, password })
  return res.data
}

export interface UpdateProfileData {
  full_name?: string
  college?: string
  target_role?: string
  avatar_url?: string
}

export async function getCurrentUser(): Promise<UserProfile> {
  const res = await api.get<UserProfile>("/auth/me")
  return res.data
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<UserProfile> {
  const res = await api.patch<UserProfile>("/auth/profile", data)
  return res.data
}
