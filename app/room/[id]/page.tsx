import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertCircle, Trophy, Medal, Award, Lock, CheckCircle, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Profile, RoomWithApplications, ApplicationWithApplicant } from '@/lib/types'

interface Result<T> {
  success: boolean
  data: T | null
  error: string | null
}

async function getRoomWithApplications(roomId: string): Promise<Result<RoomWithApplications>> {
  try {
    const supabase = await createClient()
    
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        return { success: false, data: null, error: 'Room not found' }
      }
      return { success: false, data: null, error: `Could not load room: ${roomError.message}` }
    }

    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles!applications_applicant_id_fkey(*),
        room:rooms!applications_room_id_fkey(*)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (appError) {
      return { success: false, data: null, error: `Could not load applications: ${appError.message}` }
    }

    return {
      success: true,
      data: {
        ...room,
        applications: applications as unknown as ApplicationWithApplicant[],
      },
      error: null,
    }
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

function determineWinner(applications: ApplicationWithApplicant[]): ApplicationWithApplicant | null {
  if (applications.length === 0) return null
  if (applications.length === 1) return applications[0]

  const sorted = [...applications].sort((a, b) => {
    if (a.is_hall_internal !== b.is_hall_internal) {
      return a.is_hall_internal ? -1 : 1
    }
    if (a.point_value !== b.point_value) {
      return b.point_value - a.point_value
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return sorted[0]
}

function getRankIcon(index: number) {
  switch (index) {
    case 0:
      return <Trophy className="h-4 w-4 text-amber-500" />
    case 1:
      return <Medal className="h-4 w-4 text-zinc-400" />
    case 2:
      return <Award className="h-4 w-4 text-amber-700" />
    default:
      return null
  }
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const [roomResult, currentUserResult] = await Promise.all([
    getRoomWithApplications(id),
    getCurrentUser(),
  ])

  if (!roomResult.success || !roomResult.data) {
    notFound()
  }

  const room = roomResult.data
  const currentUser = currentUserResult.success ? currentUserResult.data : null
  const winner = room.is_locked ? null : determineWinner(room.applications)

  // Sort applications for display (same order as winner determination)
  const sortedApplications = [...room.applications].sort((a, b) => {
    if (a.is_hall_internal !== b.is_hall_internal) {
      return a.is_hall_internal ? -1 : 1
    }
    if (a.point_value !== b.point_value) {
      return b.point_value - a.point_value
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return (
    <div className="min-h-screen bg-background">
      <Header user={currentUser} />
      <main className="container px-4 md:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rooms
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    {room.room_number}
                    {room.is_locked && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Locked
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Block {room.block} | Floor {room.floor} | {room.room_type === 'single' ? 'Single Room' : 'Double Room'}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-3xl font-bold">{room.applications.length}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {room.is_locked ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  This room is locked and not accepting applications.
                </p>
              </CardContent>
            </Card>
          ) : room.applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  No applications have been submitted for this room yet.
                </p>
                {currentUser && (
                  <Button asChild className="mt-4">
                    <Link href={`/?apply=${room.id}`}>Apply for this Room</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {winner && (
                <Card className="border-emerald-500/50 bg-emerald-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-5 w-5" />
                      Current Winner
                    </CardTitle>
                    <CardDescription>
                      Based on: Hall Internal {'>'} Points {'>'} First Applied
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <Link 
                            href={`/user/${winner.applicant_id}`}
                            className="font-semibold text-lg hover:underline"
                          >
                            {winner.applicant_name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            {winner.is_hall_internal && (
                              <Badge variant="secondary">Hall Internal</Badge>
                            )}
                            <Badge variant="outline">{winner.point_value} points</Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/user/${winner.applicant_id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>All Applicants</CardTitle>
                  <CardDescription>
                    {room.applications.length} applicant{room.applications.length !== 1 ? 's' : ''} ranked by priority
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead className="text-right">Profile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedApplications.map((app, index) => (
                        <TableRow key={app.id} className={index === 0 ? 'bg-emerald-500/5' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRankIcon(index)}
                              <span className="font-medium">{index + 1}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Link 
                                href={`/user/${app.applicant_id}`}
                                className="font-medium hover:underline"
                              >
                                {app.applicant_name}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                Occupant: {app.occupant_name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {app.applicant_contact}
                          </TableCell>
                          <TableCell>
                            {app.is_hall_internal ? (
                              <Badge variant="secondary">Internal</Badge>
                            ) : (
                              <Badge variant="outline">External</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{app.point_value}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(app.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/user/${app.applicant_id}`}>
                                <User className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
