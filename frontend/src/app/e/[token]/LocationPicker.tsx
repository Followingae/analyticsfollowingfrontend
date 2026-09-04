'use client'

/**
 * The delivery pin: a map in the form, that opens out when you need to be precise.
 *
 * Inline at 230px so it is the obvious way to answer "where do we send this", and tapping
 * it fills the screen for the fiddly part. It used to be full screen behind an "Open the
 * map" button, which made the accurate route the effortful one; then it was inline only,
 * which is too small a window to place a pin on the right side of a building.
 *
 * ONE MAP INSTANCE, MOVED BETWEEN TWO HOSTS. Expanding re-parents the map's own div from
 * the inline box into a full screen host and triggers a resize. Building a second map for
 * the expanded view would throw away the pan and zoom somebody just did, and pay for
 * another map load.
 *
 * THE FULL SCREEN HOST IS A PORTAL, and that is load bearing. The step screen sits inside a
 * wrapper carrying an opacity animation, and an animated element is a stacking context, so
 * `position: fixed` inside it resolves against the wrapper rather than the viewport. The
 * page header drew straight over the map the first time this shipped.
 *
 * THE CENTRE CROSSHAIR PATTERN, not a draggable marker. The pin is fixed in the middle and
 * the MAP moves under it, which is how every delivery app in this market works: dragging a
 * small marker with a thumb means your own hand covers the thing you are aiming at.
 *
 * EVERYTHING RUNS IN THE BROWSER, forced rather than chosen. The key is HTTP referrer
 * restricted, and Google refuses those on their server-side web services: the Geocoding
 * REST endpoint answers REQUEST_DENIED for this exact key.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
export const mapsAvailable = () => !!KEY

// Dubai. Only ever the opening view before we locate them.
const FALLBACK = { lat: 25.0805, lng: 55.1403 }

type LatLng = { lat: number; lng: number }

export interface PickedPlace {
  lat: number
  lng: number
  address: string
  line: string
  city: string
}

let loader: Promise<void> | null = null

function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('server'))
  const w = window as unknown as { google?: { maps?: unknown } }
  if (w.google?.maps) return Promise.resolve()
  if (loader) return loader

  loader = new Promise<void>((resolve, reject) => {
    const cb = '__gmapsEnrolReady'
    ;(window as unknown as Record<string, unknown>)[cb] = () => resolve()
    // A rejected key never calls the callback, it calls this. Without it the map spins
    // forever on a misconfigured key instead of falling back to the typed fields.
    ;(window as unknown as Record<string, unknown>).gm_authFailure = () =>
      reject(new Error('maps_auth_failed'))
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}`
      + `&libraries=places&loading=async&callback=${cb}&v=weekly&region=AE&language=en`
    s.async = true
    s.onerror = () => reject(new Error('maps_script_failed'))
    document.head.appendChild(s)
  })
  return loader
}

/**
 * Split a formatted address into something that fits our two fields.
 *
 * Google leads with a PLUS CODE when it has no street number for the point, so a pin on a
 * pavement comes back as "34GP+74 - 331 King Salman Bin Abdulaziz Al Saud St - Dubai
 * Marina - Dubai". Prefilling "34GP+74" as a delivery address is worse than leaving the
 * field empty: it looks filled in, and it means nothing to a driver.
 */
function split(address: string) {
  const cleaned = address.replace(/^[A-Z0-9]{4,6}\+[A-Z0-9]{2,4}\s*[-,]?\s*/i, '').trim()
  const parts = cleaned.split(',').map((x) => x.trim()).filter(Boolean)
  const city = parts.length >= 2 ? parts[parts.length - 2] : ''
  const line = parts.slice(0, Math.max(1, parts.length - 2)).join(', ')
  return { line: line || cleaned, city }
}

export function InlineMapPicker({ initial, onPick, onUnavailable }: {
  initial?: { lat?: number | null; lng?: number | null }
  onPick: (p: PickedPlace) => void
  onUnavailable?: () => void
}) {
  const inlineHost = useRef<HTMLDivElement | null>(null)
  const fullHost = useRef<HTMLDivElement | null>(null)
  const mapDiv = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const centre = useRef<LatLng>(FALLBACK)
  const located = useRef(false)
  const press = useRef<{ x: number; y: number } | null>(null)

  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [big, setBig] = useState(false)
  const [addr, setAddr] = useState('')
  const [busy, setBusy] = useState(false)
  const [denied, setDenied] = useState(false)

  const settle = useCallback((at: LatLng) => {
    const g = (window as any).google
    if (!g?.maps) return
    setBusy(true)
    new g.maps.Geocoder().geocode({ location: at }, (res: any[], status: string) => {
      setBusy(false)
      const text = status === 'OK' && res?.[0] ? res[0].formatted_address : ''
      setAddr(text)
      // Reported on every settle rather than behind a confirm button: wherever the map is
      // left IS the answer, the same way it is in a delivery app.
      onPick({ lat: at.lat, lng: at.lng, address: text, ...split(text) })
    })
  }, [onPick])

  const goTo = useCallback((at: LatLng, zoom?: number) => {
    if (!mapRef.current) return
    mapRef.current.panTo(at)
    if (zoom) mapRef.current.setZoom(zoom)
  }, [])

  const locate = useCallback((manual: boolean) => {
    if (!navigator.geolocation) { if (manual) setDenied(true); return }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false); setDenied(false)
        goTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 18)
      },
      () => { setBusy(false); if (manual) setDenied(true) },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }, [goTo])

  // ---- build once --------------------------------------------------------------------
  useEffect(() => {
    let dead = false
    loadMaps().then(() => {
      if (dead || !inlineHost.current) return
      const g = (window as any).google

      const div = document.createElement('div')
      div.style.width = '100%'
      div.style.height = '100%'
      mapDiv.current = div
      inlineHost.current.appendChild(div)

      const hasPin = initial?.lat != null && initial?.lng != null
      const start: LatLng = hasPin
        ? { lat: initial!.lat as number, lng: initial!.lng as number } : FALLBACK
      centre.current = start

      const map = new g.maps.Map(div, {
        center: start,
        zoom: hasPin ? 18 : 11,
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: 'greedy',
        // Icons stay UNCLICKABLE but visible. People find their building by the restaurant
        // on the corner, so hiding the places would remove the landmarks they navigate by;
        // making them clickable would open Google's own info card over our crosshair.
        clickableIcons: false,
        keyboardShortcuts: false,
        styles: DARK,
      })
      mapRef.current = map

      // Only geocode when the map SETTLES. `center_changed` fires every frame of a pan and
      // would put a request in flight for each one.
      map.addListener('idle', () => {
        const c = map.getCenter()
        centre.current = { lat: c.lat(), lng: c.lng() }
        settle(centre.current)
      })

      setState('ready')
      if (!hasPin && !located.current) { located.current = true; locate(false) }
    }).catch(() => {
      if (dead) return
      setState('failed')
      onUnavailable?.()
    })
    return () => { dead = true }
    // Mount-only on purpose: re-running would rebuild the map under the creator's finger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- search, rebound whenever the input remounts between the two views --------------
  useEffect(() => {
    if (state !== 'ready' || !searchRef.current) return
    const g = (window as any).google
    if (!g?.maps?.places) return
    const ac = new g.maps.places.Autocomplete(searchRef.current, {
      fields: ['geometry'],
      componentRestrictions: { country: ['ae'] },
    })
    const l = ac.addListener('place_changed', () => {
      const p = ac.getPlace()
      if (p?.geometry?.location) {
        goTo({ lat: p.geometry.location.lat(), lng: p.geometry.location.lng() }, 18)
      }
    })
    // Enter must not submit the enrolment form from under the dropdown.
    const stop = (e: KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }
    searchRef.current.addEventListener('keydown', stop)
    const node = searchRef.current
    return () => {
      l?.remove?.()
      node.removeEventListener('keydown', stop)
      // Google leaves its dropdown attached to <body>; without this a stale one hangs
      // around after the expanded view closes.
      document.querySelectorAll('.pac-container').forEach((n) => n.remove())
    }
  }, [state, big, goTo])

  // ---- move the map between the two hosts --------------------------------------------
  useEffect(() => {
    const div = mapDiv.current
    const host = big ? fullHost.current : inlineHost.current
    if (!div || !host || div.parentElement === host) return
    const at = centre.current
    host.appendChild(div)
    const g = (window as any).google
    if (g?.maps && mapRef.current) {
      g.maps.event.trigger(mapRef.current, 'resize')
      // Resizing keeps the top-left corner, not the middle, so the pin would drift off the
      // place somebody just chose. Put the centre back explicitly.
      mapRef.current.setCenter(at)
    }
  }, [big])

  // Escape closes the expanded view, which is what a full screen layer should always do.
  useEffect(() => {
    if (!big) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setBig(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [big])

  if (state === 'failed') return null

  const search = (
    <input
      ref={searchRef}
      placeholder="Search your building or area"
      autoCapitalize="off" autoCorrect="off" spellCheck={false}
      style={{
        width: '100%', background: '#0E0E11', borderRadius: 14,
        border: '1px solid #1E1E22', padding: '13px 14px', fontSize: 14,
        fontWeight: 600, color: '#fff', outline: 'none', fontFamily: 'inherit',
      }}
    />
  )

  const crosshair = (size: number) => (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-100%)',
      pointerEvents: 'none', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.6))',
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#1FD16B" stroke="#04170C" strokeWidth="1.1">
        <path d="M12 22s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
        <circle cx="12" cy="11" r="2.6" fill="#04170C" stroke="none" />
      </svg>
    </div>
  )

  const findMe = (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); locate(true) }}
      style={{
        position: 'absolute', right: 10, bottom: 10, height: 38, padding: '0 13px',
        borderRadius: 999, background: 'rgba(10,10,12,.86)', backdropFilter: 'blur(6px)',
        color: '#fff', border: '1px solid #2A2A32', fontSize: 12.5, fontWeight: 700,
        fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1FD16B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
      Find me
    </button>
  )

  const pinLine = (
    <div style={{
      fontSize: 12.5, fontWeight: 600, lineHeight: 1.45,
      color: addr ? '#C8C8D0' : '#7E7E87', minHeight: 18,
    }}>
      {busy ? 'Checking…'
        : addr ? <><span style={{ color: '#1FD16B' }}>Pin:</span> {addr}</>
          : 'Move the map so the pin sits on your building.'}
    </div>
  )

  return (
    <>
      <style>{PAC_CSS}</style>

      {!big && search}

      {/* Inline. A tap that did not drag opens the expanded view; a drag pans, which is why
          this is measured rather than being a plain onClick. */}
      <div
        onPointerDown={(e) => { press.current = { x: e.clientX, y: e.clientY } }}
        onPointerUp={(e) => {
          const p = press.current; press.current = null
          if (!p) return
          if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 8) setBig(true)
        }}
        style={{
          position: 'relative', marginTop: 10, height: 230, borderRadius: 16,
          overflow: 'hidden', background: '#0E0E11', cursor: 'pointer',
        }}
      >
        <div ref={inlineHost} style={{ position: 'absolute', inset: 0 }} />
        {state === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#5E5E66', fontSize: 13 }}>
            Loading the map…
          </div>
        )}
        {state === 'ready' && !big && (
          <>
            {crosshair(34)}
            {findMe}
            <div style={{
              position: 'absolute', left: 10, top: 10, display: 'flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 11px', borderRadius: 999, background: 'rgba(10,10,12,.86)',
              backdropFilter: 'blur(6px)', border: '1px solid #2A2A32',
              fontSize: 12, fontWeight: 700, color: '#fff', pointerEvents: 'none',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
              Tap to expand
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 9 }}>{pinLine}</div>

      {denied && (
        <div style={{ marginTop: 7, fontSize: 12, fontWeight: 600, color: '#8A8A93', lineHeight: 1.45 }}>
          Location is blocked in your browser. Search above, or move the map by hand.
        </div>
      )}

      {/* Expanded. Portalled to <body> so no animated ancestor can trap the fixed layer. */}
      {big && typeof document !== 'undefined' && createPortal((
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: '#050506',
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px 12px', display: 'flex', gap: 9, alignItems: 'center' }}>
              <button type="button" onClick={() => setBig(false)} style={{
                width: 40, height: 40, borderRadius: '50%', background: '#17171A', border: 'none',
                display: 'grid', placeItems: 'center', flex: 'none', cursor: 'pointer',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>{search}</div>
            </div>

            <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
              <div ref={fullHost} style={{ position: 'absolute', inset: 0 }} />
              {crosshair(44)}
              {findMe}
            </div>

            <div style={{ padding: '14px 16px 22px', borderTop: '1px solid #17171A' }}>
              {pinLine}
              <button
                type="button"
                onClick={() => setBig(false)}
                style={{
                  width: '100%', marginTop: 12, borderRadius: 20, padding: 17, textAlign: 'center',
                  fontSize: 16, fontWeight: 700, minHeight: 44, border: 'none',
                  fontFamily: 'inherit', cursor: 'pointer', background: '#fff', color: '#050506',
                }}
              >Use this location</button>
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  )
}

/** Google's dropdown, restyled to belong to this page and lifted above the expanded map. */
const PAC_CSS = `
.pac-container{
  z-index:100000 !important;
  background:#121215;
  border:1px solid #26262C;
  border-radius:14px;
  margin-top:6px;
  padding:6px;
  box-shadow:0 20px 40px -18px rgba(0,0,0,.9);
  font-family:'Urbanist',system-ui,sans-serif;
}
.pac-container:after{display:none !important;}
.pac-item{border:0;padding:10px;border-radius:10px;color:#C8C8D0;font-size:13.5px;cursor:pointer;}
.pac-item:hover,.pac-item-selected{background:#1C1C20;}
.pac-item-query{color:#fff;font-size:14px;font-weight:600;}
.pac-matched{color:#1FD16B;}
.pac-icon{display:none;}
`

/**
 * Google's night styling, with the places left ON.
 *
 * The stock dark style hides POI icons and dims their labels to near invisible. That is
 * right for a map used as a backdrop and wrong for one used to find a building: people
 * locate themselves by the restaurant on the corner and the mall across the road, so the
 * businesses, the food places and the transit stops are all legible here.
 */
const DARK = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9aa0a6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#141414' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d6d6d6' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#b9b9b9' }] },
  // The landmarks somebody actually navigates by.
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#cfd3d6' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.business', elementType: 'labels.text.fill', stylers: [{ color: '#e0c48a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1b2a1b' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#8fb08f' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#a8a8a8' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#9fb6c9' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1620' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4f6a80' }] },
]
