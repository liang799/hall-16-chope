import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, User, Mail, MessageCircle, Phone, Home, Calendar } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Profile, ApplicationWithApplicant } from '@/lib/types'

interface Result<T> {
  success: boolean
  data: T | null
  error: string | null
}

async function getPublicProfile(userId: string): Promise<Result<Profile>> {
  try {
    const supabase = await createClient()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, data: null, error: 'User not found' }
      }
      return { success: false, data: null, error: `Could not load profile: ${error.message}` }
    }

    return { success: true, data: profile, error: null }
  } catch {
    return { success: false, data: null, error: 'An unexpected error occurred' }
  }
}

async function getUserApplications(userId: string): Promise<Result<ApplicationWithApplicant[]>> {
  try {
    const supabase = await createClient()
    
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles!applications_applicant_id_fkey(*),
        room:rooms!applications_room_id_fkey(*)
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, data: null, error: `Could not load applications: ${error.message}` }
    }

    return { success: true, data: applications as unknown as ApplicationWithApplicant[], error: null }
  } catch {
    return { success: false, data: null, error: 'An unexpected error occurred' }
  }
}

async function getCurrentUser(): Promise<Result<Profile | null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: true, data: null, error: null }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return { success: true, data: profile, error: null }
  } catch {
    return { success: true, data: null, error: null }
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const [profileResult, applicationsResult, currentUserResult] = await Promise.all([
    getPublicProfile(id),
    getUserApplications(id),
    getCurrentUser(),
  ])

  if (!profileResult.success || !profileResult.data) {
    notFound()
  }

  const profile = profileResult.data
  const applications = applicationsResult.success ? applicationsResult.data || [] : []
  const currentUser = currentUserResult.success ? currentUserResult.data : null

  return (
    <div className="min-h-screen bg-background">
      <Header user={currentUser} />
      <main className="container px-4 md:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {profile.display_name || 'Anonymous User'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.current_room && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Current Room</p>
                      <p className="font-medium">{profile.current_room}</p>
                    </div>
                  </div>
                )}
                
                {profile.telegram_handle && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telegram</p>
                      <p className="font-medium">@{profile.telegram_handle}</p>
                    </div>
                  </div>
                )}
                
                {profile.whatsapp_handle && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="font-medium">{profile.whatsapp_handle}</p>
                    </div>
                  </div>
                )}
              </div>

              {!profile.current_room && !profile.telegram_handle && !profile.whatsapp_handle && (
                <p className="text-muted-foreground text-center py-4">
                  This user has not added any contact information yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Room Applications</CardTitle>
              <CardDescription>
                {applications.length} active application{applications.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  This user has not applied for any rooms yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/room/${app.room_id}`}
                      className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{app.room.room_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Applied {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {app.point_value} pts
                          </Badge>
                          {app.is_hall_internal && (
                            <Badge variant="secondary">Internal</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
