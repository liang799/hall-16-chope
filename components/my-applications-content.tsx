'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2, ClipboardList, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ApplicationWithApplicant } from '@/lib/types'
import Link from 'next/link'

interface MyApplicationsContentProps {
  applications: ApplicationWithApplicant[]
}

export function MyApplicationsContent({ applications }: MyApplicationsContentProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', deleteId)

      if (error) {
        console.error('Error deleting application:', error)
        return
      }

      router.refresh()
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Applications</h1>
        <p className="text-muted-foreground text-lg">
          View and manage your room applications.
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Applications</CardTitle>
            <CardDescription>You haven{"'"}t submitted any room applications yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mb-4 opacity-50" />
              <p className="mb-4">Start by browsing available rooms</p>
              <Link href="/">
                <Button>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Rooms
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Applications ({applications.length})</CardTitle>
            <CardDescription>
              Manage your submitted room applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Occupant</TableHead>
                  <TableHead>Point Provider</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.room?.room_number || 'Unknown'}
                    </TableCell>
                    <TableCell>{app.applicant_name}</TableCell>
                    <TableCell>{app.occupant_name}</TableCell>
                    <TableCell>{app.point_provider_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{app.point_value}</Badge>
                    </TableCell>
                    <TableCell>
                      {app.is_hall_internal ? (
                        <Badge variant="default" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-500">
                          Internal
                        </Badge>
                      ) : (
                        <Badge variant="outline">External</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(app.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(app.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
