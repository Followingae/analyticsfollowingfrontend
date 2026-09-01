'use client'

/**
 * Waiting for us to approve an enterprise account.
 *
 * READING tier, and about as reading as a screen gets: one person, one paragraph, one thing
 * to do. It was three nested boxes deep, a card holding a tinted box holding a bordered box,
 * which drew four edges around content that is a single short message. The boxes came off.
 * Space separates the three steps, one hairline separates the message from the way to reach
 * us, and the measure is capped so the sentences do not run the width of a monitor.
 */
import { Button } from '@/components/ui/button'
import { Clock, Mail, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    title: 'Account review',
    body: 'Our team will review your enterprise account request within 24 hours.',
  },
  {
    title: 'Personalised setup',
    body: 'A dedicated account manager will contact you to discuss your needs.',
  },
  {
    title: 'Account activation',
    body: "Once approved, you'll receive login credentials and onboarding materials.",
  },
]

export default function PendingApprovalPage() {
  const router = useRouter()

  return (
    <div data-density="reading"
         className="flex min-h-screen items-center justify-center bg-background px-4 py-ds-6">
      <div className="flex w-full max-w-xl flex-col gap-ds-6">
        <header className="flex flex-col items-start gap-ds-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-ds-full bg-warning/12 text-warning">
            <Clock className="h-6 w-6" />
          </span>
          <h1 className="text-ds-title text-foreground">Account pending approval</h1>
          <p className="max-w-[65ch] text-ds-body text-muted-foreground">
            Your enterprise account request has been received.
          </p>
        </header>

        <section className="flex flex-col gap-ds-4">
          <h2 className="text-ds-overline uppercase text-muted-foreground">What happens next</h2>
          <ol className="flex flex-col gap-ds-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-ds-3">
                <span className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-ds-full bg-primary/10 text-ds-overline text-primary">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-ds-1">
                  <p className="text-ds-label text-foreground">{s.title}</p>
                  <p className="max-w-[65ch] text-ds-body text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* One hairline, because this is a different subject rather than another object. */}
        <section className="flex flex-col items-start gap-ds-3 border-t border-border pt-ds-5">
          <p className="text-ds-label text-foreground">Need it sooner?</p>
          <Button variant="outline" asChild>
            <a href="mailto:enterprise@following.ae" className="flex items-center gap-ds-2">
              <Mail className="h-4 w-4" />
              enterprise@following.ae
            </a>
          </Button>
        </section>

        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="self-start px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to homepage
        </Button>
      </div>
    </div>
  )
}
