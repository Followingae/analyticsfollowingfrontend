/**
 * The old client shortlist link.
 *
 * `/s/{token}` served the sourcing-round view of a shortlist. Sourcing rounds are retired and
 * shortlists are now shared from an area at `/l/{token}`, so the endpoint behind this page is
 * gone.
 *
 * The page stays. A link we sent a client must never die silently, and "this link is not
 * valid" reads as though the client mistyped something. Nothing was ever minted on this route
 * (both rounds carried a null share_token and neither was ever sent), so in practice nobody
 * holds one of these URLs. This page exists so that if somebody does, they are told what
 * happened and how to get the working link, rather than being shown a 404.
 *
 * Static on purpose: it makes no request, so it cannot fail, and it cannot leak anything.
 * Delete it once the sourcing tables themselves are dropped.
 */
export default function MovedShortlistPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-xl flex-col gap-ds-3 px-6 py-24 text-center">
        <h1 className="text-ds-title">This shortlist has moved</h1>
        <p className="text-ds-body text-muted-foreground">
          We have changed how we share creators with you, and this particular link is no longer
          the one that works. Nothing has been lost: your shortlist is still with the team,
          along with anything you had already told us about it.
        </p>
        <p className="text-ds-body text-muted-foreground">
          Reply to whoever sent you this and they will send the new link straight back.
        </p>
        <p className="mt-ds-3 text-ds-caption text-muted-foreground">Shared by Following</p>
      </div>
    </div>
  )
}
