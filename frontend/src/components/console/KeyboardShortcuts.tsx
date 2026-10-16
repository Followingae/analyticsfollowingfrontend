'use client'

/**
 * Keys, for people who live in this console all day.
 *
 * There was exactly one keyboard shortcut in the whole product: Command-K. Everything else
 * was a mouse journey, and the people doing the same four journeys two hundred times a day
 * were making every one of them with a pointer.
 *
 * THE RULES THAT KEEP THIS SAFE TO HAVE:
 *   1. Never fire while somebody is typing. An input, a textarea, a contenteditable or a
 *      select means the keystroke belongs to them, not to us. This is the whole reason
 *      single-letter shortcuts are usually a bad idea, and the only reason they are a good
 *      idea here is that the check is exhaustive.
 *   2. Never fire with a modifier held. Cmd-R is reload, Cmd-C is copy, and a shortcut that
 *      eats one of those is worse than no shortcut.
 *   3. Never navigate somebody to a screen their role cannot open. Offering a key that
 *      lands on "Redirecting…" teaches people not to trust the keys.
 *   4. Everything is discoverable from one place: `?` opens the list. A shortcut nobody can
 *      find is a shortcut nobody uses.
 *
 * `g` then a letter is the "go" sequence, which is the convention people already know from
 * Gmail, GitHub and Linear. It waits 1.2 seconds for the second key and then forgets, so a
 * stray g never swallows the next thing you type.
 */
import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { modulesForPath } from '@/lib/routeModules'
import { shortName } from '@/lib/destinations'

/** The go-to map. One letter each, chosen to match the first sound of the name. */
const GO: { key: string; href: string }[] = [
  { key: 't', href: '/work/today' },
  { key: 'q', href: '/work/inbox' },
  { key: 'p', href: '/work/pipeline' },
  { key: 'c', href: '/work/clients' },
  { key: 'r', href: '/work/influencers' },
  { key: 'k', href: '/work/campaigns' },
  { key: 'm', href: '/work/money' },
  { key: 'u', href: '/work/guide' },
]

/** Is the person typing? Then the key is theirs.
 *  Exported because every screen that adds its own keys needs exactly this test, and two
 *  copies of it would drift the day somebody adds a new kind of input. */
export function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  if (!el || !el.tagName) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (el.isContentEditable) return true
  // A radix combobox or listbox takes keys for its own navigation.
  const role = el.getAttribute?.('role')
  return role === 'textbox' || role === 'combobox' || role === 'listbox'
}

/**
 * The page's own search box, whatever it happens to be called.
 *
 * Matched on what it says rather than on a data attribute, because every one of these
 * screens already has a search box and none of them was built expecting this.
 */
function findSearchBox(): HTMLInputElement | null {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input:not([type=hidden]):not([disabled])'))
  for (const i of inputs) {
    const hay = `${i.placeholder ?? ''} ${i.getAttribute('aria-label') ?? ''} ${i.type}`.toLowerCase()
    if (hay.includes('search') || hay.includes('find') || i.type === 'search') {
      if (i.offsetParent !== null) return i
    }
  }
  return null
}

export function KeyboardShortcuts() {
  const router = useRouter()
  const { can, isSuperAdmin, loading } = useAdminAccess()
  const [help, setHelp] = React.useState(false)
  const pendingG = React.useRef<number | null>(null)

  const allowed = React.useCallback((href: string) => {
    if (isSuperAdmin) return true
    const need = modulesForPath(href)
    return need.length === 0 || need.some(m => can(m))
  }, [can, isSuperAdmin])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) {
        // One exception, and it is the one people expect: Escape gives the page back.
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        return
      }

      // `?` — the list. Shift-/ on most layouts, so the key itself is what we read.
      if (e.key === '?') {
        e.preventDefault()
        setHelp(v => !v)
        return
      }

      // `/` — the page's own search box.
      if (e.key === '/') {
        const box = findSearchBox()
        if (box) {
          e.preventDefault()
          box.focus()
          box.select?.()
        }
        return
      }

      // `g` then a letter.
      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current)
        pendingG.current = null
        const hit = GO.find(g => g.key === e.key.toLowerCase())
        if (hit && allowed(hit.href)) {
          e.preventDefault()
          router.push(hit.href)
        }
        return
      }
      if (e.key.toLowerCase() === 'g') {
        pendingG.current = window.setTimeout(() => { pendingG.current = null }, 1200)
        return
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (pendingG.current !== null) window.clearTimeout(pendingG.current)
    }
  }, [router, allowed])

  const rows = loading ? [] : GO.filter(g => allowed(g.href))

  return (
    <Dialog open={help} onOpenChange={setHelp}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard</DialogTitle>
          <DialogDescription>
            These work anywhere in the console, except while you are typing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <section className="space-y-2">
            {[
              [['⌘', 'K'], 'Search and jump anywhere'],
              [['/'], 'Jump to this screen’s search box'],
              [['?'], 'This list'],
              [['Esc'], 'Give the page back the keyboard'],
            ].map(([keys, what]) => (
              <div key={what as string} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{what as string}</span>
                <span className="flex shrink-0 gap-1">
                  {(keys as string[]).map(k => <Kbd key={k}>{k}</Kbd>)}
                </span>
              </div>
            ))}
          </section>

          {rows.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Go to
              </p>
              {rows.map(g => (
                <div key={g.key} className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{shortName(g.href)}</span>
                  <span className="flex shrink-0 gap-1">
                    <Kbd>g</Kbd><Kbd>{g.key}</Kbd>
                  </span>
                </div>
              ))}
            </section>
          )}

          <section className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              On a list
            </p>
            {[
              [['j'], 'Next row'],
              [['k'], 'Previous row'],
              [['x'], 'Tick the row you are on'],
              [['Enter'], 'Open it'],
            ].map(([keys, what]) => (
              <div key={what as string} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{what as string}</span>
                <span className="flex shrink-0 gap-1">
                  {(keys as string[]).map(k => <Kbd key={k}>{k}</Kbd>)}
                </span>
              </div>
            ))}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border
                    border-black/10 bg-muted px-1.5 font-mono text-[11px] font-medium
                    text-foreground dark:border-white/15">
      {children}
    </kbd>
  )
}
