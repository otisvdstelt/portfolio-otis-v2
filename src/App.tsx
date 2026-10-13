import { useQuery } from '@tanstack/react-query'
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Bookmark } from './components/ui/Bookmark'
import { Catalogue, OpenBook } from './components/ui/Catalogue'
import { Header, Hint, Landing, PaperFilters, Prompts, Trail, type Prompt } from './components/ui/Chrome'
import { Notepad } from './components/ui/Notepad'
import { Panel } from './components/ui/Panel'
import { Sketchpad } from './components/ui/Sketchpad'
import { Sprout, Sprouting } from './components/ui/Sprout'
import { Tags } from './components/ui/Tags'
import { Gust, Ways } from './components/ui/Waymarks'
import { DIVISIONS, OWNER, PLANKS } from './content/site'
import { COMPACT, useMediaQuery, useMode } from './hooks/useLayout'
import { seatsQuery, useLeaves } from './hooks/useProjects'
import { readPhase, type Weather } from './lib/air'
import { isDestination, isPlaceId, PLACES, type Hot, type PlaceId } from './lib/places'

// three.js, R3F, drei and the post-processing land in their own chunk; the
// title and the sprout paint from this small one before it arrives.
const World = lazy(() => import('./components/World'))

const BOOKS = 4

/** The address names the scene, and in the library the book: `#/tower`, `#/library/book-2`. */
function readAddress(): { place: PlaceId; tome: number | null } {
  const [, first = '', second = ''] = window.location.hash.split('/')
  const place = isPlaceId(first) ? first : 'halt'
  const book = Number(second.replace('book-', '')) - 1
  return { place, tome: place === 'library' && Number.isInteger(book) && book >= 0 && book < BOOKS ? book : null }
}

const addressOf = (place: PlaceId, tome: number | null = null) => (place === 'halt' ? window.location.pathname + window.location.search : `#/${place}${tome === null ? '' : `/book-${tome + 1}`}`)

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
  const [{ place, open, tome }, setWhere] = useState(() => {
    const address = readAddress()
    return { ...address, open: isDestination(address.place) && window.matchMedia(COMPACT).matches }
  })
  /** The place the camera has actually reached: it trails `place` by the length of the journey. */
  const [reached, setReached] = useState(place)
  const [hot, setHot] = useState<Hot | null>(null)
  /** The plaque of the signpost whose sheet is being kept out. */
  const [pinned, setPinned] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [painted, setPainted] = useState(true)
  const arrival = useRef<number | undefined>(undefined)
  /** Open the place's words once the camera is there. */
  const wanted = useRef(false)
  // The latest whereabouts, for handlers that must not be rebuilt on every step.
  const where = useRef({ place, open, tome })
  useEffect(() => {
    where.current = { place, open, tome }
  }, [place, open, tome])
  const seats = useQuery(seatsQuery).data
  const volumes = useMemo(() => seats?.map(({ title, kind }) => ({ title, kind })) ?? [], [seats])
  // The words of whichever book is open, with GitHub's figures for it.
  const { leaves, ask } = useLeaves(tome === null ? undefined : seats?.[tome], tome)

  // On a phone, and wherever the world cannot be drawn, every scene's words come up on a sheet as soon as the visitor is there.
  const sheets = compact || !painted
  const here = painted ? reached : place
  const arrived = here === place

  // It is always night at the bus stop, and the page goes dark with it.
  const night = phase === 'night' || Boolean(PLACES[here].mood.night)
  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#171b2e' : '#f7f4eb')
  }, [night])

  /** Go to a scene. With `andOpen`, its words come out once the camera has arrived. */
  const visit = useCallback(
    (to: PlaceId, andOpen = false) => {
      window.clearTimeout(arrival.current)
      setHot(null)
      const now = where.current
      if (now.place === to) {
        if (andOpen && isDestination(to)) setWhere((then) => ({ ...then, open: true }))
        return
      }
      setPinned(null)
      window.history.pushState(null, '', addressOf(to))
      const opens = isDestination(to) && (andOpen || sheets)
      // Without a picture there is no journey to wait for.
      wanted.current = opens && painted
      setWhere({ place: to, tome: null, open: opens && !painted })
    },
    [sheets, painted],
  )

  /** The camera has got somewhere. If the place's words were asked for, bring them out once the fog is off it. */
  const arrive = useCallback((at: PlaceId) => {
    setReached(at)
    if (at !== where.current.place || !wanted.current) return
    wanted.current = false
    arrival.current = window.setTimeout(() => setWhere((then) => (then.place === at ? { ...then, open: true } : then)), 1100)
  }, [])

  /** Take one book down and open it. */
  const showProject = useCallback((index: number) => {
    window.clearTimeout(arrival.current)
    setHot(null)
    window.history.pushState(null, '', addressOf('library', index))
    setWhere((then) => ({ place: 'library', open: then.place === 'library' && then.open, tome: index }))
  }, [])

  const closeBook = useCallback(() => {
    if (where.current.tome === null) return
    window.history.replaceState(null, '', addressOf('library'))
    setWhere((then) => ({ ...then, tome: null }))
  }, [])

  const closePanel = useCallback(() => setWhere((then) => ({ ...then, open: false })), [])
  /** Pressing a plaque keeps its sheet out; pressing it again lets the sheet go. */
  const pin = useCallback((index: number) => setPinned((now) => (now === index ? null : index)), [])

  // Back, forward and hand-edited addresses.
  useEffect(() => {
    const follow = () => {
      window.clearTimeout(arrival.current)
      const address = readAddress()
      const now = where.current
      const opens = isDestination(address.place) && sheets
      wanted.current = address.place !== now.place && opens && painted
      setWhere({ ...address, open: address.place === now.place ? now.open : opens && !painted })
    }
    window.addEventListener('popstate', follow)
    window.addEventListener('hashchange', follow)
    return () => {
      window.removeEventListener('popstate', follow)
      window.removeEventListener('hashchange', follow)
    }
  }, [sheets, painted])

  // Escape puts away whatever is out. (On a phone the open book is a dialog and handles Escape itself.)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (tome !== null) {
        if (!sheets) closeBook()
      } else if (open) closePanel()
      else setPinned(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tome, open, sheets, closeBook, closePanel])

  useEffect(() => {
    document.title = place === 'halt' ? `${OWNER.name} · ${OWNER.title}` : `${PLACES[place].name}: ${PLACES[place].role} · ${OWNER.name}`
  }, [place])

  // The plaque that has the sky: the one under the pointer, or failing that the one pinned.
  const pointed = place !== 'signpost' ? -1 : hot?.kind === 'plaque' ? hot.index : (pinned ?? -1)
  const at = (id: PlaceId) => open && place === id
  // The picture slides aside to leave the scene in view beside its panel (wide) or above its sheet (phone).
  const shift: readonly [number, number] = !open ? [0, 0] : compact ? [0, 0.17] : place === 'busstop' ? [-0.14, 0] : [0, 0]

  // What can be done here, in words, for a wide screen. (On a phone the same things are on the scene's sheet.)
  const prompts: { title: string; list: Prompt[] } =
    place === 'library'
      ? {
          title: 'Face out on the ledge',
          list: volumes.map(({ title, kind }, index) => ({
            label: title,
            note: kind,
            hot: hot?.kind === 'tome' && hot.index === index,
            onPress: () => showProject(index),
            onPoint: (over) => setHot(over ? { kind: 'tome', index } : null),
          })),
        }
      : place === 'tower'
        ? { title: 'On the drafting table', list: [{ label: 'Open the sketchpad', note: 'about me', onPress: () => visit('tower', true) }] }
        : place === 'signpost'
          ? {
              title: 'The post points four ways',
              list: DIVISIONS.map(({ name, hour }, index) => ({
                label: name,
                note: hour,
                hot: pointed === index,
                onPress: () => pin(index),
                onPoint: (over) => setHot(over ? { kind: 'plaque', index } : null),
              })),
            }
          : place === 'busstop'
            ? { title: 'Under the lantern', list: [{ label: 'Pick up the telephone', note: 'write to me', onPress: () => visit('busstop', true) }] }
            : { title: '', list: [] }

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
                volumes={volumes}
                tome={tome}
                leaves={leaves}
                divisions={DIVISIONS}
                plaque={pointed}
                planks={PLANKS}
                shift={shift}
                onHot={setHot}
                onVisit={visit}
                onProject={showProject}
                onPlaque={pin}
                onCloseBook={closeBook}
                onAsk={ask}
                onArrive={arrive}
                onReady={() => setReady(true)}
              />
            </Suspense>
          </Unpaintable>
        )}
        <Tags />
      </div>

      <main className="overlay">
        <Header atHome={place === 'halt'} weather={weather} onHome={() => visit('halt')} onWeather={setWeather} />
        <Landing shown={place === 'halt'} ready={ready || !painted} onBoard={() => visit('cabin')} />
        <Hint shown={place === 'cabin' && arrived && painted}>{compact ? 'Pick a stop below, and take a window seat.' : 'Look around. Then pick a bench, or a stop on the route map.'}</Hint>

        {!sheets && <Prompts shown={isDestination(place) && arrived && !open && tome === null} title={prompts.title} prompts={prompts.list} />}
        {!sheets && <Gust index={arrived ? pointed : -1} />}
        {!sheets && <Bookmark leaves={arrived ? leaves : null} onClose={closeBook} />}

        {sheets && (
          <Panel open={at('library') && tome === null} label="Projects" closeLabel="put the catalogue away" onClose={closePanel}>
            <Catalogue hot={hot} onHot={setHot} onProject={showProject} />
          </Panel>
        )}
        <Panel open={at('tower')} label="About Otis" closeLabel="close the sketchpad" wide centre={!sheets} onClose={closePanel}>
          <Sketchpad />
        </Panel>
        {sheets && (
          <Panel open={at('signpost')} label="Skills" closeLabel="fold the list" onClose={closePanel}>
            <Ways pointed={pointed} onHot={setHot} onPlaque={pin} />
          </Panel>
        )}
        <Panel open={at('busstop')} label="Write to Otis" closeLabel="hang up" onClose={closePanel}>
          <Notepad />
        </Panel>

        {!painted && <p className="unpainted hand">The world could not be painted on this device. Everything written in it is still here: follow the route map below.</p>}
        <Trail place={place} shown={place !== 'halt' || compact || !painted} onVisit={visit} />
        <p className="sr-only" aria-live="polite">
          {place === 'halt' ? '' : `${PLACES[place].name}: ${PLACES[place].role}`}
        </p>
        <Sprout />
      </main>

      <OpenBook index={sheets ? tome : null} seats={seats} onClose={closeBook} />
    </div>
  )
}
