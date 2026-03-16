'use client'

import { useState, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Lock, Users, Search, Filter } from 'lucide-react'
import type { RoomWithApplications, RoomStatus } from '@/lib/types'

interface RoomTableProps {
  rooms: RoomWithApplications[]
  onApply: (roomId: string, roomNumber: string) => void
  isLoggedIn: boolean
}

export function RoomTable({ rooms, onApply, isLoggedIn }: RoomTableProps) {
  const [blockFilter, setBlockFilter] = useState<string>('all')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const floors = useMemo(() => {
    const uniqueFloors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b)
    return uniqueFloors
  }, [rooms])

  const getRoomStatus = (room: RoomWithApplications): RoomStatus => {
    if (room.is_locked) return 'locked'
    if (room.applications.length > 0) return 'applied'
    return 'available'
  }

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'locked':
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <Lock className="mr-1 h-3 w-3" />
            Locked
          </Badge>
        )
      case 'applied':
        return (
          <Badge variant="default" className="bg-amber-500 text-amber-950 hover:bg-amber-500">
            <Users className="mr-1 h-3 w-3" />
            Applied
          </Badge>
        )
      case 'available':
        return (
          <Badge variant="default" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-500">
            Available
          </Badge>
        )
    }
  }

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const status = getRoomStatus(room)

      if (blockFilter !== 'all' && room.block !== blockFilter) return false
      if (floorFilter !== 'all' && room.floor !== parseInt(floorFilter)) return false
      if (roomTypeFilter !== 'all' && room.room_type !== roomTypeFilter) return false
      if (statusFilter !== 'all' && status !== statusFilter) return false
      if (searchQuery && !room.room_number.toLowerCase().includes(searchQuery.toLowerCase()))
        return false

      return true
    })
  }, [rooms, blockFilter, floorFilter, roomTypeFilter, statusFilter, searchQuery])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <Select value={blockFilter} onValueChange={setBlockFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Block" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Blocks</SelectItem>
            <SelectItem value="A">Block A</SelectItem>
            <SelectItem value="B">Block B</SelectItem>
            <SelectItem value="C">Block C</SelectItem>
            <SelectItem value="D">Block D</SelectItem>
            <SelectItem value="E">Block E</SelectItem>
          </SelectContent>
        </Select>

        <Select value={floorFilter} onValueChange={setFloorFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Floor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Floors</SelectItem>
            {floors.map((floor) => (
              <SelectItem key={floor} value={floor.toString()}>
                Floor {floor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Room Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="double">Double</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="locked">Locked</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search room number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No rooms found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredRooms.map((room) => {
                const status = getRoomStatus(room)
                return (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.room_number}</TableCell>
                    <TableCell>Block {room.block}</TableCell>
                    <TableCell>Floor {room.floor}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={room.room_type === 'single' ? 'border-blue-500 text-blue-600' : 'border-green-500 text-green-600'}>
                        {room.room_type === 'single' ? 'Single' : 'Double'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(status)}</TableCell>
                    <TableCell>
                      {room.applications.length > 0 ? (
                        <span className="text-sm">
                          {room.applications.length} applicant{room.applications.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {status !== 'locked' && (
                        <Button
                          size="sm"
                          variant={status === 'available' ? 'default' : 'outline'}
                          onClick={() => onApply(room.id, room.room_number)}
                          disabled={!isLoggedIn}
                        >
                          {isLoggedIn ? 'Apply' : 'Login to Apply'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredRooms.length} of {rooms.length} rooms
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span>Applied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted" />
            <span>Locked</span>
          </div>
        </div>
      </div>
    </div>
  )
}
