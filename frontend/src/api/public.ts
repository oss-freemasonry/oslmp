// Public API client — no auth headers, separate from the admin api client

const BASE = '/api/public'

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(BASE + path, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export class ConflictError extends Error {
  constructor(public readonly data: AlreadyRsvpdError) { super('conflict') }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 409) {
    const data = await res.json()
    throw new ConflictError(data as AlreadyRsvpdError)
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { message?: string }).message ?? `${res.status} ${res.statusText}`)
  }
  return res.json()
}

export interface PublicLodge {
  lodgeName: string
  logoUrl: string | null
  summary: string | null
  consecratedAt: string | null
  themePrimaryColor: string | null
  themeSecondaryColor: string | null
  themeAccentColor: string | null
  themeFont: string | null
}

export type PublicEventType = 'Meeting' | 'LodgeOfInstruction' | 'Social' | 'Other'
export type AttendeeStatus = 'Attending' | 'Apologies'

export interface PublicEvent {
  id: string
  type: PublicEventType
  title: string | null
  date: string
  time: string | null
  location: string | null
  summary: string | null
  diningEnabled: boolean
  diningTime: string | null
  diningLocation: string | null
}

export interface PublicCourseOption {
  id: string
  name: string
  supplement: number | null
}

export interface PublicCourse {
  id: string
  name: string
  options: PublicCourseOption[]
}

export interface PublicUpgrade {
  id: string
  name: string
  price: number | null
}

export interface PublicEventDetail extends PublicEvent {
  diningPrice: number | null
  diningNotes: string | null
  diningCourses: PublicCourse[]
  diningUpgrades: PublicUpgrade[]
}

export interface RsvpRequest {
  name: string
  email: string
  status: AttendeeStatus
  diningAttending: boolean
  courseSelections: { courseId: string; optionId: string }[]
  upgradeSelections: string[]
  force?: boolean
}

export interface RsvpResult {
  attendeeId: string
  personId: string
  personName: string
  isNewGuest: boolean
}

export interface AlreadyRsvpdError {
  alreadyRsvpd: true
  status: AttendeeStatus
  personName: string
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

export const publicApi = {
  lodge:          ()               => get<PublicLodge>('/lodge'),
  upcomingEvents: (limit?: number) => get<PublicEvent[]>('/events', limit ? { limit: String(limit) } : undefined),
  event:          (id: string)     => get<PublicEventDetail>(`/events/${id}`),
  rsvp:           (id: string, body: RsvpRequest) => post<RsvpResult>(`/events/${id}/rsvp`, body),
  latestPosts:    (limit?: number) => get<PublicPostSummary[]>('/posts', limit ? { limit: String(limit) } : undefined),
  post:           (id: string)     => get<PublicPostDetail>(`/posts/${id}`),
}
