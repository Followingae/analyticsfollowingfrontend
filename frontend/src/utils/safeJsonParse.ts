export async function safeJsonParse(response: Response) {
  const text = await response.text()
  
  if (!text) {
    throw new Error(`Empty response from ${response.url}`)
  }
  
  // Check if response starts with HTML
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    console.error('❌ HTML response received instead of JSON:', {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      responsePreview: text.substring(0, 200)
    })
    throw new Error(`Server returned HTML instead of JSON from ${response.url}. Status: ${response.status}`)
  }
  
  try {
    return JSON.parse(text)
  } catch (error) {
    console.error('❌ JSON parse error:', {
      url: response.url,
      status: response.status,
      responseText: text.substring(0, 200),
      error: error.message
    })
    throw new Error(`Invalid JSON response from ${response.url}: ${error.message}`)
  }
}