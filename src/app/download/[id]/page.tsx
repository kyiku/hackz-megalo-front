'use client'

import { notFound } from 'next/navigation'
import { use } from 'react'

import { DownloadView } from '@/components/result/download-view'
import { isValidSessionId } from '@/lib/validation'

const FIVE_DIGIT_PATTERN = /^\d{5}$/

type Props = {
  readonly params: Promise<{ id: string }>
}

function isValidDownloadId(id: string): boolean {
  return isValidSessionId(id) || FIVE_DIGIT_PATTERN.test(id)
}

export default function DownloadPage({ params }: Props) {
  const { id } = use(params)
  if (!isValidDownloadId(id)) notFound()

  const isClayCode = FIVE_DIGIT_PATTERN.test(id)

  return <DownloadView sessionId={id} isClayCode={isClayCode} />
}
