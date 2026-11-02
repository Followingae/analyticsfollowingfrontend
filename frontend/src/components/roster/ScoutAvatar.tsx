"use client"

/**
 * ScoutAI's face: the droid in Following lime with round glasses. The same character as on
 * following.ae/scout. Browsers without OffscreenCanvas get the still picture instead.
 */
import * as React from "react"
import { useEffect, useState } from "react"
import { BotAvatar } from "bot-avatars"

export function ScoutAvatar({ size = 40, state = "default", interactive = false }: {
  size?: number; state?: "default" | "working" | "sleeping"; interactive?: boolean
}) {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => { setOk("OffscreenCanvas" in window) }, [])
  if (ok === null) return <span style={{ display: "inline-block", width: size, height: size }} />
  if (!ok) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="https://www.following.ae/scout/scoutai.png" alt="ScoutAI" width={size} height={size} />
  }
  return <BotAvatar type="droid" color="#d3ff02" face="mouth" glasses="round" size={size} state={state}
                    interactive={interactive} theme="light" />
}
