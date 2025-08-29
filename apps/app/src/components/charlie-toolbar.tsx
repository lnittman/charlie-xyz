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
import { 
  Search, 
  LayoutGrid, 
  List, 
  SortAscending, 
  Filter,
  X
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
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="sticky top-[65px] z-20 bg-[#010101]/80 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
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

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all",
                statusFilter !== 'all' 
                  ? "bg-[#ABF716]/10 border-[#ABF716]/30 text-[#ABF716]"
                  : "bg-black border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {statusFilter !== 'all' && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-[#ABF716]/20 rounded">
                  {statusFilter}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none flex items-center gap-2 px-3 py-1.5 pr-8 text-sm bg-black border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] cursor-pointer"
              >
                <option value="recent">Recent</option>
                <option value="alphabetical">A-Z</option>
                <option value="status">Status</option>
              </select>
              <SortAscending className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-black border border-gray-800 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "flex items-center justify-center w-8 h-8 m-0.5 transition-all rounded",
                  viewMode === 'grid'
                    ? "bg-[#ABF716] text-black"
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
                    ? "bg-[#ABF716] text-black"
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

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Status:</span>
              {(['all', 'active', 'idle', 'completed', 'blocked'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-lg border transition-all",
                    statusFilter === status
                      ? "bg-[#ABF716] text-black border-[#ABF716]"
                      : "bg-black border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                  )}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}