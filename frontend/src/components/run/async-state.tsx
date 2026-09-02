/**
 * Rule 4, made structural: loading, genuinely empty, and failed are three states.
 *
 * They collapse into two by accident, always the same way: `if (!data.length) return
 * <Empty/>` renders "No offers yet" while the request is still in flight, and renders
 * the same reassuring sentence when the request 500s. A brand then reads "nobody has
 * offered" when the truth is "we could not ask". That is a different fact and it leads
 * to a different action — wait, versus retry, versus call us.
 *
 * `useAsync` returns a discriminated union with four arms. `StateView` requires a
 * renderer for each one, so there is no way to write the screen that silently treats a
 * failure as an emptiness: leaving one out is a type error, not a code review note.
 */
"use client"

import * as React from "react"
import { AlertTriangle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui2/spinner"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui2/empty"

export type Async<T> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "failed"; error: string }
  | { status: "ready"; data: T }

export function useAsync<T>(
  load: () => Promise<T>,
  deps: React.DependencyList,
  /** What counts as genuinely empty. Only consulted once the request has SUCCEEDED. */
  isEmpty: (data: T) => boolean = () => false
) {
  const [state, setState] = React.useState<Async<T>>({ status: "loading" })
  const [nonce, setNonce] = React.useState(0)

  React.useEffect(() => {
    let live = true
    setState({ status: "loading" })
    load()
      .then((data) => {
        if (!live) return
        // Emptiness is only ever concluded from a successful answer.
        setState(isEmpty(data) ? { status: "empty" } : { status: "ready", data })
      })
      .catch((error: unknown) => {
        if (!live) return
        setState({
          status: "failed",
          error: error instanceof Error ? error.message : "Something went wrong.",
        })
      })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { state, reload: () => setNonce((n) => n + 1) }
}

/**
 * Four renderers, all required. `empty` and `failed` cannot share one branch without
 * writing the same JSX twice on purpose.
 */
export function StateView<T>({
  state,
  loading,
  empty,
  failed,
  ready,
}: {
  state: Async<T>
  loading: () => React.ReactNode
  empty: () => React.ReactNode
  failed: (error: string) => React.ReactNode
  ready: (data: T) => React.ReactNode
}) {
  switch (state.status) {
    case "loading":
      return <>{loading()}</>
    case "empty":
      return <>{empty()}</>
    case "failed":
      return <>{failed(state.error)}</>
    case "ready":
      return <>{ready(state.data)}</>
  }
}

/** The default third state. Says we could not ask, not that there is nothing. */
export function FailedState({
  error,
  onRetry,
  what = "load this",
}: {
  error: string
  onRetry?: () => void
  what?: string
}) {
  return (
    <Empty className="border-destructive/25 border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangle className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>We could not {what}</EmptyTitle>
        <EmptyDescription>
          This is our side, not yours. Nothing about your brief has changed. {error}
        </EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry} className="rounded-ds-control">
            <RotateCw /> Try again
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

/** The first state. Never a spinner sitting inside an "it's empty" frame. */
export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="text-muted-foreground flex items-center justify-center gap-2.5 py-16"
    >
      <Spinner />
      <span className="text-ds-body-sm">{label}</span>
    </div>
  )
}
