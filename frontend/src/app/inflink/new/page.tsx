/**
 * Screen 2 — Post a request. Three steps.
 *
 *   1. What you want made, where, by when, and for how much.
 *   2. Who it reaches, split by population, BEFORE it is posted.
 *   3. Read it back, then post.
 *
 * Deliberately shorter than a proposal. A proposal is us pitching a named roster with
 * per-creator pricing; a request is the brand describing what they want. So there is
 * no creator picking here, no tier bands, no snapshots — one screen of intent, one
 * screen of reach, one screen of review.
 *
 * Step 2 is the argument for the whole module, so it is not a summary line at the
 * bottom of step 1. It is its own step, and you walk through it on the way to posting.
 *
 * WHAT WAS REMOVED HERE. Step 2 used to offer two checkboxes, one per population, as
 * though a brand could choose to skip one. The server has never accepted a subset —
 * `writeRfp` does not send the field and `POST /briefs` would ignore it — so the
 * control changed a preview and nothing else. It is gone. The two populations are now
 * stated as what they are, and the Inflink one says plainly that it cannot be reached
 * at the moment rather than being offered as a choice.
 */
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { toast } from "sonner"
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Send } from "lucide-react"

import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui2/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui2/input-group"
import { ButtonGroup } from "@/components/ui2/button-group"
import { Combobox } from "@/components/ui2/combobox"
// The real category values the master database stores, not a list invented here: a
// niche the brand can pick but no creator is tagged with would match nobody and read
// as us having no creators in it.
import { CATEGORY_OPTIONS } from "@/types/influencerDatabase"

import {
  inflinkApi,
  DELIVERABLE_LABELS,
  POPULATION_LABELS,
  type RfpDraft,
  type BudgetMode,
  type DeliverableAsk,
  type Population,
  type ReachEstimate,
} from "@/services/inflinkApi"
import { DeliverablePicker } from "@/components/inflink/deliverable-picker"
import { ReachPanel } from "@/components/inflink/reach-panel"
import { FailedState, LoadingState } from "@/components/inflink/async-state"
import { Money } from "@/components/inflink/value"
import { PAGE_SHELL, PAGE_STACK } from "@/components/inflink/scale"
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

/** Both populations, always. The server takes no subset, so neither does the composer. */
const POPULATIONS: Population[] = ["following", "inflink"]

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
  const [categories, setCategories] = React.useState<string[]>([])
  const [followersMin, setFollowersMin] = React.useState("")
  const [followersMax, setFollowersMax] = React.useState("")

  // Step 2
  const [reachState, setReachState] = React.useState<ReachState>({ status: "loading" })

  const budgetFils = React.useMemo(() => {
    const parsed = Number(budgetAed)
    // An empty or unparseable budget is null, never 0 — see the module's rule 1.
    return budgetAed.trim() !== "" && Number.isFinite(parsed) ? Math.round(parsed * 100) : null
  }, [budgetAed])

  /** An empty box is "no limit", never 0 — see the module's rule 1. */
  const readBound = (raw: string) => {
    const parsed = Number(raw)
    return raw.trim() !== "" && Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
  }
  const followersMinValue = readBound(followersMin)
  const followersMaxValue = readBound(followersMax)
  const followersBackwards =
    followersMinValue !== null &&
    followersMaxValue !== null &&
    followersMinValue > followersMaxValue

  const draft: RfpDraft = React.useMemo(
    () => ({
      title: title.trim(),
      description: description.trim() || null,
      deliverables,
      market: market || null,
      categories,
      followers_min: followersMinValue,
      followers_max: followersMaxValue,
      deadline_at: deadline || null,
      budget_mode: budgetMode,
      budget_fils: budgetFils,
      populations: POPULATIONS,
    }),
    [
      title,
      description,
      deliverables,
      market,
      categories,
      followersMinValue,
      followersMaxValue,
      deadline,
      budgetMode,
      budgetFils,
    ]
  )

  /**
   * A request that reaches nobody, said BEFORE it is posted.
   *
   * The server takes it happily: it is a valid request that nothing matched, and it
   * would sit open for a week collecting nothing while the brand waited. Only a
   * COUNTED zero stops them — an uncounted population is not evidence of nobody, and
   * blocking on it would be refusing to post over our own failure to count.
   */
  const reachesNobody =
    reachState.status === "ready" &&
    reachState.reach.total_creators === 0 &&
    !reachState.reach.partial

  /**
   * Which populations this request will actually reach, named on the review screen.
   *
   * Read off the counted reach rather than from a list of intentions: a population
   * the server has told us it cannot reach is not something to promise on the last
   * screen before someone commits. Until step 2 has answered, the honest answer is
   * that we are still counting.
   */
  const reachesLine = React.useMemo(() => {
    if (reachState.status !== "ready") return "Counting…"
    const reached = reachState.reach.slices.filter((slice) => slice.status !== "unreachable")
    const missing = reachState.reach.slices.filter((slice) => slice.status === "unreachable")
    const named = reached.map((slice) => POPULATION_LABELS[slice.population]).join(" and ")
    if (!named) return "Nobody — widen the request and count again"
    if (missing.length === 0) return named
    return `${named} (${missing
      .map((slice) => POPULATION_LABELS[slice.population])
      .join(" and ")} cannot be reached at the moment)`
  }, [reachState])

  const step1Ready =
    title.trim().length > 0 &&
    deliverables.length > 0 &&
    budgetFils !== null &&
    !followersBackwards

  // Reach is recounted whenever the terms that decide it change, but only on step 2.
  const reachKey = JSON.stringify({
    deliverables,
    market,
    categories,
    followers_min: followersMinValue,
    followers_max: followersMaxValue,
    budget_fils: budgetFils,
    budget_mode: budgetMode,
  })

  React.useEffect(() => {
    if (step !== 2) return
    let live = true
    setReachState({ status: "loading" })
    inflinkApi
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
      const { rfp } = await inflinkApi.postRfp(draft)
      // What it actually reached, from the server's own count. It used to say only
      // "Creators can reply from now", and when Inflink answered 404 the screen
      // behind it said the fan-out had FAILED — while the request had in fact gone
      // out to every matching creator we have.
      const reached = rfp.reached_count
      toast.success("Request posted", {
        description:
          reached === null
            ? "Creators can send you their price from now."
            : `It went out to ${reached.toLocaleString()} ${
                reached === 1 ? "creator" : "creators"
              }. Their quotes arrive here.`,
      })
      router.push(`/inflink/${rfp.id}`)
    } catch (error) {
      toast.error("We could not post the request", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
      setPosting(false)
    }
  }

  return (
    <div className={PAGE_SHELL}>
      <div className={PAGE_STACK}>
        <header className="flex flex-col gap-4">
          <h1 className="text-ds-title">Post a request</h1>
          <Stepper current={step} />
        </header>

        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {/* ── STEP 1 ───────────────────────────────────────────────────── */}
          {step === 1 && (
            <FieldGroup className="max-w-3xl">
              <Field>
                <FieldLabel htmlFor="rfp-title">What is this for?</FieldLabel>
                <Input
                  id="rfp-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ramadan launch, three reels"
                  className="rounded-ds-field"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="rfp-description">Anything they should know</FieldLabel>
                <Textarea
                  id="rfp-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="The product, the tone, anything that would change how they price it."
                  className="rounded-ds-field"
                />
                <FieldDescription>Optional. Short is fine. This is not a proposal.</FieldDescription>
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
                  <FieldLabel htmlFor="rfp-deadline">Deadline</FieldLabel>
                  <Input
                    id="rfp-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="rounded-ds-field"
                  />
                  <FieldDescription>The last day a creator can reply.</FieldDescription>
                </Field>
              </div>

              <Field>
                <FieldLabel>Niches</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((option) => {
                    const on = categories.includes(option.value)
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        size="sm"
                        variant={on ? "default" : "outline"}
                        className="rounded-ds-control"
                        aria-pressed={on}
                        onClick={() =>
                          setCategories((current) =>
                            current.includes(option.value)
                              ? current.filter((c) => c !== option.value)
                              : [...current, option.value]
                          )
                        }
                      >
                        {option.label}
                      </Button>
                    )
                  })}
                </div>
                <FieldDescription>
                  {categories.length === 0
                    ? "Pick none and it reaches every niche. Pick a few and it reaches creators in any of them."
                    : "It reaches creators in any of the niches you picked, not only those in all of them."}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Followers</FieldLabel>
                <div className="flex items-center gap-3">
                  <InputGroup className="rounded-ds-field max-w-[11rem]">
                    <InputGroupAddon>Min</InputGroupAddon>
                    <InputGroupInput
                      inputMode="numeric"
                      value={followersMin}
                      onChange={(e) => setFollowersMin(e.target.value)}
                      placeholder="Any"
                      aria-label="Minimum followers"
                    />
                  </InputGroup>
                  <InputGroup className="rounded-ds-field max-w-[11rem]">
                    <InputGroupAddon>Max</InputGroupAddon>
                    <InputGroupInput
                      inputMode="numeric"
                      value={followersMax}
                      onChange={(e) => setFollowersMax(e.target.value)}
                      placeholder="Any"
                      aria-label="Maximum followers"
                    />
                  </InputGroup>
                </div>
                <FieldDescription>
                  {followersBackwards
                    ? "The minimum is above the maximum, so nobody could match. Swap them."
                    : "Leave either box empty for no limit."}
                </FieldDescription>
              </Field>

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
                  Two populations, counted separately, before you post. This is a count of
                  real creators who match what you asked for, not an estimate.
                </p>
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

              {reachesNobody && (
                <div className="rounded-ds-surface text-ds-body-sm flex items-start gap-3 border border-amber-500/25 bg-amber-500/5 p-4">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                  <p className="text-muted-foreground">
                    Nothing matches this yet, so posting it would reach nobody. Widen the
                    niches or the follower range, or raise the budget — creators only match
                    when their listed price for what you asked for fits inside it.
                  </p>
                </div>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-ds-control">
                  <ArrowLeft /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={reachesNobody}
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
                  { term: "Request", value: title },
                  {
                    term: "What gets made",
                    value: deliverables
                      .map((d) => `${d.quantity}× ${DELIVERABLE_LABELS[d.type]}`)
                      .join(", "),
                  },
                  { term: "Market", value: market || "Anywhere" },
                  {
                    term: "Niches",
                    value:
                      categories.length === 0
                        ? "Any"
                        : CATEGORY_OPTIONS.filter((o) => categories.includes(o.value))
                            .map((o) => o.label)
                            .join(", "),
                  },
                  {
                    term: "Followers",
                    value:
                      followersMinValue === null && followersMaxValue === null
                        ? "Any size"
                        : `${followersMinValue?.toLocaleString() ?? "Any"} to ${
                            followersMaxValue?.toLocaleString() ?? "any"
                          }`,
                  },
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
                  { term: "Reaches", value: reachesLine },
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
                see their quotes as they come in, and nothing is committed until you award.
              </p>

              <div className="flex justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} className="rounded-ds-control">
                  <ArrowLeft /> Back
                </Button>
                <Button
                  onClick={post}
                  disabled={posting || reachesNobody}
                  className="rounded-ds-control"
                >
                  <Send /> {posting ? "Posting…" : "Post the request"}
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
