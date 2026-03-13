import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { AdminContent } from '@/components/admin-content'
import type { Profile, RoomWithApplications, ApplicationWithApplicant } from '@/lib/types'

async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

async function getAllRooms(): Promise<RoomWithApplications[]> {
  const supabase = await createClient()
  
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*')
    .order('block')
    .order('floor')
    .order('room_number')

  if (roomsError) {
    console.error('Error fetching rooms:', roomsError)
    return []
  }

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      applicant:profiles(*)
    `)

  const roomsWithApps = rooms.map(room => ({
    ...room,
    applications: (applications || [])
      .filter(app => app.room_id === room.id)
      .map(app => ({
        ...app,
        room,
      })) as ApplicationWithApplicant[],
  }))

  return roomsWithApps
}

async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name')

  if (error) {
    console.error('Error fetching profiles:', error)
    return []
  }

  return data
}

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (!user.is_admin) {
    redirect('/')
  }

  const [rooms, profiles] = await Promise.all([getAllRooms(), getAllProfiles()])

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <AdminContent rooms={rooms} profiles={profiles} />
    </div>
  )
}
