import { CharlieDashboard } from '@/components/charlie-dashboard'
import { createMetadata } from '@repo/seo/metadata'

export const metadata = createMetadata({
  title: 'Command Center',
  description: 'Monitor and control your Charlie AI assistants',
})

export default function HomePage() {
  return <CharlieDashboard />
}