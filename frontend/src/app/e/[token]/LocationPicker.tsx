'use client'

/**
 * The delivery pin: a real map you open, pan and fine-tune.
 *
 * THE CENTRE CROSSHAIR PATTERN, not a draggable marker. The pin stays fixed in the middle
 * of the screen and you move the MAP underneath it. Every delivery app in this market works
 * that way (Careem, Talabat, Deliveroo) for one reason: dragging a small marker with a thumb
 * means your own hand covers the thing you are aiming at. Moving the map keeps the target
 * visible the whole time.
 *
 * EVERYTHING RUNS IN THE BROWSER. The key is HTTP-referrer restricted, which is what stops
 * it being usable by anyone who reads it out of the bundle, and Google refuses referrer
 * restricted keys on their server-side web services. So the geocoding here goes through
 * `google.maps.Geocoder` in the page rather than the Geocoding REST endpoint, which is
 * refused outright. Verified against the live key.
 *
 * IT DEGRADES. No key configured, a blocked script, no signal: `available` goes false and
 * the caller falls back to typing an address and pasting a Maps link. A creator who cannot
 * load a map must still be able to finish their enrolment.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
export const mapsAvailable = () => !!KEY

// Dubai Marina. Only ever the opening view when we know nothing about the creator, and it
// is a better guess for this roster than the middle of the ocean at 0,0.
const FALLBACK = { lat: 25.0805, lng: 55.1403 }

type LatLng = { lat: number; lng: number }

// ---------------------------------------------------------------------------------------
// Script loading. One promise for the page, so opening the sheet twice does not fetch the
// API twice or race two callbacks against each other.
// ---------------------------------------------------------------------------------------
let loader: Promise<void> | null = null

function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('server'))
  const w = window as unknown as { google?: { maps?: unknown } }
  if (w.google?.maps) return Promise.resolve()
  if (loader) return loader

  loader = new Promise<void>((resolve, reject) => {
    const cb = '__gmapsEnrolReady'
    ;(window as unknown as Record<string, unknown>)[cb] = () => resolve()
    const s = document.createElement('script')
    // `loading=async` is what Google asks for; without it the console warns about
    // suboptimal loading on every open.
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}`
      + `&libraries=places&loading=async&callback=${cb}&v=weekly&region=AE&language=en`
    s.async = true
    s.onerror = () => reject(new Error('maps_script_failed'))
    document.head.appendChild(s)
    // A key that is rejected never calls the callback, it calls this instead. Without it
    // the sheet would spin forever on a misconfigured key.
    ;(window as unknown as Record<string, unknown>).gm_authFailure = () =>
      reject(new Error('maps_auth_failed'))
  })
  return loader
}

// ---------------------------------------------------------------------------------------
export interface PickedPlace {
  lat: number
  lng: number
  address: string
  line: string
  city: string
}

export function LocationPicker({ open, initial, onClose, onPick }: {
  open: boolean
  initial?: { lat?: number | null; lng?: number | null }
  onClose: () => void
  onPick: (p: PickedPlace) => void
}) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [addr, setAddr] = useState<string>('')
  const [resolving, setResolving] = useState(false)
  const [locating, setLocating] = useState(false)
  const centre = useRef<LatLng>(FALLBACK)

  /** Turn wherever the map is centred into a street address. */
  const reverse = useCallback((at: LatLng) => {
    const g = (window as any).google
    if (!g?.maps) return
    setResolving(true)
    new g.maps.Geocoder().geocode({ location: at }, (res: any[], status: string) => {
      setResolving(false)
      setAddr(status === 'OK' && res?.[0] ? res[0].formatted_address : '')
    })
  }, [])

  // ---- build the map once the sheet opens --------------------------------------------
  useEffect(() => {
    if (!open) return
    let dead = false
    setState('loading')

    loadMaps().then(() => {
      if (dead || !boxRef.current) return
      const g = (window as any).google
      const start: LatLng = (initial?.lat != null && initial?.lng != null)
        ? { lat: initial.lat, lng: initial.lng } : FALLBACK
      centre.current = start

      const map = new g.maps.Map(boxRef.current, {
        center: start,
        zoom: initial?.lat != null ? 18 : 12,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',   // one finger pans; this is a full screen map, not a card
        clickableIcons: false,
        // Google's own dark styling, so the map is not a white slab in a black page.
        styles: DARK,
      })
      mapRef.current = map

      // Only geocode when the map SETTLES. `center_changed` fires on every frame of a pan
      // and would put a request in flight for each one.
      map.addListener('idle', () => {
        const c = map.getCenter()
        centre.current = { lat: c.lat(), lng: c.lng() }
        reverse(centre.current)
      })

      // Search. The Autocomplete widget is attached to our own input so it inherits the
      // page's styling rather than arriving as a white Google box.
      if (searchRef.current && g.maps.places) {
        const ac = new g.maps.places.Autocomplete(searchRef.current, {
          fields: ['geometry'],
          componentRestrictions: { country: ['ae'] },
        })
        ac.addListener('place_changed', () => {
          const p = ac.getPlace()
          if (p?.geometry?.location) {
            map.panTo(p.geometry.location)
            map.setZoom(18)
          }
        })
      }

      setState('ready')
    }).catch(() => { if (!dead) setState('failed') })

    return () => { dead = true }
  }, [open, initial?.lat, initial?.lng, reverse])

  const locate = () => {
    if (!navigator.geolocation || !mapRef.current) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        mapRef.current.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        mapRef.current.setZoom(18)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50, background: '#050506',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 430, position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* search */}
        <div style={{ padding: '14px 16px 12px', display: 'flex', gap: 9, alignItems: 'center' }}>
          <button onClick={onClose} style={{
            width: 40, height: 40, borderRadius: '50%', background: '#17171A', border: 'none',
            display: 'grid', placeItems: 'center', flex: 'none', cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <input
            ref={searchRef}
            placeholder="Search your building or area"
            autoCapitalize="off"
            style={{
              flex: 1, background: '#121215', border: '1px solid #1E1E22', borderRadius: 14,
              padding: '12px 14px', fontSize: 14.5, fontWeight: 600, color: '#fff',
              outline: 'none', fontFamily: 'inherit', minWidth: 0,
            }}
          />
        </div>

        {/* the map */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <div ref={boxRef} style={{ position: 'absolute', inset: 0, background: '#0E0E11' }} />

          {state === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#5E5E66', fontSize: 14, background: '#0E0E11' }}>
              Loading the map…
            </div>
          )}
          {state === 'failed' && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 30, textAlign: 'center', color: '#8A8A93', fontSize: 14, lineHeight: 1.6, background: '#0E0E11' }}>
              The map could not load. Close this and type your address instead, or paste a Maps link.
            </div>
          )}

          {/* The crosshair. Sits dead centre, above the map, and ignores pointer events so
              it never eats a pan. Offset up by half its height so the POINT is the centre,
              not the middle of the teardrop. */}
          {state === 'ready' && (
            <div style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-100%)',
              pointerEvents: 'none', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.55))',
            }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="#1FD16B" stroke="#04170C" strokeWidth="1.1">
                <path d="M12 22s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
                <circle cx="12" cy="11" r="2.6" fill="#04170C" stroke="none" />
              </svg>
            </div>
          )}

          {state === 'ready' && (
            <button onClick={locate} disabled={locating} style={{
              position: 'absolute', right: 14, bottom: 14, height: 44, padding: '0 16px',
              borderRadius: 999, background: '#17171A', color: '#fff', border: '1px solid #26262C',
              fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1FD16B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
              {locating ? 'Finding…' : 'My location'}
            </button>
          )}
        </div>

        {/* what is under the pin, and the confirm */}
        <div style={{ padding: '16px 16px 22px', background: '#050506', borderTop: '1px solid #17171A' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', color: '#5E5E66' }}>
            PIN IS HERE
          </div>
          <div style={{ marginTop: 8, fontSize: 14.5, fontWeight: 600, color: '#fff', lineHeight: 1.45, minHeight: 42 }}>
            {resolving ? 'Checking…' : addr || 'Move the map to place the pin'}
          </div>
          <button
            onClick={() => {
              // The whole formatted address is kept for the courier. `line` and `city` are
              // split off it only to prefill the typed fields, and the creator can correct
              // both: Google's idea of a street is not always what a driver needs.
              const parts = addr.split(',').map((x) => x.trim()).filter(Boolean)
              const city = parts.length >= 2 ? parts[parts.length - 2] : ''
              const line = parts.slice(0, Math.max(1, parts.length - 2)).join(', ')
              onPick({
                lat: Number(centre.current.lat.toFixed(6)),
                lng: Number(centre.current.lng.toFixed(6)),
                address: addr, line: line || addr, city,
              })
            }}
            disabled={state !== 'ready'}
            style={{
              width: '100%', marginTop: 14, borderRadius: 20, padding: 17, textAlign: 'center',
              fontSize: 16, fontWeight: 700, minHeight: 44, border: 'none', fontFamily: 'inherit',
              cursor: state === 'ready' ? 'pointer' : 'default',
              background: state === 'ready' ? '#fff' : '#1C1C20',
              color: state === 'ready' ? '#050506' : '#5E5E66',
            }}
          >Confirm this location</button>
        </div>
      </div>
    </div>
  )
}

/** Google's own night styling, trimmed to what this map shows. */
const DARK = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
]
