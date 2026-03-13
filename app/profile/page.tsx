import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { ProfileContent } from '@/components/profile-content'
import type { Profile } from '@/lib/types'

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

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <ProfileContent user={user} />
    </div>
  )
}
