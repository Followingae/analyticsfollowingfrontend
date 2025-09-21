'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Calendar, Share, Download } from 'lucide-react'
import Link from 'next/link'

interface ListItem {
  id: string
  username: string
  display_name: string
  followers_count: number
  engagement_rate: number
  location: string
  avatar_url?: string
}

interface ListDetail {
  id: string
  name: string
  description: string
  color: string
  creator_count: number
  created_at: string
  items: ListItem[]
}

export default function ListDetailPage() {
  const params = useParams()
  const listId = params.id as string
  const [list, setList] = useState<ListDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load list data from API
    const loadListData = async () => {
      try {
        // TODO: Implement actual API call to fetch list details
        // const response = await listsApiService.getListDetails(listId)
        // if (response.success) {
        //   setList(response.data)
        // }
        setLoading(false)
      } catch (error) {
        console.error('Error loading list data:', error)
        setLoading(false)
      }
    }

    loadListData()
  }, [listId])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-lg font-semibold mb-2">List not found</h2>
            <p className="text-muted-foreground mb-4">The list you're looking for doesn't exist.</p>
            <Link href="/my-lists">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lists
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/my-lists">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{list.name}</h1>
            <p className="text-muted-foreground">{list.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Creators</p>
                <p className="text-2xl font-bold">{list.creator_count}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Engagement</p>
                <p className="text-2xl font-bold">
                  {(list.items.reduce((acc, item) => acc + item.engagement_rate, 0) / list.items.length).toFixed(1)}%
                </p>
              </div>
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: list.color }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-2xl font-bold">
                  {new Date(list.created_at).toLocaleDateString()}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Creators List */}
      <Card>
        <CardHeader>
          <CardTitle>Creators in this list</CardTitle>
          <CardDescription>
            {list.items.length} creators with detailed analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {list.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-white font-bold">
                    {item.display_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.display_name}</h3>
                    <p className="text-sm text-muted-foreground">@{item.username}</p>
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="secondary">
                    {item.followers_count.toLocaleString()} followers
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {item.engagement_rate}% engagement
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}