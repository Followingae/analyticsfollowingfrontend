"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'
import { useState, useEffect } from 'react'

// IndexedDB persister for React Query cache
const createIDBPersister = () => {
  return createSyncStoragePersister({
    storage: {
      getItem: async (key: string) => {
        try {
          return await get(key)
        } catch {
          return null
        }
      },
      setItem: async (key: string, value: any) => {
        try {
          await set(key, value)
        } catch {
          // Silently fail to prevent blocking
        }
      },
      removeItem: async (key: string) => {
        try {
          await del(key)
        } catch {
          // Silently fail
        }
      },
    },
    key: 'REACT_QUERY_OFFLINE_CACHE',
    throttleTime: 1000, // Only persist once per second
  })
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - longer for better caching
            gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in memory longer
            refetchOnWindowFocus: false, // Don't refetch on focus
            refetchOnMount: 'stale', // Only refetch if stale
            refetchOnReconnect: 'stale', // Only refetch if stale on reconnect
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              return failureCount < 3
            },
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  const [persister] = useState(() => createIDBPersister())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Use regular provider on server, persistent provider on client
  if (!isClient) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persister={persister}
      maxAge={24 * 60 * 60 * 1000} // 24 hours
      buster="v1" // Change this to invalidate all cached data
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  )
}