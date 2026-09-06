/**
 * Turn a failed API response into a thrown error.
 *
 * WHY THIS EXISTS. `superadminApiService.makeRequest` does not throw when the server refuses
 * a request. On a non-2xx it RETURNS `{ success: false, error }`. That is a reasonable
 * contract and 25 of its 30 call sites honour it by checking the flag.
 *
 * The other five wrote this instead:
 *
 *     try {
 *       await superadminApiService.removeInfluencerFromDatabase(id)
 *       toast.success(`@${username} removed`)
 *     } catch {
 *       toast.error('Could not remove that creator')
 *     }
 *
 * which reads correctly and is wrong: nothing throws, so the catch is dead and the success
 * toast fires on a refusal. A talent manager pressing delete on a creator she is not allowed
 * to delete saw "@name removed", watched the row stay put, and had no way to tell whether the
 * platform or her eyes were lying. The console reported a 403 the whole time.
 *
 * Wrapping the call restores the meaning the author intended, without changing the contract
 * for the twenty-five callers that read the flag:
 *
 *     assertOk(await superadminApiService.removeInfluencerFromDatabase(id))
 *
 * The server's own message is preferred over a generic one, because "You do not have
 * permission to remove creators" tells somebody what to do next and "Request failed" does not.
 */

export interface OkLike {
  success?: boolean
  error?: string
  message?: string
}

export function assertOk<T extends OkLike>(res: T, fallback = 'That did not work.'): T {
  if (res && res.success === false) {
    throw new Error(res.error || res.message || fallback)
  }
  return res
}
