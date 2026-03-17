'use client'

import { notFound } from 'next/navigation'
import { use } from 'react'

import { DownloadView } from '@/components/result/download-view'
import { isValidSessionId } from '@/lib/validation'

type Props = {
  readonly params: Promise<{ id: string }>
}

export default function DownloadPage({ params }: Props) {
  const { id } = use(params)
  if (!isValidSessionId(id)) notFound()
  return <DownloadView sessionId={id} />
}
