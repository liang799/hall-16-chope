'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { Save, User } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface ProfileContentProps {
  user: Profile
}

export function ProfileContent({ user }: ProfileContentProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    displayName: user.display_name || '',
    telegramHandle: user.telegram_handle || '',
    whatsappHandle: user.whatsapp_handle || '',
    currentRoom: user.current_room || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: formData.displayName,
          telegram_handle: formData.telegramHandle || null,
          whatsapp_handle: formData.whatsappHandle || null,
          current_room: formData.currentRoom || null,
        })
        .eq('id', user.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <main className="container py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile Settings</h1>
        <p className="text-muted-foreground text-lg">
          Update your personal information and contact details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            This information will be visible to hall administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-emerald-500 text-emerald-600">
                <AlertDescription>Profile updated successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                placeholder="Your name"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telegramHandle">Telegram Handle</Label>
                <Input
                  id="telegramHandle"
                  value={formData.telegramHandle}
                  onChange={(e) => handleChange('telegramHandle', e.target.value)}
                  placeholder="@username"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappHandle">WhatsApp Number</Label>
                <Input
                  id="whatsappHandle"
                  value={formData.whatsappHandle}
                  onChange={(e) => handleChange('whatsappHandle', e.target.value)}
                  placeholder="+65..."
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentRoom">Current Room</Label>
              <Input
                id="currentRoom"
                value={formData.currentRoom}
                onChange={(e) => handleChange('currentRoom', e.target.value)}
                placeholder="e.g., A-05-12"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Your current room number if you are already a Hall 16 resident
              </p>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
