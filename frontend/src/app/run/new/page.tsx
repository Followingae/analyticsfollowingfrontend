/**
 * Screen 2 — Write a brief. Three steps.
 *
 *   1. What you want made, where, by when, and for how much.
 *   2. Who it reaches, split by population, BEFORE it is posted.
 *   3. Read it back, then post.
 *
 * Deliberately shorter than a proposal. A proposal is us pitching a named roster with
 * per-creator pricing; a brief is the brand describing what they want. So there is no
 * creator picking here, no tier bands, no snapshots — one screen of intent, one screen
 * of reach, one screen of review.
 *
 * Step 2 is the argument for the whole module, so it is not a summary line at the
 * bottom of step 1. It is its own step, and you walk through it on the way to posting.
 */
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, Check, Send } from "lucide-react"

import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui2/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui2/input-group"
import { ButtonGroup } from "@/components/ui2/button-group"
import { Combobox } from "@/components/ui2/combobox"

import {
  runApi,
  DELIVERABLE_LABELS,
  POPULATION_BLURBS,
  POPULATION_LABELS,
  type BriefDraft,
  type BudgetMode,
  type DeliverableAsk,
  type Population,
  type ReachEstimate,
} from "@/services/runApi"
import { DeliverablePicker } from "@/components/run/deliverable-picker"
import { ReachPanel } from "@/components/run/reach-panel"
import { FailedState, LoadingState } from "@/components/run/async-state"
import { Money } from "@/components/run/value"
import { PAGE_SHELL, PAGE_STACK } from "@/components/run/scale"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const MARKETS = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Kuwait",
  "Qatar",
  "Bahrain",
  "Oman",
  "Egypt",
  "Jordan",
  "Lebanon",
].map((market) => ({ value: market, label: market }))

const STEPS = [
  { n: 1, title: "What you want made" },
  { n: 2, title: "Who it reaches" },
  { n: 3, title: "Review and post" },
] as const

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((step, index) => {
        const done = current > step.n
        const active = current === step.n
        return (
          <li key={step.n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-ds-full text-ds-caption grid size-6 shrink-0 place-items-center border tabular-nums transition-colors",
                  done && "bg-primary text-primary-foreground border-primary",
                  active && "border-primary text-primary",
                  !done && !active && "border-border text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : step.n}
              </span>
              <span
                className={cn(
                  "text-ds-label hidden sm:inline",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span className="bg-border h-px w-6 shrink-0 sm:w-10" aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ── Step 2's data. Reach is fetched, so it has all three states of its own. ──── */
type ReachState =
  | { status: "loading" }
  | { status: "failed"; error: string }
  | { status: "ready"; reach: ReachEstimate }

function ComposerScreen() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [posting, setPosting] = React.useState(false)

  // Step 1
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [deliverables, setDeliverables] = React.useState<DeliverableAsk[]>([])
  const [market, setMarket] = React.useState("")
  const [deadline, setDeadline] = React.useState("")
  const [budgetMode, setBudgetMode] = React.useState<BudgetMode>("per_creator")
  const [budgetAed, setBudgetAed] = React.useState("")

  // Step 2
  const [populations, setPopulations] = React.useState<Population[]>(["following", "inflink"])
  const [reachState, setReachState] = React.useState<ReachState>({ status: "loading" })

  const budgetFils = React.useMemo(() => {
    const parsed = Number(budgetAed)
    // An empty or unparseable budget is null, never 0 — see the module's rule 1.
    return budgetAed.trim() !== "" && Number.isFinite(parsed) ? Math.round(parsed * 100) : null
  }, [budgetAed])

  const draft: BriefDraft = React.useMemo(
    () => ({
      title: title.trim(),
      description: description.trim() || null,
      deliverables,
      market: market || null,
      categories: [],
      followers_min: null,
      followers_max: null,
      deadline_at: deadline || null,
      budget_mode: budgetMode,
      budget_fils: budgetFils,
      populations,
    }),
    [title, description, deliverables, market, deadline, budgetMode, budgetFils, populations]
  )

  const step1Ready =
    title.trim().length > 0 && deliverables.length > 0 && budgetFils !== null

  // Reach is recounted whenever the terms that decide it change, but only on step 2.
  const reachKey = JSON.stringify({
    deliverables,
    market,
    populations,
    budget_fils: budgetFils,
    budget_mode: budgetMode,
  })

  React.useEffect(() => {
    if (step !== 2) return
    let live = true
    setReachState({ status: "loading" })
    runApi
      .previewReach(draft)
      .then(({ reach }) => live && setReachState({ status: "ready", reach }))
      .catch((error: unknown) =>
        live &&
        setReachState({
          status: "failed",
          error: error instanceof Error ? error.message : "Could not count the reach.",
        })
      )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reachKey])

  const post = async () => {
    setPosting(true)
    try {
      const { brief } = await runApi.postBrief(draft)
      toast.success("Brief posted", { description: "Creators can reply from now." })
      router.push(`/run/${brief.id}`)
    } catch (error) {
      toast.error("We could not post the brief", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
      setPosting(false)
    }
  }

  const togglePopulation = (population: Population) =>
    setPopulations((current) =>
      current.includes(population)
        ? current.filter((p) => p !== population)
        : [...current, population]
    )

  return (
    <div className={PAGE_SHELL}>
      <div className={PAGE_STACK}>
        <header className="flex flex-col gap-4">
          <h1 className="text-ds-title">Write a brief</h1>
          <Stepper current={step} />
        </header>

        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {/* ── STEP 1 ───────────────────────────────────────────────────── */}
          {step === 1 && (
            <FieldGroup className="max-w-3xl">
              <Field>
                <FieldLabel htmlFor="brief-title">What is this for?</FieldLabel>
                <Input
                  id="brief-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ramadan launch — three reels"
                  className="rounded-ds-field"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="brief-description">Anything they should know</FieldLabel>
                <Textarea
                  id="brief-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="The product, the tone, anything that would change how they price it."
                  className="rounded-ds-field"
                />
                <FieldDescription>Optional. Short is fine — this is not a proposal.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>What do you want made?</FieldLabel>
                <DeliverablePicker value={deliverables} onChange={setDeliverables} />
                <FieldDescription>
                  Pick the formats and how many of each, per creator.
                </FieldDescription>
              </Field>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Market</FieldLabel>
                  <Combobox
                    options={MARKETS}
                    value={market}
                    onValueChange={setMarket}
                    placeholder="Anywhere"
                    searchPlaceholder="Search markets"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="brief-deadline">Deadline</FieldLabel>
                  <Input
                    id="brief-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="rounded-ds-field"
                  />
                  <FieldDescription>The last day a creator can reply.</FieldDescription>
                </Field>
              </div>

              <Field>
                <FieldLabel>Budget</FieldLabel>
                <ButtonGroup>
                  <Button
                    type="button"
                    variant={budgetMode === "per_creator" ? "default" : "outline"}
                    onClick={() => setBudgetMode("per_creator")}
                  >
                    Per creator
                  </Button>
                  <Button
                    type="button"
                    variant={budgetMode === "pot" ? "default" : "outline"}
                    onClick={() => setBudgetMode("pot")}
                  >
                    One pot
                  </Button>
                </ButtonGroup>
                <InputGroup className="rounded-ds-field mt-3 max-w-xs">
                  <InputGroupAddon>AED</InputGroupAddon>
                  <InputGroupInput
                    inputMode="decimal"
                    value={budgetAed}
                    onChange={(e) => setBudgetAed(e.target.value)}
                    placeholder={budgetMode === "pot" ? "40,000" : "3,500"}
                    aria-label="Budget in AED"
                  />
                </InputGroup>
                <FieldDescription>
                  {budgetMode === "pot"
                    ? "One pot, split across everyone you award. Creators see the pot, not a per-head number."
                    : "The most you will pay one creator. Creators can offer under it."}
                </FieldDescription>
              </Field>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!step1Ready}
                  className="rounded-ds-control"
                >
                  See who it reaches <ArrowRight />
                </Button>
              </div>
            </FieldGroup>
          )}

          {/* ── STEP 2 ───────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-ds-heading">Who this reaches</h2>
                <p className="text-ds-body text-muted-foreground max-w-prose">
                  Two populations, counted separately, before you post. Turn one off and
                  the count changes.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {(["following", "inflink"] as Population[]).map((population) => (
                  <label
                    key={population}
                    className={cn(
                      "rounded-ds-surface flex flex-1 cursor-pointer items-start gap-3 border p-4 transition-colors",
                      populations.includes(population)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent/40"
                    )}
                  >
                    <Checkbox
                      checked={populations.includes(population)}
                      onCheckedChange={() => togglePopulation(population)}
                      className="mt-0.5"
                    />
                    <span className="flex flex-col gap-1">
                      <span className="text-ds-label">{POPULATION_LABELS[population]}</span>
                      <span className="text-ds-body-sm text-muted-foreground">
                        {POPULATION_BLURBS[population]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              {reachState.status === "loading" && <LoadingState label="Counting who this reaches" />}
              {reachState.status === "failed" && (
                <FailedState
                  error={reachState.error}
                  what="count who this reaches"
                  onRetry={() => setStep(2)}
                />
              )}
              {reachState.status === "ready" && <ReachPanel reach={reachState.reach} />}

              <div className="flex justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-ds-control">
                  <ArrowLeft /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={populations.length === 0}
                  className="rounded-ds-control"
                >
                  Review <ArrowRight />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ───────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex max-w-3xl flex-col gap-6">
              <h2 className="text-ds-heading">Read it back</h2>

              <dl className="bg-card rounded-ds-surface divide-y border">
                {[
                  { term: "Brief", value: title },
                  {
                    term: "What gets made",
                    value: deliverables
                      .map((d) => `${d.quantity}× ${DELIVERABLE_LABELS[d.type]}`)
                      .join(", "),
                  },
                  { term: "Market", value: market || "Anywhere" },
                  {
                    term: "Deadline",
                    value: deadline
                      ? new Date(deadline).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "No deadline",
                  },
                  {
                    term: budgetMode === "pot" ? "Pot" : "Most per creator",
                    value: <Money fils={budgetFils} />,
                  },
                  {
                    term: "Reaches",
                    value: populations.map((p) => POPULATION_LABELS[p]).join(" and "),
                  },
                ].map((row) => (
                  <div
                    key={row.term}
                    className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <dt className="text-ds-body-sm text-muted-foreground sm:w-44 sm:shrink-0">
                      {row.term}
                    </dt>
                    <dd className="text-ds-body">{row.value}</dd>
                  </div>
                ))}
              </dl>

              {description && (
                <div className="flex flex-col gap-2">
                  <span className="text-ds-overline text-muted-foreground">Notes to creators</span>
                  <p className="text-ds-body whitespace-pre-wrap">{description}</p>
                </div>
              )}

              <p className="text-ds-body-sm text-muted-foreground">
                Posting sends this to the creators counted in the previous step. You will
                see their offers as they come in, and nothing is committed until you award.
              </p>

              <div className="flex justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} className="rounded-ds-control">
                  <ArrowLeft /> Back
                </Button>
                <Button onClick={post} disabled={posting} className="rounded-ds-control">
                  <Send /> {posting ? "Posting…" : "Post the brief"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default function RunNewBriefPage() {
  return (
    <AuthGuard>
      <BrandUserInterface>
        <ComposerScreen />
      </BrandUserInterface>
    </AuthGuard>
  )
}
