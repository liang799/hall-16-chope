import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { HomeContent } from '@/components/home-content'
import type { Profile, RoomWithApplications, ApplicationWithApplicant } from '@/lib/types'

async function getRooms(): Promise<RoomWithApplications[]> {
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

  const { data: applications, error: appsError } = await supabase
    .from('applications')
    .select(`
      *,
      applicant:profiles(*)
    `)

  if (appsError) {
    console.error('Error fetching applications:', appsError)
    return rooms.map(room => ({ ...room, applications: [] }))
  }

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

export default async function HomePage() {
  const [rooms, user] = await Promise.all([getRooms(), getCurrentUser()])

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <HomeContent rooms={rooms} user={user} />
    </div>
  )
}
