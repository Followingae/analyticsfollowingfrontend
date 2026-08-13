/**
 * Only ever show an avatar we host.
 *
 * Instagram refuses hotlinked images — `scontent-*`, `*.fbcdn.net` and friends answer 403
 * once the referrer is not instagram.com. Passing one to an <img> guarantees a broken image
 * and a console full of failures; passing nothing gives the component's own fallback, which
 * is a clean initial.
 *
 * Our own copies live on cdn.following.ae, put there by the CDN worker. A creator whose
 * record still holds an Instagram URL simply has not been processed yet, and the initial is
 * the honest answer until it has.
 */
export function cdnAvatar(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith("/") || url.startsWith("data:")) return url
  return url.includes("cdn.following.ae") ? url : undefined
}
