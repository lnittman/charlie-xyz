import { motion } from 'framer-motion'
import { Skeleton } from './skeleton'

export function CharlieListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-black rounded-lg border border-gray-800 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-6 h-6 rounded-full bg-gray-900/30" />
              <div>
                <Skeleton className="h-5 w-32 mb-2 bg-gray-900/30" />
                <Skeleton className="h-4 w-64 bg-gray-900/20" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 bg-gray-900/20" />
          </div>
          <Skeleton className="h-20 w-full mb-4 bg-gray-900/20" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24 bg-gray-900/20" />
            <Skeleton className="h-4 w-20 bg-gray-900/20" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}