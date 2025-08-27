export async function safeJsonParse(response: Response) {
  const text = await response.text()
  
  if (!text) {
    throw new Error(`Empty response from ${response.url}`)
  }
  
  // Check if response starts with HTML
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error(`Server returned HTML instead of JSON from ${response.url}. Status: ${response.status}`)
  }
  
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Invalid JSON response from ${response.url}: ${error.message}`)
  }
}