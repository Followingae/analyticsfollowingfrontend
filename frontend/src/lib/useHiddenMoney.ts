'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Money figures hidden until the viewer taps the eye, the way a banking app hides a balance.
 * Hidden by default, so a shared screen never shows the business's numbers by accident; the
 * choice is remembered per browser. Storage can be unavailable (private window, blocked site
 * data): the figures then simply start hidden every time.
 */
const KEY = 'following.money.visible'

export function useHiddenMoney(): { hidden: boolean; toggle: () => void } {
  const [hidden, setHidden] = useState(true)
  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === '1') setHidden(false)
    } catch { /* storage unavailable: stay hidden */ }
  }, [])
  const toggle = useCallback(() => {
    setHidden((h) => {
      const next = !h
      try { window.localStorage.setItem(KEY, next ? '0' : '1') } catch { /* ignore */ }
      return next
    })
  }, [])
  return { hidden, toggle }
}

/** Classes that blur a figure while it is hidden. */
export const HIDDEN_MONEY = 'blur-[7px] select-none'
