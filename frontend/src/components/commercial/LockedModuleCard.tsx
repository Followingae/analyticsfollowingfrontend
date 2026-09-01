'use client'

/**
 * The locked module, in context.
 *
 * This renders at the address the brand actually clicked - /campaigns stays
 * /campaigns - because a paywall that redirects somewhere else loses the thing
 * the brand was in the middle of doing.
 *
 * Deliberately NOT here: a blurred screenshot of the module. Blurring a page
 * you cannot enter sells nothing and reads as a trick. Instead the card names
 * what they were about to do, points at their own shortlists by name and
 * count, and prices the module.
 *
 * Their shortlists are a real request, so it has three states: loading, empty,
 * and failed. A failed request shows an em-dash, never "0 creators".
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui2/item'
import { Spinner } from '@/components/ui2/spinner'
import { Check, ArrowRight, ListChecks, AlertCircle, Lock } from 'lucide-react'
import { listsApiService, type List } from '@/services/listsApi'
import { MODULES } from '@/config/modules'
import { formatModulePrice, type ModuleAddonKey, type ModuleKey } from '@/config/planPricing'
import { useCommercialAccount, fmtCount } from '@/hooks/useCommercialAccount'
import { RequestModuleDialog } from './RequestModuleDialog'

type ListsState = 'loading' | 'loaded' | 'failed'

interface LockedModuleCardProps {
  module: ModuleKey
}

export function LockedModuleCard({ module }: LockedModuleCardProps) {
  const def = MODULES[module]
  const account = useCommercialAccount()
  const [requesting, setRequesting] = useState(false)

  const [listsState, setListsState] = useState<ListsState>('loading')
  const [lists, setLists] = useState<List[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setListsState('loading')
      try {
        const res = await listsApiService.getAllLists({ sort: 'items_count', order: 'desc', limit: 5 })
        if (cancelled) return
        if (!res?.success || !res.data) {
          setListsState('failed')
          return
        }
        const raw = Array.isArray(res.data) ? res.data : res.data.lists
        setLists(Array.isArray(raw) ? raw.slice(0, 3) : [])
        setListsState('loaded')
      } catch {
        if (cancelled) return
        setListsState('failed')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const isAddon = def.availability === 'addon'
  const managed = account.isManaged
  // While the account is still loading we do not know whether this brand is
  // ever allowed to see a price, so we show neither price nor button yet.
  const accountKnown = account.state !== 'loading'

  const topList = lists[0]
  const listCount = (l: List) => (typeof l.profiles_count === 'number' ? l.profiles_count : l.creator_count)

  const requestContext = topList
    ? `shortlist: ${topList.name} (${fmtCount(listCount(topList))} creators)`
    : undefined

  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" />
              {def.name} is off
            </Badge>
          </div>
          <CardTitle className="text-ds-title">{def.wallHeadline}</CardTitle>
          <p className="text-ds-body text-muted-foreground mt-2">{def.wallBody}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ── Their own shortlists ───────────────────────────────────── */}
          <section>
            <h3 className="text-ds-label text-muted-foreground mb-3 flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              What you would run
            </h3>

            {listsState === 'loading' && (
              <div className="flex items-center gap-2 text-ds-body-sm text-muted-foreground py-3">
                <Spinner className="size-4" />
                Loading your shortlists
              </div>
            )}

            {listsState === 'failed' && (
              <div className="flex items-start gap-2 text-ds-body-sm text-muted-foreground py-3">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  We could not load your shortlists just now, so we are not going to guess at a
                  number. {def.name} runs whichever ones you have.
                </span>
              </div>
            )}

            {listsState === 'loaded' && lists.length === 0 && (
              <div className="text-ds-body-sm text-muted-foreground py-3">
                You have not built a shortlist yet.{' '}
                <Link href="/discover" className="underline underline-offset-2 hover:text-foreground">
                  Find creators first
                </Link>{' '}
                - {def.name} is what turns one of those lists into a campaign.
              </div>
            )}

            {listsState === 'loaded' && lists.length > 0 && (
              <ItemGroup className="gap-2">
                {lists.map((list) => (
                  <Item key={list.id} variant="muted" size="sm">
                    <ItemContent>
                      <ItemTitle>{list.name}</ItemTitle>
                      <ItemDescription>{fmtCount(listCount(list))} creators</ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </section>

          <Separator />

          {/* ── What the module contains ───────────────────────────────── */}
          <section>
            <h3 className="text-ds-label text-muted-foreground mb-3">What {def.name} contains</h3>
            <ul className="space-y-2">
              {def.contains.map((line) => (
                <li key={line} className="flex items-start gap-2 text-ds-body-sm">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          <Separator />

          {/* ── The price, or the request ──────────────────────────────── */}
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {!accountKnown ? (
                <p className="text-ds-body-sm text-muted-foreground">Checking your plan</p>
              ) : managed ? (
                <p className="text-ds-body-sm text-muted-foreground">
                  Your account is billed by us directly. Your account manager adds {def.name} and
                  it appears on your next invoice.
                </p>
              ) : isAddon ? (
                <>
                  <p className="text-ds-heading">{formatModulePrice(module as ModuleAddonKey)}</p>
                  <p className="text-ds-body-sm text-muted-foreground">
                    One add-on, cancellable on its own line in billing.
                  </p>
                </>
              ) : (
                <p className="text-ds-body-sm text-muted-foreground">
                  Managed is quoted against the work.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {accountKnown && (
                <Button onClick={() => setRequesting(true)}>
                  {managed ? 'Request' : isAddon ? `Add ${def.name}` : 'Talk to us'}
                </Button>
              )}
              <Button asChild variant="ghost">
                <Link href="/billing?tab=plan">
                  See the whole plan
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>

      <RequestModuleDialog
        module={module}
        open={requesting}
        onOpenChange={setRequesting}
        managed={managed}
        accountEmail={account.status?.user?.email}
        context={requestContext}
      />
    </div>
  )
}
