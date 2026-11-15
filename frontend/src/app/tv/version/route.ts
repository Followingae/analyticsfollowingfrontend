/**
 * Which build is live. The wall on a TV never reloads by itself, so it asks this every ten
 * minutes and reloads at the next slide change when the answer differs from the build it is
 * running (see useSelfRefresh in components/wall/screen.ts).
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({ build: process.env.NEXT_PUBLIC_WALL_BUILD ?? null }, { headers: { 'Cache-Control': 'no-store' } })
}
