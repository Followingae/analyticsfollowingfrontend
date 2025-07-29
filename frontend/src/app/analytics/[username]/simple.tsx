'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { instagramApiService } from '@/services/instagramApi'

export default function SimplePage() {
  const params = useParams()
  const username = params?.username as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('SimplePage render - username:', username)

  useEffect(() => {
    if (!username) return

    console.log('Starting API call for:', username)
    setLoading(true)
    setError(null)

    instagramApiService.getProfileAnalysis(username)
      .then(result => {
        console.log('API result:', result)
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Failed to load data')
        }
      })
      .catch(err => {
        console.error('API error:', err)
        setError('API call failed')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [username])

  if (!username) {
    return <div>No username provided</div>
  }

  if (loading) {
    return <div>Loading analytics for {username}...</div>
  }

  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
        <pre>{JSON.stringify({ username, params }, null, 2)}</pre>
      </div>
    )
  }

  if (data) {
    return (
      <div>
        <h1>Analytics for {username}</h1>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    )
  }

  return <div>No data</div>
}