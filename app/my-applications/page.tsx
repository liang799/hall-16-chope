import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { MyApplicationsContent } from '@/components/my-applications-content'
import type { Profile, ApplicationWithApplicant } from '@/lib/types'

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

async function getUserApplications(userId: string): Promise<ApplicationWithApplicant[]> {
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
    return []
  }

  return data as ApplicationWithApplicant[]
}

export default async function MyApplicationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  const applications = await getUserApplications(user.id)

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <MyApplicationsContent applications={applications} />
    </div>
  )
}
