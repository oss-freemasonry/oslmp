import { api } from './client'

export type PersonType = 'Member' | 'Guest'
export type PersonStatus = 'Active' | 'Inactive'

export interface PersonSummary {
  id: string
  firstName: string
  lastName: string
  type: PersonType
  status: PersonStatus
  email?: string
  phone?: string
  createdAt: string
  activeOffices: string[]
}

export interface Person extends PersonSummary {
  addressLine1?: string
  addressLine2?: string
  city?: string
  county?: string
  postcode?: string
  notes?: string
}

export interface CreatePersonPayload {
  firstName: string
  lastName: string
  type: PersonType
  email?: string
  phone?: string
}

export interface UpdatePersonPayload {
  firstName: string
  lastName: string
  type: PersonType
  status: PersonStatus
  email?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  county?: string
  postcode?: string
  notes?: string
}

export const peopleApi = {
  list: ()                              => api.get<PersonSummary[]>('/people'),
  get:  (id: string)                   => api.get<Person>(`/people/${id}`),
  create: (p: CreatePersonPayload)     => api.post<Person>('/people', p),
  update: (id: string, p: UpdatePersonPayload) => api.put<Person>(`/people/${id}`, p),
  remove: (id: string)                 => api.delete<void>(`/people/${id}`),
}
