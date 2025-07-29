'use client'

import { useState } from 'react'
import { authService } from '@/services/authService'

export default function TestBackend() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setTestResult('Testing...')
    
    try {
      const result = await authService.testConnection()
      setTestResult(JSON.stringify(result, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testDirectFetch = async () => {
    setLoading(true)
    setTestResult('Testing direct fetch...')
    
    try {
      console.log('🧪 Testing direct fetch to backend')
      const response = await fetch('https://analytics-following-backend-5qfwj.ondigitalocean.app/health', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('🧪 Direct fetch response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers)
      })
      
      const data = await response.text()
      setTestResult(`Status: ${response.status}\nHeaders: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}\nBody: ${data}`)
    } catch (error) {
      console.error('🧪 Direct fetch failed:', error)
      setTestResult(`Direct fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Backend Connectivity Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test via AuthService'}
        </button>
        
        <button
          onClick={testDirectFetch}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Direct Fetch'}
        </button>
      </div>
      
      {testResult && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {testResult}
          </pre>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Environment Info:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          Origin: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}{'\n'}
          User Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}{'\n'}
          API Base URL: {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set'}
        </pre>
      </div>
    </div>
  )
}