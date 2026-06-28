/**
 * Operations index.
 *
 * `/ops` has no standalone view — the operations module lands on the campaigns
 * list. Without this page the bare `/ops` route 404s, which surfaced as
 * `GET /ops?_rsc=...` 404s from breadcrumb prefetches (routeRegistry maps
 * `/ops` → "Operations") and a stale `router.push('/ops')`.
 */
import { redirect } from 'next/navigation';

export default function OperationsIndexPage() {
  redirect('/ops/campaigns');
}
