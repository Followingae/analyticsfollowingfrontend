'use client'

/**
 * The delivery pin: a map that is just there, in the form.
 *
 * It used to be a full screen sheet behind an "Open the map" button. That was wrong twice
 * over. A map is the primary way somebody gives a delivery location here, so hiding it
 * behind a button makes the accurate route the effortful one and the typed address the
 * default. And full screen was far more room than choosing a point needs.
 *
 * So: inline, 230px tall, sitting in the card between the search box and the address
 * fields, and it locates the creator on its own the moment it loads.
 *
 * THE CENTRE CROSSHAIR PATTERN, not a draggable marker. The pin is fixed in the middle and
 * the MAP moves under it, which is how every delivery app in this market works. Dragging a
 * small marker with a thumb means your own hand covers the thing you are aiming at.
 *
 * EVERYTHING RUNS IN THE BROWSER, and that is forced rather than chosen. The key is HTTP
 * referrer restricted, and Google refuses referrer restricted keys on their server-side web
 * services: the Geocoding REST endpoint answers REQUEST_DENIED for this exact key. So
 * geocoding goes through google.maps.Geocoder in the page.
 *
 * IT DEGRADES. No key, a blocked script, a rejected key: `failed` goes true and the caller
 * shows the typed fields alone. Somebody who cannot load a map must still be able to finish.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
export const mapsAvailable = () => !!KEY

// Dubai. Only ever the opening view before we locate them, and a better guess for this
// roster than the middle of the ocean at 0,0.
const FALLBACK = { lat: 25.0805, lng: 55.1403 }

type LatLng = { lat: number; lng: number }

export interface PickedPlace {
  lat: number
  lng: number
  address: string
  line: string
  city: string
}

// One promise for the page, so mounting twice does not fetch the API twice or race two
// callbacks against each other.
let loader: Promise<void> | null = null

function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('server'))
  const w = window as unknown as { google?: { maps?: unknown } }
  if (w.google?.maps) return Promise.resolve()
  if (loader) return loader

  loader = new Promise<void>((resolve, reject) => {
    const cb = '__gmapsEnrolReady'
    ;(window as unknown as Record<string, unknown>)[cb] = () => resolve()
    // A rejected key never calls the callback, it calls this. Without it the map would spin
    // forever on a misconfigured key instead of falling back.
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
 * Marina - Dubai". Prefilling "34GP+74" as somebody's delivery address is worse than
 * leaving the field empty: it looks filled in, and it means nothing to a driver. Stripped.
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
  const boxRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const mapRef = useRef<any>(null)
  const centre = useRef<LatLng>(FALLBACK)
  // Guards the one-time auto-locate, so panning away does not snap you back.
  const located = useRef(false)

  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
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
      // Report on every settle, not on a confirm button. There is no confirm step any more:
      // wherever the map is left IS the answer, the same way it is in a delivery app.
      onPick({ lat: at.lat, lng: at.lng, address: text, ...split(text) })
    })
  }, [onPick])

  const goTo = useCallback((at: LatLng, zoom = 17) => {
    if (!mapRef.current) return
    mapRef.current.panTo(at)
    mapRef.current.setZoom(zoom)
  }, [])

  const locate = useCallback((manual: boolean) => {
    if (!navigator.geolocation) { if (manual) setDenied(true); return }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false); setDenied(false)
        goTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 17)
      },
      () => { setBusy(false); if (manual) setDenied(true) },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }, [goTo])

  useEffect(() => {
    let dead = false
    loadMaps().then(() => {
      if (dead || !boxRef.current) return
      const g = (window as any).google
      const hasPin = initial?.lat != null && initial?.lng != null
      const start: LatLng = hasPin
        ? { lat: initial!.lat as number, lng: initial!.lng as number } : FALLBACK
      centre.current = start

      const map = new g.maps.Map(boxRef.current, {
        center: start,
        zoom: hasPin ? 17 : 11,
        disableDefaultUI: true,
        zoomControl: false,       // a 230px map is pinched and double tapped, not clicked
        gestureHandling: 'greedy',
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

      if (searchRef.current && g.maps.places) {
        const ac = new g.maps.places.Autocomplete(searchRef.current, {
          fields: ['geometry'],
          componentRestrictions: { country: ['ae'] },
        })
        ac.addListener('place_changed', () => {
          const p = ac.getPlace()
          if (p?.geometry?.location) {
            goTo({ lat: p.geometry.location.lat(), lng: p.geometry.location.lng() }, 18)
          }
        })
        // Enter must not submit the enrolment form from under the dropdown.
        searchRef.current.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') e.preventDefault()
        })
      }

      setState('ready')
      // Find them straight away. Somebody filling in a delivery address is almost always at
      // the address, and starting on a city-wide view of Dubai makes them do work we can do
      // for them. A refusal just leaves the map where it is.
      if (!hasPin && !located.current) { located.current = true; locate(false) }
    }).catch(() => {
      if (dead) return
      setState('failed')
      onUnavailable?.()
    })
    return () => { dead = true }
    // Deliberately mount-only: re-running would rebuild the map under the creator's finger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state === 'failed') return null

  return (
    <>
      {/* Google's autocomplete dropdown is appended to <body> with its own light styling.
          Left alone it is a white box hanging off a black page, and at its default z-index
          it can slide under later content. */}
      <style>{PAC_CSS}</style>

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

      <div style={{
        position: 'relative', marginTop: 10, height: 230, borderRadius: 16,
        overflow: 'hidden', background: '#0E0E11',
      }}>
        <div ref={boxRef} style={{ position: 'absolute', inset: 0 }} />

        {state === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#5E5E66', fontSize: 13 }}>
            Loading the map…
          </div>
        )}

        {/* The crosshair. Ignores pointer events so it never eats a pan, and is offset up by
            its full height so the POINT is the centre rather than the middle of the drop. */}
        {state === 'ready' && (
          <div style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-100%)',
            pointerEvents: 'none', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.6))',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="#1FD16B" stroke="#04170C" strokeWidth="1.1">
              <path d="M12 22s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
              <circle cx="12" cy="11" r="2.6" fill="#04170C" stroke="none" />
            </svg>
          </div>
        )}

        {state === 'ready' && (
          <button
            type="button"
            onClick={() => locate(true)}
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
        )}
      </div>

      <div style={{
        marginTop: 9, fontSize: 12.5, fontWeight: 600, lineHeight: 1.45,
        color: addr ? '#C8C8D0' : '#7E7E87', minHeight: 18,
      }}>
        {busy ? 'Checking…'
          : addr ? <><span style={{ color: '#1FD16B' }}>Pin:</span> {addr}</>
            : 'Move the map so the pin sits on your building.'}
      </div>

      {denied && (
        <div style={{ marginTop: 7, fontSize: 12, fontWeight: 600, color: '#8A8A93', lineHeight: 1.45 }}>
          Location is blocked in your browser. Search above, or move the map by hand.
        </div>
      )}
    </>
  )
}

/** Google's dropdown, restyled to belong to this page. */
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
.pac-item{
  border:0;padding:10px 10px;border-radius:10px;color:#C8C8D0;font-size:13.5px;cursor:pointer;
}
.pac-item:hover,.pac-item-selected{background:#1C1C20;}
.pac-item-query{color:#fff;font-size:14px;font-weight:600;}
.pac-matched{color:#1FD16B;}
.pac-icon{display:none;}
`

/** Google's own night styling, trimmed to what this map shows. */
const DARK = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
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
