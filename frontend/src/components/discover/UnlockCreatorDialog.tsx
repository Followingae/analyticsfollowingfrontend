"use client"

/**
 * The unlock moment.
 *
 * 25 credits buys a team 30 days of full analytics on one creator. That is real
 * money, so it is never spent by a click that could have meant something else:
 * every unlock passes through this dialog, which names the creator, names the
 * price, says what arrives, and requires a second, explicit press.
 *
 * NOTHING HERE IS A NEW UNLOCK PATH. The two calls it makes are the two the app
 * already uses:
 *
 *   • `discoveryService.unlockProfile(profileId)` — the /discovery/unlock-profile
 *     endpoint, used by DiscoveryTab and by the creators page. Correct whenever the
 *     directory row already points at a deep profile.
 *   • `useCreatorSearch()` → GET /search/creator/{username} — the same mutation the
 *     creators page uses for a handle we have never analysed. It runs the full
 *     pipeline and grants the same 30-day access.
 *
 * Credits, wallets and the endpoint contracts are untouched. This component only
 * decides which of the two existing calls applies and asks first.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { BarChart3, Lock, MessageSquare, Users } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui2/spinner"
import { discoveryService } from "@/services/discoveryService"
import { creditsApiService } from "@/services/creditsApi"
import { useCreatorSearch } from "@/hooks/useCreatorSearch"
import type { DirectoryRow } from "@/services/discoveryDirectoryService"

/** The published price of a profile unlock. Read, never set, by this screen. */
const UNLOCK_COST = 25
const ACCESS_DAYS = 30

/** What the 25 credits actually buys, said before it is spent. */
const WHAT_YOU_GET = [
  { icon: BarChart3, text: "Measured engagement across their last 90 posts" },
  { icon: Users, text: "Audience make-up: country, age, gender, authenticity" },
  { icon: MessageSquare, text: "Content analysis, sentiment and top posts" },
]

interface UnlockCreatorDialogProps {
  row: DirectoryRow | null
  onOpenChange: (open: boolean) => void
  onUnlocked: (row: DirectoryRow) => void
}

export function UnlockCreatorDialog({
  row,
  onOpenChange,
  onUnlocked,
}: UnlockCreatorDialogProps) {
  const router = useRouter()
  const [working, setWorking] = React.useState(false)
  const creatorSearch = useCreatorSearch()

  // The balance is a courtesy, not a gate — the backend decides. When the wallet
  // does not answer we say so rather than printing a zero someone might trust.
  const balanceQuery = useQuery({
    queryKey: ["credits-balance-for-unlock"],
    queryFn: async () => {
      const result = await creditsApiService.getBalance()
      if (!result.success || !result.data) {
        throw new Error(result.error || "Balance unavailable")
      }
      return result.data.current_balance
    },
    enabled: !!row,
    staleTime: 30_000,
    retry: false,
  })

  const balance = balanceQuery.isSuccess ? balanceQuery.data : null
  const knownShort = balance !== null && balance < UNLOCK_COST

  const confirm = async () => {
    if (!row) return
    setWorking(true)
    const handle = row.username
    toast.loading(`Unlocking @${handle}…`, { id: `unlock-${handle}` })

    try {
      if (row.profile_id) {
        const result = await discoveryService.unlockProfile(row.profile_id)
        if (!result.success) throw new Error(result.error || "Unlock failed")
      } else {
        // Never analysed before: the creator-search path runs the pipeline and
        // grants the same access. It can take a couple of minutes.
        await creatorSearch.mutateAsync(handle)
      }

      toast.dismiss(`unlock-${handle}`)
      // The header's credit chip listens for this. Same event the other unlock
      // sites dispatch.
      window.dispatchEvent(new CustomEvent("credit-balance-changed"))
      toast.success(
        `@${handle} unlocked | full analytics for ${ACCESS_DAYS} days`
      )
      onUnlocked(row)
      onOpenChange(false)
      router.push(`/creator-analytics/${handle}`)
    } catch (error: any) {
      toast.dismiss(`unlock-${handle}`)
      const message: string = error?.message || ""
      if (message.includes("team_limit_exceeded")) {
        toast.error("Monthly profile limit reached", {
          description: "Upgrade your plan for more unlocks.",
        })
      } else if (
        message.includes("Insufficient credits") ||
        message.includes("402")
      ) {
        toast.error("Not enough credits", {
          description: `An unlock costs ${UNLOCK_COST} credits. Top up to continue.`,
        })
      } else {
        toast.error(`Could not unlock @${handle}`, {
          description: message || "Please try again.",
        })
      }
    } finally {
      setWorking(false)
    }
  }

  return (
    <AlertDialog
      open={!!row}
      onOpenChange={(open) => {
        if (!open && !working) onOpenChange(false)
      }}
    >
      <AlertDialogContent className="rounded-ds-overlay">
        <AlertDialogHeader>
          <AlertDialogTitle>Unlock @{row?.username}?</AlertDialogTitle>
          <AlertDialogDescription>
            This spends{" "}
            <span className="font-semibold text-foreground">
              {UNLOCK_COST} credits
            </span>{" "}
            and gives everyone on your team full analytics for {ACCESS_DAYS}{" "}
            days.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="flex flex-col gap-2 rounded-ds-surface border bg-muted/40 p-4">
          {WHAT_YOU_GET.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-2 text-ds-body-sm text-muted-foreground"
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <p className="text-ds-caption text-muted-foreground">
          Your balance:{" "}
          {balanceQuery.isLoading ? (
            <Spinner className="inline size-3 align-[-2px]" />
          ) : balance === null ? (
            /* The wallet did not answer. An em dash, never a zero. */
            <span title="Your balance could not be read just now">—</span>
          ) : (
            <span className="font-medium text-foreground tabular-nums">
              {balance.toLocaleString()} credits
            </span>
          )}
          {!row?.profile_id && (
            <>
              {" · "}
              We have not analysed this creator before, so the first load takes a
              couple of minutes.
            </>
          )}
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Keep the dialog open while the unlock runs, so a slow pipeline
              // cannot look like a no-op and invite a second press.
              event.preventDefault()
              void confirm()
            }}
            disabled={working || knownShort}
          >
            {working ? (
              <Spinner className="size-4" />
            ) : (
              <Lock className="size-4" aria-hidden />
            )}
            {working
              ? "Unlocking…"
              : knownShort
                ? "Not enough credits"
                : `Unlock for ${UNLOCK_COST} credits`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
