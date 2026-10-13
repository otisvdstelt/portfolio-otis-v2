import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Header, Landing, PaperFilters, Trail } from './components/ui/Chrome'
import { FieldNotes } from './components/ui/FieldNotes'
import { Journal } from './components/ui/Journal'
import { Letter } from './components/ui/Letter'
import { Panel } from './components/ui/Panel'
import { Sprout, Sprouting } from './components/ui/Sprout'
import { Docket, TicketRack } from './components/ui/Station'
import { CHARMS, OWNER, SKILLS } from './content/site'
import { useMediaQuery, useMode } from './hooks/useLayout'
import { useProjects } from './hooks/useProjects'
import { readPhase, type Weather } from './lib/air'
import { isPlaceId, PLACES, type Hot, type PlaceId } from './lib/places'

// three.js, R3F, drei and the post-processing land in their own chunk; the
// title and the sprout paint from this small one before it arrives.
const World = lazy(() => import('./components/World'))

const CAR_NAMES = ['First car', 'Second car', 'Third car']
const hasPanel = (place: PlaceId) => place !== 'hill' && place !== 'valley'

/** The address names the place, and at the station the car: `#/greenhouse`, `#/station/car-2`. */
function readAddress(): { place: PlaceId; car: number | null } {
  const [, first = '', second = ''] = window.location.hash.split('/')
  const place = isPlaceId(first) ? first : 'hill'
  const car = Number(second.replace('car-', '')) - 1
  return { place, car: place === 'station' && Number.isInteger(car) && car >= 0 && car < CAR_NAMES.length ? car : null }
}

const addressOf = (place: PlaceId, car: number | null = null) => (place === 'hill' ? window.location.pathname + window.location.search : `#/${place}${car === null ? '' : `/car-${car + 1}`}`)

/** If the valley cannot be drawn (no WebGL, a failed download) the words must still be reachable. */
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
  const compact = useMediaQuery('(max-width: 767px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [phase] = useState(readPhase)
  const [weather, setWeather] = useState<Weather>('sun')
  const [{ place, open, car }, setWhere] = useState(() => {
    const address = readAddress()
    return { ...address, open: hasPanel(address.place) }
  })
  const [hot, setHot] = useState<Hot | null>(null)
  const [ready, setReady] = useState(false)
  const [painted, setPainted] = useState(true)
  const arrival = useRef<number | undefined>(undefined)
  // The latest whereabouts, for handlers that must not be rebuilt on every step.
  const where = useRef({ place, open, car })
  useEffect(() => {
    where.current = { place, open, car }
  }, [place, open, car])
  const projects = useProjects()
  const cars = projects.data?.map((project) => project.title) ?? CAR_NAMES

  // How long the camera takes to get anywhere: a flight on a desktop, a wash to paper and back elsewhere.
  const travelTime = !painted ? 0 : mode === 'backdrop' || reducedMotion ? 650 : 1750

  /** Go to a place. With `andOpen`, its panel opens once the camera has arrived. */
  const visit = useCallback(
    (to: PlaceId, andOpen = false) => {
      window.clearTimeout(arrival.current)
      setHot(null)
      const now = where.current
      if (now.place === to) {
        setWhere({ place: to, car: null, open: hasPanel(to) && (andOpen || now.open) })
        return
      }
      window.history.pushState(null, '', addressOf(to))
      setWhere({ place: to, car: null, open: false })
      if (andOpen && hasPanel(to)) arrival.current = window.setTimeout(() => setWhere((then) => (then.place === to ? { ...then, open: true } : then)), travelTime)
    },
    [travelTime],
  )

  /** Open one train car's docket, travelling to the station first if need be. */
  const showProject = useCallback((index: number) => {
    window.clearTimeout(arrival.current)
    window.history.pushState(null, '', addressOf('station', index))
    setWhere({ place: 'station', open: true, car: index })
  }, [])

  const closeDocket = useCallback(() => {
    if (where.current.car === null) return
    window.history.replaceState(null, '', addressOf('station'))
    setWhere((now) => ({ ...now, car: null }))
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

  // Escape puts the open panel away. (The docket is a dialog and handles Escape itself.)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && car === null && open) closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [car, open, closePanel])

  useEffect(() => {
    document.title = place === 'hill' || place === 'valley' ? `${OWNER.name} · ${OWNER.title}` : `${PLACES[place].name}: ${PLACES[place].role} · ${OWNER.name}`
  }, [place])

  // The picture slides aside to leave the landmark in view beside its panel (wide) or above its sheet (phone).
  const shift: readonly [number, number] = !open ? [0, 0] : compact ? [0, 0.17] : place === 'greenhouse' ? [-0.21, 0] : [-0.15, 0]
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
                cars={cars}
                mills={SKILLS}
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
        <Header atHome={place === 'hill'} weather={weather} onHome={() => visit('hill')} onWeather={setWeather} />
        <Landing shown={place === 'hill'} ready={ready || !painted} onEnter={() => (painted ? visit('valley') : visit('greenhouse', true))} />

        <Panel open={at('greenhouse')} label="About Otis" closeLabel="close the journal" wide onClose={closePanel}>
          <Journal />
        </Panel>
        <Panel open={at('station')} label="Projects" closeLabel="put the tickets away" onClose={closePanel}>
          <TicketRack hot={hot} onHot={setHot} onProject={showProject} />
        </Panel>
        <Panel open={at('windmills')} label="Skills" closeLabel="fold the notes" onClose={closePanel}>
          <FieldNotes hot={hot} onHot={setHot} />
        </Panel>
        <Panel open={at('postbox')} label="Write to Otis" closeLabel="put the letter back" onClose={closePanel}>
          <Letter />
        </Panel>

        {!painted && <p className="unpainted hand">The valley could not be painted on this device. Everything written in it is still here: follow the trail below.</p>}
        <Trail place={place} shown={place !== 'hill' || compact || !painted} onVisit={(id) => visit(id, true)} />
        <p className="sr-only" aria-live="polite">
          {place === 'hill' ? '' : `${PLACES[place].name}: ${PLACES[place].role}`}
        </p>
      </main>

      <Sprout />
      <Docket index={car} onClose={closeDocket} />
    </div>
  )
}
