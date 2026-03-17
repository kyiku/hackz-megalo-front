'use client'

import { notFound } from 'next/navigation'
import { use } from 'react'

import { ProcessingView } from '@/components/processing/processing-view'
import { isValidSessionId } from '@/lib/validation'

type Props = {
  readonly params: Promise<{ id: string }>
}

export default function ProcessingPage({ params }: Props) {
  const { id } = use(params)
  if (!isValidSessionId(id)) notFound()
  return <ProcessingView sessionId={id} />
}
