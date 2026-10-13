import { useQuery } from '@tanstack/react-query'
import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AtticNotes } from './components/ui/AtticNotes'
import { Header, Landing, PaperFilters, Trail } from './components/ui/Chrome'
import { Scroll, TicketRack } from './components/ui/Compartment'
import { Guestbook } from './components/ui/Guestbook'
import { Letter } from './components/ui/Letter'
import { Panel } from './components/ui/Panel'
import { Sprout, Sprouting } from './components/ui/Sprout'
import { CHARMS, OWNER, SKILLS } from './content/site'
import { COMPACT, useMediaQuery, useMode } from './hooks/useLayout'
import { seatsQuery } from './hooks/useProjects'
import { readPhase, type Weather } from './lib/air'
import { isPlaceId, PLACES, type Hot, type PlaceId } from './lib/places'

// three.js, R3F, drei and the post-processing land in their own chunk; the
// title and the sprout paint from this small one before it arrives.
const World = lazy(() => import('./components/World'))

const SEATS = 4
const hasPanel = (place: PlaceId) => place !== 'halt'

/** The address names the scene, and in the train the seat: `#/bakery`, `#/train/seat-2`. */
function readAddress(): { place: PlaceId; seat: number | null } {
  const [, first = '', second = ''] = window.location.hash.split('/')
  const place = isPlaceId(first) ? first : 'halt'
  const seat = Number(second.replace('seat-', '')) - 1
  return { place, seat: place === 'train' && Number.isInteger(seat) && seat >= 0 && seat < SEATS ? seat : null }
}

const addressOf = (place: PlaceId, seat: number | null = null) => (place === 'halt' ? window.location.pathname + window.location.search : `#/${place}${seat === null ? '' : `/seat-${seat + 1}`}`)

/** If the world cannot be drawn (no WebGL, a failed download) the words must still be reachable. */
class Unpaintable extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFail()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function App() {
  const mode = useMode()
  const compact = useMediaQuery(COMPACT)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [phase] = useState(readPhase)
  const [weather, setWeather] = useState<Weather>('sun')
  const [{ place, open, seat }, setWhere] = useState(() => {
    const address = readAddress()
    return { ...address, open: hasPanel(address.place) }
  })
  const [hot, setHot] = useState<Hot | null>(null)
  const [ready, setReady] = useState(false)
  const [painted, setPainted] = useState(true)
  const arrival = useRef<number | undefined>(undefined)
  // The latest whereabouts, for handlers that must not be rebuilt on every step.
  const where = useRef({ place, open, seat })
  useEffect(() => {
    where.current = { place, open, seat }
  }, [place, open, seat])
  const seats = useQuery(seatsQuery).data

  // It is always night at the campfire, and the page goes dark with it.
  const night = phase === 'night' || Boolean(PLACES[place].night)
  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#171b2e' : '#f7f4eb')
  }, [night])

  /** Go to a scene. With `andOpen`, its panel opens once the camera has arrived and had a look round. */
  const visit = useCallback(
    (to: PlaceId, andOpen = false) => {
      window.clearTimeout(arrival.current)
      setHot(null)
      const now = where.current
      if (now.place === to) {
        setWhere({ place: to, seat: null, open: hasPanel(to) && (andOpen || now.open) })
        return
      }
      window.history.pushState(null, '', addressOf(to))
      setWhere({ place: to, seat: null, open: false })
      if (!andOpen || !hasPanel(to)) return
      // How long the camera takes: a wash on a phone, a glide aboard from the halt, a veiled journey anywhere else.
      const travel = !painted ? 0 : mode === 'backdrop' || reducedMotion ? 700 : now.place === 'halt' && to === 'train' ? 3500 : 2700
      const linger = painted && to === 'bakery' ? 1100 : 0
      arrival.current = window.setTimeout(() => setWhere((then) => (then.place === to ? { ...then, open: true } : then)), travel + linger)
    },
    [mode, painted, reducedMotion],
  )

  /** Pull down one seat's sheet, boarding the train first if need be. */
  const showProject = useCallback((index: number) => {
    window.clearTimeout(arrival.current)
    window.history.pushState(null, '', addressOf('train', index))
    setWhere({ place: 'train', open: true, seat: index })
  }, [])

  const closeSheet = useCallback(() => {
    if (where.current.seat === null) return
    window.history.replaceState(null, '', addressOf('train'))
    setWhere((now) => ({ ...now, seat: null }))
  }, [])

  const closePanel = useCallback(() => setWhere((now) => ({ ...now, open: false })), [])

  // Back, forward and hand-edited addresses.
  useEffect(() => {
    const follow = () => {
      window.clearTimeout(arrival.current)
      const address = readAddress()
      setWhere({ ...address, open: hasPanel(address.place) })
    }
    window.addEventListener('popstate', follow)
    window.addEventListener('hashchange', follow)
    return () => {
      window.removeEventListener('popstate', follow)
      window.removeEventListener('hashchange', follow)
    }
  }, [])

  // Escape puts the open panel away. (The sheet is a dialog and handles Escape itself.)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && seat === null && open) closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [seat, open, closePanel])

  useEffect(() => {
    document.title = place === 'halt' ? `${OWNER.name} · ${OWNER.title}` : `${PLACES[place].name}: ${PLACES[place].role} · ${OWNER.name}`
  }, [place])

  // The picture slides aside to leave the scene in view beside its panel (wide) or above its sheet (phone).
  const shift: readonly [number, number] = !open ? [0, 0] : compact ? [0, 0.17] : place === 'bakery' ? [-0.2, 0] : [-0.14, 0]
  const at = (id: PlaceId) => open && place === id

  return (
    <div className="stage">
      <PaperFilters />

      <div className="world">
        {painted && (
          <Unpaintable onFail={() => setPainted(false)}>
            <Suspense fallback={<Sprouting />}>
              <World
                place={place}
                open={open}
                mode={mode}
                phase={phase}
                weather={weather}
                reducedMotion={reducedMotion}
                hot={hot}
                seats={seats?.map(({ title }) => title) ?? []}
                clusters={SKILLS}
                charms={CHARMS}
                shift={shift}
                onHot={setHot}
                onVisit={visit}
                onProject={showProject}
                onReady={() => setReady(true)}
              />
            </Suspense>
          </Unpaintable>
        )}
      </div>

      <main className="overlay">
        <Header atHome={place === 'halt'} weather={weather} onHome={() => visit('halt')} onWeather={setWeather} />
        <Landing shown={place === 'halt'} ready={ready || !painted} onBoard={() => visit('train', true)} />

        <Panel open={at('train')} label="Projects" closeLabel="put the tickets away" onClose={closePanel}>
          <TicketRack hot={hot} onHot={setHot} onProject={showProject} />
        </Panel>
        <Panel open={at('bakery')} label="About Otis" closeLabel="close the guestbook" wide onClose={closePanel}>
          <Guestbook />
        </Panel>
        <Panel open={at('attic')} label="Skills" closeLabel="fold the inventory" onClose={closePanel}>
          <AtticNotes hot={hot} onHot={setHot} />
        </Panel>
        <Panel open={at('campfire')} label="Write to Otis" closeLabel="put the letter back" onClose={closePanel}>
          <Letter />
        </Panel>

        {!painted && <p className="unpainted hand">The world could not be painted on this device. Everything written in it is still here: follow the line below.</p>}
        <Trail place={place} shown={place !== 'halt' || compact || !painted} onVisit={(id) => visit(id, true)} />
        <p className="sr-only" aria-live="polite">
          {place === 'halt' ? '' : `${PLACES[place].name}: ${PLACES[place].role}`}
        </p>
        <Sprout />
      </main>

      <Scroll index={seat} seats={seats} onClose={closeSheet} />
    </div>
  )
}
