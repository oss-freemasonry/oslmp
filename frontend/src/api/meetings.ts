import { api } from './client'

export type MeetingType = 'Meeting' | 'LodgeOfInstruction' | 'Social' | 'Other'
export type AttendeeStatus = 'Invited' | 'Attending' | 'Apologies'
export type DocumentType = 'Summons' | 'Agenda' | 'Minutes' | 'Notice' | 'Correspondence' | 'Other'

export interface MeetingSummary {
  id: string
  type: MeetingType
  title: string | null
  date: string
  time: string | null
  location: string | null
  summary: string | null
  notes: string | null
  diningEnabled: boolean
  diningTime: string | null
  diningLocation: string | null
  createdAt: string
  // Counts
  attendingCount: number
  apologiesCount: number
  invitedCount: number
  awaitingCount: number
}

export interface DiningUpgrade {
  id: string
  name: string
  price: number | null
}

export interface DiningCourseOption {
  id: string
  name: string
  supplement: number | null
}

export interface DiningCourse {
  id: string
  name: string
  options: DiningCourseOption[]
}

export interface Attendee {
  id: string
  personId: string
  personFirstName: string
  personLastName: string
  status: AttendeeStatus
  diningAttending: boolean
  courseSelections: { courseId: string; optionId: string }[]
  upgradeSelections: string[]
}

export interface MeetingDocument {
  id: string
  type: DocumentType
  name: string
  originalFileName: string
  contentType: string
  fileSize: number
  isPublic: boolean
  createdAt: string
}

export interface Meeting extends MeetingSummary {
  diningPrice: number | null
  diningNotes: string | null
  diningUpgrades: DiningUpgrade[]
  diningCourses: DiningCourse[]
  attendees: Attendee[]
  documents: MeetingDocument[]
}

export interface MeetingPayload {
  type: MeetingType
  title?: string
  date: string
  time?: string
  location?: string
  summary?: string
  notes?: string
}

export interface DiningPayload {
  enabled: boolean
  time?: string
  location?: string
  price?: number
  notes?: string
  upgrades: { name: string; price?: number }[]
  courses: { name: string; options: { name: string }[] }[]
}

export interface RsvpPayload {
  personId: string
  status: AttendeeStatus
  diningAttending: boolean
  courseSelections: { courseId: string; optionId: string }[]
  upgradeSelections: string[]
}

export const TYPE_LABELS: Record<MeetingType, string> = {
  Meeting: 'General Meeting',
  LodgeOfInstruction: 'Lodge of Instruction',
  Social: 'Social',
  Other: 'Other',
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

export function meetingDisplayName(m: Pick<MeetingSummary, 'type' | 'title' | 'date'>): string {
  if ((m.type === 'Social' || m.type === 'Other') && m.title) return m.title
  const d = new Date(m.date)
  const day = ordinal(d.getUTCDate())
  const month = d.toLocaleDateString('en-GB', { month: 'long' })
  return `${TYPE_LABELS[m.type]} - ${day} ${month}`
}

export const TYPE_COLOURS: Record<MeetingType, { bg: string; text: string; dot: string }> = {
  Meeting:            { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500'  },
  LodgeOfInstruction: { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500'  },
  Social:             { bg: 'bg-teal-50',    text: 'text-teal-700',    dot: 'bg-teal-500'    },
  Other:              { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400'   },
}

export interface SyncInvitesResult {
  attendees: Attendee[]
  invitedCount: number
  attendingCount: number
  apologiesCount: number
  awaitingCount: number
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  Summons:        'Summons',
  Agenda:         'Agenda',
  Minutes:        'Minutes',
  Notice:         'Notice',
  Correspondence: 'Correspondence',
  Other:          'Other',
}

export const DOCUMENT_TYPE_COLOURS: Record<DocumentType, { bg: string; text: string }> = {
  Summons:        { bg: 'bg-indigo-50',  text: 'text-indigo-700'  },
  Agenda:         { bg: 'bg-violet-50',  text: 'text-violet-700'  },
  Minutes:        { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Notice:         { bg: 'bg-amber-50',   text: 'text-amber-700'   },
  Correspondence: { bg: 'bg-sky-50',     text: 'text-sky-700'     },
  Other:          { bg: 'bg-slate-100',  text: 'text-slate-600'   },
}

export const DOCUMENT_TYPES: DocumentType[] = ['Summons', 'Agenda', 'Minutes', 'Notice', 'Correspondence', 'Other']

export const meetingsApi = {
  list:           ()                                => api.get<MeetingSummary[]>('/meetings'),
  get:            (id: string)                      => api.get<Meeting>(`/meetings/${id}`),
  create:         (p: MeetingPayload)               => api.post<{ id: string }>('/meetings', p),
  update:         (id: string, p: MeetingPayload)   => api.put<Meeting>(`/meetings/${id}`, p),
  updateDining:   (id: string, p: DiningPayload)    => api.put<Meeting>(`/meetings/${id}/dining`, p),
  syncInvites:    (id: string, personIds: string[]) => api.put<SyncInvitesResult>(`/meetings/${id}/invites`, { personIds }),
  rsvp:           (id: string, p: RsvpPayload)      => api.post<Attendee>(`/meetings/${id}/rsvp`, p),
  removeRsvp:     (id: string, attendeeId: string)  => api.delete<void>(`/meetings/${id}/rsvp/${attendeeId}`),
  remove:         (id: string)                      => api.delete<void>(`/meetings/${id}`),
  uploadDocument:  (id: string, form: FormData)             => api.upload<MeetingDocument>(`/meetings/${id}/documents`, form),
  updateDocument:  (id: string, docId: string, isPublic: boolean) =>
    api.patch<MeetingDocument>(`/meetings/${id}/documents/${docId}`, { isPublic }),
  deleteDocument:  (id: string, docId: string)              => api.delete<void>(`/meetings/${id}/documents/${docId}`),
  documentFileUrl: (id: string, docId: string)              => `/api/meetings/${id}/documents/${docId}/file`,
}
