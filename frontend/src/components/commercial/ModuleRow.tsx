'use client'

/**
 * One module, as a row that is on or off.
 *
 * The same row is used on the plan screen and in the billing list, so a brand
 * cannot be told two different things about the same module in two places.
 *
 * What it never does:
 *  - show a price on a module that is included in the plan
 *  - show a price to a managed account (they get "Request")
 *  - hardcode a price (every figure comes from src/config/planPricing.ts)
 *  - put a figure on a module whose price is not agreed. Merchant of Record
 *    reads "Quoted", because both halves of its price, the monthly fee and the
 *    settlement percentage, are provisional in the backend.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui2/item'
import { Check, Search, Megaphone, Handshake, Wallet, Lock } from 'lucide-react'
import { MODULES } from '@/config/modules'
import {
  MODULE_PRICING,
  formatModulePrice,
  type ModuleAddonKey,
  type ModuleKey,
} from '@/config/planPricing'
import { RequestModuleDialog } from './RequestModuleDialog'

const MODULE_ICON: Record<ModuleKey, typeof Search> = {
  find: Search,
  run: Megaphone,
  mor: Wallet,
  manage: Handshake,
}

interface ModuleRowProps {
  module: ModuleKey
  owned: boolean
  managed: boolean
  accountEmail?: string
  /** Hide the "what it contains" list, for the tighter billing list. */
  compact?: boolean
  /** Where "Manage" points for a module the account already pays for. */
  manageHref?: string
}

export function ModuleRow({
  module,
  owned,
  managed,
  accountEmail,
  compact = false,
  manageHref = '/billing',
}: ModuleRowProps) {
  const def = MODULES[module]
  const Icon = MODULE_ICON[module]
  const [requesting, setRequesting] = useState(false)

  const isAddon = def.availability === 'addon'
  const isIncluded = def.availability === 'included'
  // An add-on whose price is not published. formatModulePrice already returns
  // "Quoted" rather than a figure for it, and the action has to match: "Add
  // Merchant of Record" beside the word Quoted reads as a one-click purchase of
  // something we have not priced.
  const isQuoted = isAddon && MODULE_PRICING[module] === 'quoted'

  return (
    <>
      <Item variant="outline" className="items-start">
        <ItemMedia variant="icon">
          <Icon />
        </ItemMedia>

        <ItemContent>
          <ItemTitle className="flex items-center gap-2">
            {def.name}
            {owned ? (
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                On
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Lock className="h-3 w-3" />
                Off
              </Badge>
            )}
            {isIncluded && (
              <span className="text-ds-caption text-muted-foreground">in every plan</span>
            )}
          </ItemTitle>

          <ItemDescription>{def.summary}</ItemDescription>

          {!compact && (
            <ul className="mt-2 space-y-1.5">
              {def.contains.map((line) => (
                <li key={line} className="flex items-start gap-2 text-ds-body-sm">
                  <Check
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      owned ? 'text-primary' : 'text-muted-foreground/50'
                    }`}
                  />
                  <span className={owned ? '' : 'text-muted-foreground'}>{line}</span>
                </li>
              ))}
            </ul>
          )}
        </ItemContent>

        <ItemActions className="self-center">
          {owned ? (
            <div className="text-right">
              {isAddon && !managed && !isQuoted && (
                <p className="text-ds-body-sm font-medium">
                  {formatModulePrice(module as ModuleAddonKey)}
                </p>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href={isIncluded ? def.href : manageHref}>
                  {isIncluded ? 'Open' : 'Manage'}
                </Link>
              </Button>
            </div>
          ) : managed ? (
            <Button variant="outline" onClick={() => setRequesting(true)}>
              Request
            </Button>
          ) : isAddon ? (
            <div className="text-right space-y-1">
              <p className="text-ds-body-sm font-medium">{formatModulePrice(module as ModuleAddonKey)}</p>
              <Button
                variant={isQuoted ? 'outline' : 'default'}
                onClick={() => setRequesting(true)}
              >
                {isQuoted ? 'Ask us to quote it' : `Add ${def.name}`}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setRequesting(true)}>
              Talk to us
            </Button>
          )}
        </ItemActions>
      </Item>

      <RequestModuleDialog
        module={module}
        open={requesting}
        onOpenChange={setRequesting}
        managed={managed}
        accountEmail={accountEmail}
      />
    </>
  )
}
