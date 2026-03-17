'use client'

import { use } from 'react'

import { ProcessingView } from '@/components/processing/processing-view'

type Props = {
  readonly params: Promise<{ id: string }>
}

export default function ProcessingPage({ params }: Props) {
  const { id } = use(params)
  return <ProcessingView sessionId={id} />
}
