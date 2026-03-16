'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Award, Users, CheckCircle } from 'lucide-react'
import type { ApplicationWithApplicant, RoomWithApplications } from '@/lib/types'

interface LeaderboardProps {
  rooms: RoomWithApplications[]
}

interface RoomLeaderboardEntry {
  room: RoomWithApplications
  applications: ApplicationWithApplicant[]
  winner: ApplicationWithApplicant | null
  hasConflict: boolean
}

function determineWinner(applications: ApplicationWithApplicant[]): ApplicationWithApplicant | null {
  if (applications.length === 0) return null
  if (applications.length === 1) return applications[0]

  // Sort by: 1. Hall internal (true first), 2. Point value (higher first), 3. Created at (earlier first)
  const sorted = [...applications].sort((a, b) => {
    // Hall internal takes priority
    if (a.is_hall_internal !== b.is_hall_internal) {
      return a.is_hall_internal ? -1 : 1
    }
    // Higher points win
    if (a.point_value !== b.point_value) {
      return b.point_value - a.point_value
    }
    // Earlier application wins (tie-breaker)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return sorted[0]
}

export function Leaderboard({ rooms }: LeaderboardProps) {
  const roomsWithApplications = useMemo(() => {
    return rooms
      .filter((room) => room.applications.length > 0 && !room.is_locked)
      .map((room) => ({
        room,
        applications: room.applications,
        winner: determineWinner(room.applications),
        hasConflict: room.applications.length > 1,
      }))
      .sort((a, b) => b.applications.length - a.applications.length)
  }, [rooms])

  const stats = useMemo(() => {
    const totalApplications = rooms.reduce((sum, r) => sum + r.applications.length, 0)
    const roomsWithConflict = roomsWithApplications.filter((r) => r.hasConflict).length
    const uniqueApplicants = new Set(
      rooms.flatMap((r) => r.applications.map((a) => a.applicant_id))
    ).size

    return { totalApplications, roomsWithConflict, uniqueApplicants }
  }, [rooms, roomsWithApplications])

  const getRankIcon = (index: number) => {
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

  if (roomsWithApplications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Room Leaderboard
          </CardTitle>
          <CardDescription>
            No applications have been submitted yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p>Applications will appear here once submitted</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Applications</CardDescription>
            <CardTitle className="text-3xl">{stats.totalApplications}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rooms with Conflicts</CardDescription>
            <CardTitle className="text-3xl">{stats.roomsWithConflict}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unique Applicants</CardDescription>
            <CardTitle className="text-3xl">{stats.uniqueApplicants}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Room Leaderboard
          </CardTitle>
          <CardDescription>
            Rooms ranked by number of applications. Winners determined by: Hall Internal {'>'} Points {'>'} First Applied.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Current Winner</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomsWithApplications.map((entry, index) => (
                <TableRow key={entry.room.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getRankIcon(index)}
                      <span>{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/room/${entry.room.id}`} className="hover:underline">
                      {entry.room.room_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {entry.applications.length} applicant{entry.applications.length > 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.winner ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <Link href={`/user/${entry.winner.applicant_id}`} className="hover:underline">
                          {entry.winner.applicant_name}
                        </Link>
                        {entry.winner.is_hall_internal && (
                          <Badge variant="outline" className="text-xs">
                            Internal
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.winner ? entry.winner.point_value : '-'}
                  </TableCell>
                  <TableCell>
                    {entry.hasConflict ? (
                      <Badge variant="destructive" className="bg-amber-500 text-amber-950 hover:bg-amber-500">
                        Conflict
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-500">
                        Clear
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
