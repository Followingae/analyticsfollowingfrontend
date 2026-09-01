import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The one Supabase browser client used for OAuth sign-in.
 *
 * It has to be a singleton with a stable storage key, because the PKCE flow writes a
 * code verifier before redirecting to Google and reads it back on /auth/callback. Two
 * differently-configured clients would write and read different keys, and the exchange
 * would fail with "invalid request: both auth code and code verifier should be non-empty".
 *
 * `detectSessionInUrl` is off on purpose: /auth/callback does the exchange explicitly, so
 * no other page picks up an auth code by accident. The storage key is our own, so this
 * never touches anything the rest of the app stores. Our session of record stays the one
 * tokenManager holds; the Supabase session here is scratch space for the redirect.
 */
let client: SupabaseClient | null = null

export const SUPABASE_OAUTH_STORAGE_KEY = 'following-oauth-auth'

export function isGoogleSignInConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function getSupabaseBrowserClient(): Promise<SupabaseClient> {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Google sign-in is not configured on this deployment.')
  }

  const { createClient } = await import('@supabase/supabase-js')
  client = createClient(url, anonKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: SUPABASE_OAUTH_STORAGE_KEY,
    },
  })

  return client
}

/** Where the user wanted to go before we sent them to Google. */
export const OAUTH_NEXT_KEY = 'following-oauth-next'

export function rememberOAuthNext(next: string | null | undefined): void {
  try {
    if (next) {
      sessionStorage.setItem(OAUTH_NEXT_KEY, next)
    } else {
      sessionStorage.removeItem(OAUTH_NEXT_KEY)
    }
  } catch {
    /* private mode: we just lose the deep link, not the sign-in */
  }
}

export function takeOAuthNext(): string | null {
  try {
    const value = sessionStorage.getItem(OAUTH_NEXT_KEY)
    sessionStorage.removeItem(OAUTH_NEXT_KEY)
    // Same rule the login page uses: only ever follow a same-site path.
    if (!value || !value.startsWith('/') || value.startsWith('//')) return null
    return value
  } catch {
    return null
  }
}

/**
 * Send the browser to Google. Returns only on failure, since the success path is a
 * full-page redirect.
 */
export async function startGoogleSignIn(next?: string | null): Promise<void> {
  const supabase = await getSupabaseBrowserClient()
  rememberOAuthNext(next)

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        // Ask Google to show the chooser rather than silently reusing whichever
        // account the browser is already signed into.
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    throw new Error(error.message || 'Could not start Google sign-in.')
  }
}
