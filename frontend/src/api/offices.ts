import { api } from './client'

export interface PersonOffice {
  id: string
  personId: string
  role: string
  startedAt: string
  endedAt?: string
  notes?: string
}

// Mirrors LodgeRoles.All on the backend — UGLE standard offices in order of precedence
export const LODGE_ROLES = [
  'Worshipful Master',
  'Immediate Past Master',
  'Senior Warden',
  'Junior Warden',
  'Treasurer',
  'Secretary',
  'Chaplain',
  'Director of Ceremonies',
  'Assistant Director of Ceremonies',
  'Senior Deacon',
  'Junior Deacon',
  'Inner Guard',
  'Organist',
  'Tyler',
  'Almoner',
  'Charity Steward',
  'Senior Steward',
  'Junior Steward',
  'Mentor',
] as const

export const officesApi = {
  list:    (personId: string)                         => api.get<PersonOffice[]>(`/people/${personId}/offices`),
  appoint: (personId: string, role: string, notes?: string) =>
    api.post<PersonOffice>(`/people/${personId}/offices`, { role, notes }),
  end:     (personId: string, officeId: string)       => api.delete<PersonOffice>(`/people/${personId}/offices/${officeId}`),
}
