/**
 * Authentication Initialization Module
 * 
 * This module ensures proper initialization order and prevents race conditions
 * in token management during app startup.
 */

import { tokenManager } from './tokenManager'

let isInitialized = false
let initPromise: Promise<void> | null = null

/**
 * Initialize authentication system
 * This should be called early in the app lifecycle
 */
export async function initializeAuth(): Promise<void> {
  if (isInitialized) {
    return
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = performInitialization()
  
  try {
    await initPromise
    isInitialized = true

  } catch (error) {

    initPromise = null
    throw error
  }
}

async function performInitialization(): Promise<void> {
  // Initialize TokenManager (this will clean up invalid tokens and load valid ones)
  tokenManager // This triggers singleton initialization
  
  // Wait a moment for cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 10))
  

}

/**
 * Check if authentication is initialized
 */
export function isAuthInitialized(): boolean {
  return isInitialized
}

/**
 * Wait for authentication to be initialized
 */
export async function waitForAuthInit(): Promise<void> {
  if (isInitialized) {
    return
  }
  
  if (initPromise) {
    await initPromise
    return
  }
  
  // If not initialized and no init in progress, start it
  await initializeAuth()
}

// Auto-initialize if we're in the browser
if (typeof window !== 'undefined') {
  // Use setTimeout to avoid blocking the main thread
  setTimeout(() => {
    initializeAuth().catch(error => {

    })
  }, 0)
}