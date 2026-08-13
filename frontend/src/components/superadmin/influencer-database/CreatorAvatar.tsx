"use client"

import { useState } from "react"

/**
 * A creator's picture, with the coloured initial as a real fallback rather than the only
 * thing on offer.
 *
 * The database views drew the initial unconditionally, so 262 of our 287 creators had a
 * perfectly good picture sitting on our CDN that nobody ever saw.
 *
 * Instagram's own URLs are refused when hotlinked (ERR_BLOCKED_BY_RESPONSE), so a row still
 * holding a `scontent-*` address must not even be attempted — a broken image is worse than
 * an initial. Those rows are waiting on the CDN worker; the initial is the honest answer
 * until it has run.
 */
const GRADIENTS = [
  "from-blue-500 to-purple-600",
  "from-green-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
  "from-amber-500 to-orange-600",
]

function gradientFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

/** Only our own CDN is safe to load; anything else is Instagram and will be blocked. */
function servable(url: string | null | undefined): string | null {
  if (!url) return null
  return url.includes("cdn.following.ae") || url.startsWith("/") ? url : null
}

export function CreatorAvatar({
  username, src, className = "size-8", textClassName = "text-xs",
}: {
  username: string
  src?: string | null
  className?: string
  textClassName?: string
}) {
  const [failed, setFailed] = useState(false)
  const url = failed ? null : servable(src)

  if (url) {
    return (
      <img
        src={url}
        alt={`@${username}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    )
  }

  return (
    <div
      title={`@${username}`}
      className={`${className} ${textClassName} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${gradientFor(username)}`}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  )
}
