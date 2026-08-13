import { redirect } from 'next/navigation'

// /work is the console's root. Next prefetches parent segments, so without a page here the
// browser logs a 404 for /work on every navigation — and anyone who types it lands nowhere.
// Today is the console's landing screen for every internal role.
export default function WorkRoot() {
  redirect('/work/today')
}
