'use client'

import { useParams } from 'next/navigation'
import { CharlieDetail } from '@/components/charlie-detail'

export default function CharliePage() {
  const params = useParams()
  const id = params.id as string
  
  return <CharlieDetail id={id} />
}