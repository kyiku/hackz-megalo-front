'use client'

import { notFound } from 'next/navigation'
import { use } from 'react'

import { ResultView } from '@/components/result/result-view'
import { isValidSessionId } from '@/lib/validation'

type Props = {
  readonly params: Promise<{ id: string }>
}

export default function ResultPage({ params }: Props) {
  const { id } = use(params)
  if (!isValidSessionId(id)) notFound()
  return <ResultView sessionId={id} />
}
