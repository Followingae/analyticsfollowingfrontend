/**
 * The questions a merchant answers when asking for a quote.
 *
 * Copied verbatim from the marketing site's brief form (NEWFOLLOWINGWEBSITE,
 * src/content/briefForm.ts) for the four offerings a trial merchant can ask for
 * next. Same ids, labels, types and options, so an answer set means the same thing
 * whether it arrived from the website or from the merchant dashboard, and the
 * people writing quotes read one shape.
 *
 * Keep each offering to three questions. The form's job is to route the enquiry
 * to the right person with enough context to reply properly, not to qualify the
 * lead to death before anyone has spoken to them.
 */

export type QuoteField =
  | { id: string; label: string; type: 'single'; options: string[] }
  | { id: string; label: string; type: 'multi'; options: string[] }
  | { id: string; label: string; type: 'text'; placeholder: string }

export type QuoteOffering = 'campaigns-barter' | 'campaigns-paid' | 'influencer-cashback' | 'ugc'

/** Keyed by product slug, the same slugs the website uses in /contact?offering=<slug>. */
export const quoteQuestionsFor: Record<QuoteOffering, QuoteField[]> = {
  'influencer-cashback': [
    {
      id: 'locations',
      label: 'How many locations?',
      type: 'single',
      options: ['1', '2 to 5', '6 to 20', '20+'],
    },
    {
      id: 'venue',
      label: 'What kind of place is it?',
      type: 'single',
      options: ['Restaurant', 'Café', 'Retail', 'Salon or clinic', 'Something else'],
    },
    {
      id: 'ticket',
      label: 'Roughly what does a customer spend per visit?',
      type: 'text',
      placeholder: 'AED 120',
    },
  ],

  'campaigns-barter': [
    {
      id: 'offer',
      label: 'What can you offer a creator?',
      type: 'multi',
      options: ['Product', 'A stay', 'A meal', 'Tickets or access', 'A service'],
    },
    {
      id: 'outlets',
      label: 'How many outlets or brands?',
      type: 'single',
      options: ['1', '2 to 5', '6 to 20', '20+'],
    },
    {
      id: 'timing',
      label: 'When would you want it running?',
      type: 'single',
      options: ['This month', 'Next month', 'This quarter', 'Just exploring'],
    },
  ],

  'campaigns-paid': [
    {
      id: 'launching',
      label: 'What are you launching?',
      type: 'text',
      placeholder: 'A new flavour, a store opening, a collection',
    },
    {
      id: 'budget',
      label: 'Budget',
      type: 'single',
      options: ['AED 35k – 100k', 'AED 100k – 200k', 'AED 200k+', 'Not set yet'],
    },
    {
      id: 'timing',
      label: 'When does it go live?',
      type: 'single',
      options: ['This month', 'Next month', 'This quarter', 'Just exploring'],
    },
  ],

  ugc: [
    {
      id: 'volume',
      label: 'How many assets do you need?',
      type: 'single',
      options: ['Under 10', '10 to 30', '30 to 60', '60+'],
    },
    {
      id: 'placement',
      label: 'Where will they run?',
      type: 'multi',
      options: ['Paid ads', 'Organic social', 'Website', 'In store'],
    },
    {
      id: 'rights',
      label: 'Do you need paid usage rights?',
      type: 'single',
      options: ['Yes', 'No', 'Not sure'],
    },
  ],
}

/** The four things a trial merchant can ask for next, named as the website names them. */
export const quoteOfferingPicker = {
  label: 'What would you like next?',
  options: [
    { slug: 'campaigns-barter', name: 'Barter Campaigns' },
    { slug: 'campaigns-paid', name: 'Paid Campaigns' },
    { slug: 'influencer-cashback', name: 'Cashback' },
    { slug: 'ugc', name: 'UGC' },
  ] as { slug: QuoteOffering; name: string }[],
}

export function quoteOfferingLabel(slug: string | null | undefined): string {
  return quoteOfferingPicker.options.find((o) => o.slug === slug)?.name ?? (slug || '')
}

/** A question's label by id, across every offering, for showing answers back. */
export function quoteQuestionLabel(id: string): string {
  for (const fields of Object.values(quoteQuestionsFor)) {
    const f = fields.find((q) => q.id === id)
    if (f) return f.label
  }
  if (id === 'managed') return 'Managed by Following'
  return id.replace(/_/g, ' ')
}
