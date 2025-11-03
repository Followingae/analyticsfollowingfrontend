'use client'

import React from 'react'
import { useParams } from 'next/navigation'

export default function MinimalCreatorAnalyticsPage() {
  const params = useParams()
  const username = params.username as string

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Creator Analytics: @{username}</h1>
      <p>This is a minimal test page to verify the route works.</p>
    </div>
  )
}