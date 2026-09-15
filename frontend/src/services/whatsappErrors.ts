/**
 * What a Twilio WhatsApp failure code actually means, in words.
 *
 * The analytics panel rendered "Unknown error (63049)" forty-five times, which tells an
 * operator that something went wrong forty-five times and nothing else. These four codes mean
 * four completely different things, and only one of them is worth retrying. Knowing which is
 * the difference between spending money again for nothing and recovering real delivery.
 *
 * `retry` is the only field that changes what somebody should DO:
 *   'worth-it'  a later attempt genuinely lands. Back off, do not hammer it.
 *   'pointless' the recipient has to change something. Retrying burns money and, worse,
 *               repeat failures count against our sender quality rating with Meta.
 *   'never'     retrying is a compliance problem, not just a waste.
 */
export type RetryAdvice = 'worth-it' | 'pointless' | 'never'

export interface WhatsAppFailure {
  title: string
  detail: string
  retry: RetryAdvice
}

export const WHATSAPP_FAILURES: Record<string, WhatsAppFailure> = {
  '63049': {
    title: 'Meta held the message back',
    detail:
      'Meta declined to deliver a marketing message to preserve the recipient experience. It is '
      + 'a throttle rather than a rejection, and it is not about your content. Outside the US a '
      + 'later attempt usually lands.',
    retry: 'worth-it',
  },
  '63024': {
    title: 'Not reachable on WhatsApp',
    detail:
      'The number is not enabled for WhatsApp, or the person is on a version of the app too old '
      + 'to receive it. Nothing changes until they do something, so sending again today lands in '
      + 'the same place.',
    retry: 'pointless',
  },
  '63032': {
    title: 'Has not accepted WhatsApp’s terms',
    detail:
      'WhatsApp is blocking business messages to this person until they accept its updated terms. '
      + 'That is between them and WhatsApp, and there is nothing we can send that changes it.',
    retry: 'pointless',
  },
  '63050': {
    title: 'Opted out of our marketing',
    detail:
      'They told WhatsApp they do not want marketing from us. We now mark these contacts opted '
      + 'out automatically, so they are excluded from every future broadcast.',
    retry: 'never',
  },
  '63021': {
    title: 'The template content was rejected',
    detail:
      'Twilio would not accept the message as built. Usually an unapproved template, or variables '
      + 'that start, end, or sit next to each other in the body. This is the error that lost 576 '
      + 'messages on 30 July.',
    retry: 'pointless',
  },
  '63016': {
    title: 'Outside the 24 hour window',
    detail:
      'A free-form message was attempted more than 24 hours after the person last wrote to us. '
      + 'Business-initiated contact has to use an approved template.',
    retry: 'pointless',
  },
  '63007': {
    title: 'Sender number not recognised',
    detail: 'The number we sent from is not a registered WhatsApp sender on this account.',
    retry: 'pointless',
  },
  '21211': {
    title: 'Not a valid phone number',
    detail: 'The number could not be parsed as a real phone number and was never sent.',
    retry: 'never',
  },
  '21408': {
    title: 'Sending to this country is switched off',
    detail: 'Twilio geo permissions block this destination. It is an account setting, not a fault.',
    retry: 'pointless',
  },
  '20003': {
    title: 'Our Twilio credentials were rejected',
    detail:
      'Authentication failed, so nothing was sent at all. This is a server problem rather than '
      + 'anything to do with the recipient.',
    retry: 'worth-it',
  },
}

export function describeFailure(code?: string | null, message?: string | null): WhatsAppFailure {
  const hit = code ? WHATSAPP_FAILURES[String(code)] : undefined
  if (hit) return hit
  return {
    title: message?.trim() || (code ? `Twilio error ${code}` : 'Failed'),
    // Deliberately says we do not know, rather than inventing advice for a code nobody here
    // has seen before.
    detail: 'We do not have a plain description for this code yet. Twilio documents it at '
      + `twilio.com/docs/api/errors/${code ?? ''}.`,
    retry: 'pointless',
  }
}

export const RETRY_LABEL: Record<RetryAdvice, string> = {
  'worth-it': 'Worth retrying later',
  pointless: 'Retrying will not help',
  never: 'Must not be retried',
}
