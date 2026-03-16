'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
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
import { Lock, Users, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { RoomWithApplications, RoomStatus } from '@/lib/types'

interface RoomTableProps {
  rooms: RoomWithApplications[]
  onApply: (roomId: string, roomNumber: string) => void
  isLoggedIn: boolean
}

const columnHelper = createColumnHelper<RoomWithApplications>()

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

export function RoomTable({ rooms, onApply, isLoggedIn }: RoomTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [blockFilter, setBlockFilter] = useState<string>('all')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const floors = useMemo(() => {
    const uniqueFloors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b)
    return uniqueFloors
  }, [rooms])

  // Filter data based on custom filters
  const filteredData = useMemo(() => {
    return rooms.filter((room) => {
      const status = getRoomStatus(room)
      if (blockFilter !== 'all' && room.block !== blockFilter) return false
      if (floorFilter !== 'all' && room.floor !== parseInt(floorFilter)) return false
      if (roomTypeFilter !== 'all' && room.room_type !== roomTypeFilter) return false
      if (statusFilter !== 'all' && status !== statusFilter) return false
      return true
    })
  }, [rooms, blockFilter, floorFilter, roomTypeFilter, statusFilter])

  const columns = useMemo<ColumnDef<RoomWithApplications, unknown>[]>(
    () => [
      columnHelper.accessor('room_number', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Room
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
        filterFn: 'includesString',
      }),
      columnHelper.accessor('block', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Block
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => `Block ${info.getValue()}`,
      }),
      columnHelper.accessor('floor', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Floor
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => `Floor ${info.getValue()}`,
      }),
      columnHelper.accessor('room_type', {
        header: 'Type',
        cell: (info) => (
          <Badge
            variant="outline"
            className={
              info.getValue() === 'single'
                ? 'border-blue-500 text-blue-600'
                : 'border-green-500 text-green-600'
            }
          >
            {info.getValue() === 'single' ? 'Single' : 'Double'}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = getRoomStatus(row.original)
          return getStatusBadge(status)
        },
      }),
      columnHelper.accessor('applications', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Applications
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => {
          const count = info.getValue().length
          return count > 0 ? (
            <span className="text-sm">
              {count} applicant{count > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">None</span>
          )
        },
        sortingFn: (rowA, rowB) =>
          rowA.original.applications.length - rowB.original.applications.length,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const status = getRoomStatus(row.original)
          if (status === 'locked') return null
          return (
            <div className="text-right">
              <Button
                size="sm"
                variant={status === 'available' ? 'default' : 'outline'}
                onClick={() => onApply(row.original.id, row.original.room_number)}
                disabled={!isLoggedIn}
              >
                {isLoggedIn ? 'Apply' : 'Login to Apply'}
              </Button>
            </div>
          )
        },
      }),
    ],
    [onApply, isLoggedIn]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

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
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No rooms found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Showing {table.getRowModel().rows.length} of {filteredData.length} rooms
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

        <div className="flex items-center gap-2">
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
