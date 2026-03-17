'use client'

import { use } from 'react'

import { DownloadView } from '@/components/result/download-view'

type Props = {
  readonly params: Promise<{ id: string }>
}

export default function DownloadPage({ params }: Props) {
  const { id } = use(params)
  return <DownloadView sessionId={id} />
}
