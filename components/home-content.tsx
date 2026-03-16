'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoomTable } from '@/components/room-table'
import { Leaderboard } from '@/components/leaderboard'
import { ApplicationForm } from '@/components/application-form'
import { Building2, Trophy, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Profile, RoomWithApplications } from '@/lib/types'

interface HomeContentProps {
  rooms: RoomWithApplications[]
  user: Profile | null
}

export function HomeContent({ rooms, user }: HomeContentProps) {
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; number: string } | null>(null)

  const handleApply = (roomId: string, roomNumber: string) => {
    setSelectedRoom({ id: roomId, number: roomNumber })
  }

  const handleCloseForm = () => {
    setSelectedRoom(null)
  }

  return (
    <main className="container px-4 md:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Hall 16 Room Deconfliction</h1>
        <p className="text-muted-foreground text-lg">
          View available rooms, submit applications, and track the deconfliction process.
        </p>
      </div>

      {!user && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Welcome!</AlertTitle>
          <AlertDescription>
            Log in or sign up to submit room applications. You can browse available rooms without an account.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rooms" className="gap-2">
            <Building2 className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <RoomTable
            rooms={rooms}
            onApply={handleApply}
            isLoggedIn={!!user}
          />
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard rooms={rooms} />
        </TabsContent>
      </Tabs>

      {selectedRoom && (
        <ApplicationForm
          roomId={selectedRoom.id}
          roomNumber={selectedRoom.number}
          open={true}
          onClose={handleCloseForm}
        />
      )}
    </main>
  )
}
