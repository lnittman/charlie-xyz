'use client'

import { useAtom } from 'jotai'
import { useState } from 'react'
import { 
  viewModeAtom, 
  searchQueryAtom, 
  sortByAtom, 
  statusFilterAtom,
  searchModalOpenAtom 
} from '@/atoms/dashboard'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuItem } from './dropdown-menu'
import { 
  Search, 
  LayoutGrid, 
  List, 
  ArrowUpDown, 
  Filter,
  X,
  Check
} from 'lucide-react'

interface CharlieToolbarProps {
  totalCount: number
  filteredCount: number
}

export function CharlieToolbar({ totalCount, filteredCount }: CharlieToolbarProps) {
  const [viewMode, setViewMode] = useAtom(viewModeAtom)
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const [sortBy, setSortBy] = useAtom(sortByAtom)
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)
  const [, setSearchModalOpen] = useAtom(searchModalOpenAtom)

  return (
    <div className="sticky top-14 z-20 bg-[#010101]/80 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          {/* Search - Desktop */}
          <div className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workflows..."
                className="w-full h-9 pl-10 pr-10 text-sm bg-black border border-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Search - Mobile Icon Button */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="sm:hidden w-9 h-9 flex items-center justify-center bg-black border border-gray-800 text-gray-400 hover:text-white rounded-lg hover:border-gray-700 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu
              trigger={
                <button
                  className={cn(
                    "flex items-center justify-center w-9 h-9 text-sm rounded-lg border transition-all",
                    statusFilter !== 'all' 
                      ? "bg-[#ABF716]/10 border-[#ABF716]/30 text-[#ABF716]"
                      : "bg-black border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                  )}
                >
                  <Filter className="w-4 h-4" />
                </button>
              }
              align="right"
              className="w-48"
            >
              <div className="py-1">
                {(['all', 'active', 'idle', 'completed', 'blocked'] as const).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    selected={statusFilter === status}
                  >
                    <div className="flex items-center justify-between">
                      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      {statusFilter === status && <Check className="w-4 h-4" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu
              trigger={
                <button
                  className={cn(
                    "flex items-center justify-center w-9 h-9 text-sm rounded-lg border transition-all",
                    sortBy !== 'recent' 
                      ? "bg-[#ABF716]/10 border-[#ABF716]/30 text-[#ABF716]"
                      : "bg-black border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                  )}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              }
              align="right"
              className="w-48"
            >
              <div className="py-1">
                <DropdownMenuItem
                  onClick={() => setSortBy('recent')}
                  selected={sortBy === 'recent'}
                >
                  <div className="flex items-center justify-between">
                    <span>Recent</span>
                    {sortBy === 'recent' && <Check className="w-4 h-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy('alphabetical')}
                  selected={sortBy === 'alphabetical'}
                >
                  <div className="flex items-center justify-between">
                    <span>Alphabetical (A-Z)</span>
                    {sortBy === 'alphabetical' && <Check className="w-4 h-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy('status')}
                  selected={sortBy === 'status'}
                >
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    {sortBy === 'status' && <Check className="w-4 h-4" />}
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenu>

            {/* View Toggle - Desktop only */}
            <div className="hidden sm:flex items-center bg-black border border-gray-800 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "flex items-center justify-center w-8 h-8 m-0.5 transition-all rounded",
                  viewMode === 'grid'
                    ? "bg-[#ABF716]/10 text-[#ABF716]"
                    : "text-gray-400 hover:text-white hover:bg-gray-900"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center justify-center w-8 h-8 m-0.5 transition-all rounded",
                  viewMode === 'list'
                    ? "bg-[#ABF716]/10 text-[#ABF716]"
                    : "text-gray-400 hover:text-white hover:bg-gray-900"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Count */}
            <div className="flex items-center gap-1 px-3 py-1.5 text-sm bg-black border border-gray-800 rounded-lg">
              <span className="text-[#ABF716] font-mono font-medium">{filteredCount}</span>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400 font-mono">{totalCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}