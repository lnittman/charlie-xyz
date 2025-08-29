'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface DotMatrixLoaderProps {
  loading: boolean
}

export function DotMatrixLoader({ loading }: DotMatrixLoaderProps) {
  const [showLoader, setShowLoader] = useState(loading)
  
  useEffect(() => {
    if (loading) {
      setShowLoader(true)
    } else {
      // Delay hiding to allow fade out animation
      const timer = setTimeout(() => setShowLoader(false), 500)
      return () => clearTimeout(timer)
    }
  }, [loading])

  // Create a grid of dots
  const rows = 7
  const cols = 7
  const centerRow = Math.floor(rows / 2)
  const centerCol = Math.floor(cols / 2)

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-[#010101] flex items-center justify-center"
        >
          <div className="relative">
            {/* Create dot matrix */}
            <div className="grid grid-cols-7 gap-8">
              {Array.from({ length: rows * cols }).map((_, index) => {
                const row = Math.floor(index / cols)
                const col = index % cols
                const distanceFromCenter = Math.sqrt(
                  Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
                )
                const delay = distanceFromCenter * 0.1
                const isCenter = row === centerRow && col === centerCol

                return (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.2, 1],
                      opacity: [0, 1, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      delay,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut"
                    }}
                  >
                    <div 
                      className={`w-3 h-3 rounded-full ${
                        isCenter ? 'bg-[#ABF716]' : 'bg-[#ABF716]/20'
                      }`}
                      style={{
                        boxShadow: isCenter 
                          ? '0 0 20px #ABF716, 0 0 40px #ABF716' 
                          : '0 0 10px #ABF716'
                      }}
                    />
                    {/* Pulse effect for center dot */}
                    {isCenter && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-[#ABF716]"
                        animate={{
                          scale: [1, 2.5, 1],
                          opacity: [0.8, 0, 0.8]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Subtle Charlie branding */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
              className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 text-[#ABF716]/30 text-xs font-mono tracking-widest"
            >
              INITIALIZING CHARLIE
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Alternative: Massive dot grid loader
export function MassiveDotLoader({ loading }: DotMatrixLoaderProps) {
  const [showLoader, setShowLoader] = useState(loading)
  
  useEffect(() => {
    if (loading) {
      setShowLoader(true)
    } else {
      const timer = setTimeout(() => setShowLoader(false), 600)
      return () => clearTimeout(timer)
    }
  }, [loading])

  // Create a massive grid
  const dotsPerRow = 20
  const dotsPerCol = 12
  const totalDots = dotsPerRow * dotsPerCol

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 bg-[#010101] overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${dotsPerRow}, 1fr)`,
                width: '90vw',
                maxWidth: '1400px'
              }}
            >
              {Array.from({ length: totalDots }).map((_, index) => {
                const row = Math.floor(index / dotsPerRow)
                const col = index % dotsPerRow
                
                // Create wave effect
                const waveDelay = (row * 0.02) + (col * 0.01)
                
                // Random size variation
                const sizeVariation = 0.5 + Math.random() * 0.5
                
                return (
                  <motion.div
                    key={index}
                    className="rounded-full bg-[#ABF716]"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, sizeVariation, 0],
                      opacity: [0, 0.3, 0],
                    }}
                    transition={{
                      duration: 3,
                      delay: waveDelay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      width: '8px',
                      height: '8px',
                      filter: 'blur(1px)',
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Center focal point */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ABF716 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}