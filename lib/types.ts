export interface Room {
  id: string
  room_number: string
  block: string
  floor: number
  room_type: 'single' | 'double'
  is_locked: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  display_name: string | null
  telegram_handle: string | null
  whatsapp_handle: string | null
  current_room: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  room_id: string
  applicant_id: string
  applicant_name: string
  applicant_contact: string
  occupant_name: string
  point_provider_name: string
  point_value: number
  is_hall_internal: boolean
  previous_room: string | null
  created_at: string
  updated_at: string
}

export interface RoomWithApplications extends Room {
  applications: ApplicationWithApplicant[]
}

export interface ApplicationWithApplicant extends Application {
  applicant: Profile
  room: Room
}

export type RoomStatus = 'available' | 'applied' | 'locked'

export interface DeconflictionResult {
  room_id: string
  room_number: string
  winner: ApplicationWithApplicant | null
  all_applications: ApplicationWithApplicant[]
  reason: string
}
