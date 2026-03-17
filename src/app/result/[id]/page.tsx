'use client'

import { use } from 'react'

import { ResultView } from '@/components/result/result-view'

type Props = {
  readonly params: Promise<{ id: string }>
}

export default function ResultPage({ params }: Props) {
  const { id } = use(params)
  return <ResultView sessionId={id} />
}
