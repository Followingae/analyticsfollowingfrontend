'use client'

/**
 * The wall's voice: a short chime when a moment takes the stage, so the room looks up.
 *
 * Browsers only let a page make sound after a press, and the TV gets exactly one: the OK
 * press that also takes it full screen (see screen.ts). That press arms the audio context;
 * until then the wall is silent. The notes are synthesised here, so there is no file to
 * load and nothing to buffer on a slow TV. `?mute=1` keeps the wall silent.
 */
let ctx: AudioContext | null = null
let muted: boolean | null = null

export function armSound() {
  try {
    if (muted === null) muted = new URLSearchParams(window.location.search).get('mute') === '1'
    if (muted) return
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    if (!ctx) ctx = new AC()
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => { /* still blocked */ })
  } catch { /* no audio here */ }
}

function note(freq: number, at: number, dur: number, gain: number) {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(freq, at)
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(gain, at + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0008, at + dur)
  o.connect(g).connect(ctx.destination)
  o.start(at)
  o.stop(at + dur + 0.05)
}

/** Two rising notes for a celebration, one soft note when a client asks for something. */
export function chime(kind: 'celebrate' | 'stage') {
  try {
    if (muted || !ctx || ctx.state !== 'running') return
    const t = ctx.currentTime + 0.02
    if (kind === 'celebrate') {
      note(659.25, t, 0.9, 0.16)         // E5
      note(987.77, t + 0.14, 1.4, 0.14)  // B5
      note(1318.5, t + 0.14, 1.0, 0.05)  // E6, a shimmer on top
    } else {
      note(587.33, t, 1.1, 0.10)         // D5
    }
  } catch { /* silence is fine */ }
}
