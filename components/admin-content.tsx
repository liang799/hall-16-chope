'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Switch } from '@/components/ui/switch'
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
import { Lock, Unlock, Users, Building2, Shield, Trash2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, RoomWithApplications } from '@/lib/types'

interface AdminContentProps {
  rooms: RoomWithApplications[]
  profiles: Profile[]
}

export function AdminContent({ rooms, profiles }: AdminContentProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null)

  const handleToggleRoomLock = async (roomId: string, currentLocked: boolean) => {
    setIsLoading(roomId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('rooms')
        .update({ is_locked: !currentLocked })
        .eq('id', roomId)

      if (error) {
        console.error('Error updating room:', error)
        return
      }

      router.refresh()
    } finally {
      setIsLoading(null)
    }
  }

  const handleToggleAdmin = async (profileId: string, currentAdmin: boolean) => {
    setIsLoading(profileId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentAdmin })
        .eq('id', profileId)

      if (error) {
        console.error('Error updating profile:', error)
        return
      }

      router.refresh()
    } finally {
      setIsLoading(null)
    }
  }

  const handleDeleteAllApplications = async (roomId: string) => {
    setIsLoading(roomId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('room_id', roomId)

      if (error) {
        console.error('Error deleting applications:', error)
        return
      }

      router.refresh()
    } finally {
      setIsLoading(null)
      setDeleteConfirm(null)
    }
  }

  const roomsWithApplications = rooms.filter(r => r.applications.length > 0)
  const totalApplications = rooms.reduce((sum, r) => sum + r.applications.length, 0)
  const lockedRooms = rooms.filter(r => r.is_locked).length

  const exportToExcel = () => {
    // Create CSV content (compatible with Excel)
    const headers = [
      'Room Number',
      'Block',
      'Floor',
      'Applicant Name',
      'Applicant Contact',
      'Occupant Name',
      'Point Provider',
      'Points',
      'Type',
      'Previous Room',
      'Applied At'
    ]

    const rows: string[][] = []
    
    roomsWithApplications.forEach(room => {
      room.applications.forEach(app => {
        rows.push([
          room.room_number,
          room.block,
          room.floor.toString(),
          app.applicant_name,
          app.applicant_contact,
          app.occupant_name,
          app.point_provider_name,
          app.point_value.toString(),
          app.is_hall_internal ? 'Hall Internal' : 'Hall External',
          app.previous_room || '-',
          new Date(app.created_at).toLocaleString()
        ])
      })
    })

    // Sort by room number, then by points (desc), then by hall internal
    rows.sort((a, b) => {
      if (a[0] !== b[0]) return a[0].localeCompare(b[0])
      const aInternal = a[8] === 'Hall Internal' ? 1 : 0
      const bInternal = b[8] === 'Hall Internal' ? 1 : 0
      if (aInternal !== bInternal) return bInternal - aInternal
      return parseInt(b[7]) - parseInt(a[7])
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Add BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `hall16-applications-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportLeaderboard = () => {
    // Export the leaderboard with winners highlighted
    const headers = [
      'Room Number',
      'Block',
      'Floor',
      'Winner Name',
      'Winner Contact',
      'Winner Points',
      'Winner Type',
      'Total Applications'
    ]

    const rows: string[][] = []
    
    roomsWithApplications.forEach(room => {
      // Sort applications by deconfliction rules
      const sorted = [...room.applications].sort((a, b) => {
        // Hall internal wins over external
        if (a.is_hall_internal !== b.is_hall_internal) {
          return a.is_hall_internal ? -1 : 1
        }
        // Higher points wins
        if (a.point_value !== b.point_value) {
          return b.point_value - a.point_value
        }
        // Earlier application wins
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

      const winner = sorted[0]
      if (winner) {
        rows.push([
          room.room_number,
          room.block,
          room.floor.toString(),
          winner.applicant_name,
          winner.applicant_contact,
          winner.point_value.toString(),
          winner.is_hall_internal ? 'Hall Internal' : 'Hall External',
          room.applications.length.toString()
        ])
      }
    })

    // Sort by room number
    rows.sort((a, b) => a[0].localeCompare(b[0]))

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `hall16-leaderboard-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Manage rooms, applications, and user permissions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rooms</CardDescription>
            <CardTitle className="text-3xl">{rooms.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Locked Rooms</CardDescription>
            <CardTitle className="text-3xl">{lockedRooms}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Applications</CardDescription>
            <CardTitle className="text-3xl">{totalApplications}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Registered Users</CardDescription>
            <CardTitle className="text-3xl">{profiles.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rooms" className="gap-2">
            <Building2 className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <Users className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Shield className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Room Management</CardTitle>
              <CardDescription>
                Lock or unlock rooms to control applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Lock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.slice(0, 50).map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.room_number}</TableCell>
                      <TableCell>Block {room.block}</TableCell>
                      <TableCell>Floor {room.floor}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{room.applications.length}</Badge>
                      </TableCell>
                      <TableCell>
                        {room.is_locked ? (
                          <Badge variant="secondary">
                            <Lock className="mr-1 h-3 w-3" />
                            Locked
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-500">
                            <Unlock className="mr-1 h-3 w-3" />
                            Open
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={room.is_locked}
                          onCheckedChange={() => handleToggleRoomLock(room.id, room.is_locked)}
                          disabled={isLoading === room.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rooms.length > 50 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing first 50 rooms. Use filters to find specific rooms.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Applications by Room</CardTitle>
                  <CardDescription>
                    View and manage all room applications
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={exportToExcel}
                    disabled={roomsWithApplications.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={exportLeaderboard}
                    disabled={roomsWithApplications.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Winners
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {roomsWithApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mb-4 opacity-50" />
                  <p>No applications submitted yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {roomsWithApplications.map((room) => (
                    <Card key={room.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{room.room_number}</CardTitle>
                            <CardDescription>
                              {room.applications.length} application{room.applications.length > 1 ? 's' : ''}
                            </CardDescription>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirm({ 
                              type: 'room-apps', 
                              id: room.id, 
                              name: room.room_number 
                            })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Applicant</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Occupant</TableHead>
                              <TableHead>Point Provider</TableHead>
                              <TableHead>Points</TableHead>
                              <TableHead>Type</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {room.applications.map((app) => (
                              <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.applicant_name}</TableCell>
                                <TableCell>{app.applicant_contact}</TableCell>
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
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user permissions and admin access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telegram</TableHead>
                    <TableHead>Current Room</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.display_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>{profile.telegram_handle || '-'}</TableCell>
                      <TableCell>{profile.current_room || '-'}</TableCell>
                      <TableCell>
                        {profile.is_admin ? (
                          <Badge variant="default">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={profile.is_admin}
                          onCheckedChange={() => handleToggleAdmin(profile.id, profile.is_admin)}
                          disabled={isLoading === profile.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Applications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all applications for room {deleteConfirm?.name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteAllApplications(deleteConfirm.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
