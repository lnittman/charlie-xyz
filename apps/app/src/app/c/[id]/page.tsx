import { CharlieDetail } from '@/components/charlie-detail'
import { createMetadata } from '@repo/seo/metadata'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  
  return createMetadata({
    title: id.toUpperCase(),
    description: `Charlie instance ${id} details and workflow status`,
  })
}

export default async function CharliePage({ params }: PageProps) {
  const { id } = await params
  
  return <CharlieDetail id={id} />
}