import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { AdminContent } from '@/components/admin-content'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { Profile, RoomWithApplications, ApplicationWithApplicant } from '@/lib/types'

type Result<T> = 
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string }

async function getCurrentUser(): Promise<Result<Profile | null>> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // AuthSessionMissingError is expected when user is not logged in
    if (authError || !user) {
      return { success: true, data: null, error: null }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return { success: true, data: null, error: null }
      }
      console.error('Error fetching profile:', profileError)
      return { success: false, data: null, error: `Could not load profile: ${profileError.message}` }
    }

    return { success: true, data: profile, error: null }
  } catch {
    return { success: true, data: null, error: null }
  }
}

async function getAllRooms(): Promise<Result<RoomWithApplications[]>> {
  try {
    const supabase = await createClient()
    
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .order('block')
      .order('floor')
      .order('room_number')

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError)
      return { success: false, data: null, error: `Could not load rooms: ${roomsError.message}` }
    }

    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles(*)
      `)

    if (appsError) {
      console.error('Error fetching applications:', appsError)
      // Still return rooms but without applications
      return { 
        success: true, 
        data: rooms.map(room => ({ ...room, applications: [] })) as RoomWithApplications[],
        error: null 
      }
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

    return { success: true, data: roomsWithApps, error: null }
  } catch (err) {
    console.error('Unexpected error fetching rooms:', err)
    return { success: false, data: null, error: 'An unexpected error occurred while loading rooms' }
  }
}

async function getAllProfiles(): Promise<Result<Profile[]>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('display_name')

    if (error) {
      console.error('Error fetching profiles:', error)
      return { success: false, data: null, error: `Could not load profiles: ${error.message}` }
    }

    return { success: true, data: data, error: null }
  } catch (err) {
    console.error('Unexpected error fetching profiles:', err)
    return { success: false, data: null, error: 'An unexpected error occurred while loading profiles' }
  }
}

function ErrorDisplay({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  )
}

export default async function AdminPage() {
  const userResult = await getCurrentUser()

  if (!userResult.success) {
    return <ErrorDisplay title="Error" message={userResult.error} />
  }

  if (!userResult.data) {
    redirect('/auth/login')
  }

  if (!userResult.data.is_admin) {
    redirect('/')
  }

  const [roomsResult, profilesResult] = await Promise.all([getAllRooms(), getAllProfiles()])

  if (!roomsResult.success) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={userResult.data} />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Rooms</AlertTitle>
            <AlertDescription>{roomsResult.error}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  if (!profilesResult.success) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={userResult.data} />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Profiles</AlertTitle>
            <AlertDescription>{profilesResult.error}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={userResult.data} />
      <AdminContent rooms={roomsResult.data} profiles={profilesResult.data} />
    </div>
  )
}
