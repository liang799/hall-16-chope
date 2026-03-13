'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { InfoIcon } from 'lucide-react'

interface ApplicationFormProps {
  roomId: string
  roomNumber: string
  open: boolean
  onClose: () => void
}

export function ApplicationForm({ roomId, roomNumber, open, onClose }: ApplicationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProxy, setIsProxy] = useState(false)
  
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantContact: '',
    occupantName: '',
    pointProviderName: '',
    pointValue: '',
    isHallInternal: true,
    previousRoom: '',
    confirmAccuracy: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.confirmAccuracy) {
      setError('Please confirm that all information is accurate')
      return
    }

    const pointValue = parseInt(formData.pointValue)
    if (isNaN(pointValue) || pointValue < 0) {
      setError('Please enter a valid point value (0 or greater)')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to apply')
        return
      }

      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          room_id: roomId,
          applicant_id: user.id,
          applicant_name: formData.applicantName,
          applicant_contact: formData.applicantContact,
          occupant_name: formData.occupantName,
          point_provider_name: formData.pointProviderName,
          point_value: pointValue,
          is_hall_internal: formData.isHallInternal,
          previous_room: formData.previousRoom || null,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('You have already applied for this room')
        } else {
          setError(insertError.message)
        }
        return
      }

      onClose()
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Room {roomNumber}</DialogTitle>
          <DialogDescription>
            Fill in the application details. You can apply on behalf of someone else (proxy application).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Proxy Application</CardTitle>
                  <CardDescription>
                    Enable if applying on behalf of someone else
                  </CardDescription>
                </div>
                <Switch
                  checked={isProxy}
                  onCheckedChange={setIsProxy}
                />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Applicant Details</CardTitle>
              <CardDescription>
                {isProxy ? 'Information of the person who will occupy the room' : 'Your information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="applicantName">
                    {isProxy ? 'Actual Applicant Name' : 'Your Name'} *
                  </Label>
                  <Input
                    id="applicantName"
                    value={formData.applicantName}
                    onChange={(e) => handleInputChange('applicantName', e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicantContact">
                    Contact (Telegram/WhatsApp) *
                  </Label>
                  <Input
                    id="applicantContact"
                    value={formData.applicantContact}
                    onChange={(e) => handleInputChange('applicantContact', e.target.value)}
                    placeholder="@username or +65..."
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Room Transfer Details</CardTitle>
              <CardDescription>
                Information about the current occupant and points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="occupantName">Current Occupant Name *</Label>
                  <Input
                    id="occupantName"
                    value={formData.occupantName}
                    onChange={(e) => handleInputChange('occupantName', e.target.value)}
                    placeholder="Name of person moving out"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointProviderName">Point Provider Name *</Label>
                  <Input
                    id="pointProviderName"
                    value={formData.pointProviderName}
                    onChange={(e) => handleInputChange('pointProviderName', e.target.value)}
                    placeholder="Person providing points"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pointValue">Point Value *</Label>
                  <Input
                    id="pointValue"
                    type="number"
                    min="0"
                    value={formData.pointValue}
                    onChange={(e) => handleInputChange('pointValue', e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previousRoom">Previous Room (if any)</Label>
                  <Input
                    id="previousRoom"
                    value={formData.previousRoom}
                    onChange={(e) => handleInputChange('previousRoom', e.target.value)}
                    placeholder="e.g., A-05-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hall Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hall Internal Transfer</Label>
                  <p className="text-sm text-muted-foreground">
                    Is the applicant currently a Hall 16 resident?
                  </p>
                </div>
                <Switch
                  checked={formData.isHallInternal}
                  onCheckedChange={(checked) => handleInputChange('isHallInternal', checked)}
                />
              </div>
              
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Hall internal transfers have priority over external applicants in deconfliction.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id="confirmAccuracy"
              checked={formData.confirmAccuracy}
              onCheckedChange={(checked) => 
                handleInputChange('confirmAccuracy', checked === true)
              }
            />
            <div className="space-y-1">
              <Label htmlFor="confirmAccuracy" className="font-normal cursor-pointer">
                I confirm that all information provided is accurate
              </Label>
              <p className="text-sm text-muted-foreground">
                False information may result in application rejection
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
