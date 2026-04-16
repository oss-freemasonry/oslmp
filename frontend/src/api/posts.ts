import { api } from './client'

export interface PostSummary {
  id: string
  title: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PostDetail extends PostSummary {
  content: string
}

export interface PublicPostSummary {
  id: string
  title: string
  publishedAt: string
  updatedAt: string
}

export interface PublicPostDetail {
  id: string
  title: string
  content: string
  publishedAt: string
}

export const postsApi = {
  list:   ()                            => api.get<PostSummary[]>('/posts'),
  get:    (id: string)                  => api.get<PostDetail>(`/posts/${id}`),
  create: (body: { title: string; content: string; isPublished: boolean }) =>
    api.post<PostDetail>('/posts', body),
  update: (id: string, body: { title: string; content: string; isPublished: boolean }) =>
    api.put<PostDetail>(`/posts/${id}`, body),
  delete: (id: string)                  => api.delete(`/posts/${id}`),
}
