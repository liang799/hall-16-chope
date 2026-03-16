import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { MyApplicationsContent } from '@/components/my-applications-content'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { Profile, ApplicationWithApplicant } from '@/lib/types'

type Result<T> = 
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string }

async function getCurrentUser(): Promise<Result<Profile | null>> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Error getting user:', authError)
      return { success: false, data: null, error: `Authentication error: ${authError.message}` }
    }
    
    if (!user) {
      return { success: true, data: null, error: null }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return { success: false, data: null, error: `Could not load profile: ${profileError.message}` }
    }

    return { success: true, data: profile, error: null }
  } catch (err) {
    console.error('Unexpected error getting user:', err)
    return { success: false, data: null, error: 'An unexpected error occurred' }
  }
}

async function getUserApplications(userId: string): Promise<Result<ApplicationWithApplicant[]>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles(*),
        room:rooms(*)
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      return { success: false, data: null, error: `Could not load applications: ${error.message}` }
    }

    return { success: true, data: data as ApplicationWithApplicant[], error: null }
  } catch (err) {
    console.error('Unexpected error fetching applications:', err)
    return { success: false, data: null, error: 'An unexpected error occurred while loading applications' }
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

export default async function MyApplicationsPage() {
  const userResult = await getCurrentUser()

  if (!userResult.success) {
    return <ErrorDisplay title="Error" message={userResult.error} />
  }

  if (!userResult.data) {
    redirect('/auth/login')
  }

  const applicationsResult = await getUserApplications(userResult.data.id)

  if (!applicationsResult.success) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={userResult.data} />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Applications</AlertTitle>
            <AlertDescription>{applicationsResult.error}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={userResult.data} />
      <MyApplicationsContent applications={applicationsResult.data} />
    </div>
  )
}
