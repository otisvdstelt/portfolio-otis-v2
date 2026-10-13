import { useQuery } from '@tanstack/react-query'
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Bookmark } from './components/ui/Bookmark'
import { Catalogue, OpenBook } from './components/ui/Catalogue'
import { Header, Hint, Landing, PaperFilters, Prompts, Trail, type Prompt } from './components/ui/Chrome'
import { Journal } from './components/ui/Journal'
import { Levers } from './components/ui/Levers'
import { Panel } from './components/ui/Panel'
import { Postcard } from './components/ui/Postcard'
import { Sprout, Sprouting } from './components/ui/Sprout'
import { Tags } from './components/ui/Tags'
import { DIVISIONS, LINKS, OWNER } from './content/site'
import { COMPACT, useMediaQuery, useMode } from './hooks/useLayout'
import { seatsQuery, useLeaves } from './hooks/useProjects'
import { readPhase, type Weather } from './lib/air'
import { isDestination, isPlaceId, PLACES, type Hot, type PlaceId } from './lib/places'

// three.js, R3F, drei and the post-processing land in their own chunk; the
// title and the sprout paint from this small one before it arrives.
const World = lazy(() => import('./components/World'))

const BOOKS = 4

/** The address names the car, and in the library the book: `#/cab`, `#/library/book-2`. */
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
  /** The lever of the cab that has been left pulled. */
  const [pulled, setPulled] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [painted, setPainted] = useState(true)
  const arrival = useRef<number | undefined>(undefined)
  /** Bring the place's words out once the camera is there. */
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

  // On a phone, and wherever the world cannot be drawn, every car's words come up on a sheet as soon as the visitor is there.
  const sheets = compact || !painted
  const arrived = (painted ? reached : place) === place

  useEffect(() => {
    document.documentElement.dataset.theme = phase
  }, [phase])

  /** Go to a car. With `andOpen`, its words come out once the camera has arrived. */
  const visit = useCallback(
    (to: PlaceId, andOpen = false) => {
      window.clearTimeout(arrival.current)
      setHot(null)
      const now = where.current
      if (now.place === to) {
        if (andOpen && isDestination(to)) setWhere((then) => ({ ...then, open: true }))
        return
      }
      setPulled(null)
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

  /** Put away whatever is being read: the open book, or else the journal or the card. */
  const close = useCallback(() => {
    if (where.current.tome === null) {
      setWhere((then) => ({ ...then, open: false }))
      return
    }
    window.history.replaceState(null, '', addressOf('library'))
    setWhere((then) => ({ ...then, tome: null }))
  }, [])

  /** Pulling a lever leaves it pulled; pulling it again lets it go. */
  const pull = useCallback((index: number) => setPulled((now) => (now === index ? null : index)), [])

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
      if (tome !== null && sheets) return
      if (tome !== null || open) close()
      else setPulled(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tome, open, sheets, close])

  useEffect(() => {
    document.title = place === 'halt' ? `${OWNER.name} · ${OWNER.title}` : `${PLACES[place].name}: ${PLACES[place].role} · ${OWNER.name}`
  }, [place])

  // The lever that is working: the one under the pointer, or failing that the one left pulled.
  const lever = place !== 'cab' ? -1 : hot?.kind === 'lever' ? hot.index : (pulled ?? -1)
  const at = (id: PlaceId) => open && place === id
  // On a phone the picture slides up to stay in view above its sheet.
  const shift: readonly [number, number] = open && compact ? [0, 0.17] : [0, 0]

  // What can be done here, in words, for a wide screen. (On a phone the same things are on the car's sheet.)
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
      : place === 'compartment'
        ? { title: 'On the table', list: [{ label: 'Read the journal', note: 'about me', onPress: () => visit('compartment', true) }] }
        : place === 'cab'
          ? {
              title: 'Four levers on the desk',
              list: DIVISIONS.map(({ name }, index) => ({
                label: name,
                hot: lever === index,
                onPress: () => pull(index),
                onPoint: (over) => setHot(over ? { kind: 'lever', index } : null),
              })),
            }
          : place === 'mail'
            ? {
                title: 'On the desk, and in the pigeonholes',
                list: [
                  { label: 'Write a postcard', note: 'to me', onPress: () => visit('mail', true) },
                  ...LINKS.map(({ label, href }, index) => ({
                    label,
                    hot: hot?.kind === 'hole' && hot.index === index,
                    onPress: () => void window.open(href, '_blank', 'noopener,noreferrer'),
                    onPoint: (over: boolean) => setHot(over ? { kind: 'hole', index } : null),
                  })),
                ],
              }
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
                lever={lever}
                shift={shift}
                onHot={setHot}
                onVisit={visit}
                onProject={showProject}
                onLever={pull}
                onClose={close}
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
        {/* On a wide screen the book and the journal carry their own words in the picture; these are their ribbons. */}
        {!sheets && (
          <Bookmark shown={arrived && leaves !== null} label={`${leaves?.title ?? 'The book'}: links`} links={leaves ? [...(leaves.live ? [{ label: 'open the live site', href: leaves.live }] : []), { label: 'read the source', href: leaves.source }] : []} closeLabel="close the book" onClose={close}>
            {leaves && (
              <>
                <h2>
                  {leaves.volume}: {leaves.title}
                </h2>
                <p>{leaves.kind}</p>
                <p>{leaves.summary}</p>
                <p>Built with {leaves.stack}.</p>
                {'rows' in leaves.figures && <p>From GitHub, just now: {leaves.figures.rows.map(([label, value]) => `${label} ${value}`).join(', ')}.</p>}
                {'trouble' in leaves.figures && <p>{leaves.figures.trouble}</p>}
              </>
            )}
          </Bookmark>
        )}
        {!sheets && (
          <Bookmark shown={arrived && at('compartment')} label="The journal" closeLabel="close the journal" onClose={close}>
            <Journal />
          </Bookmark>
        )}

        {sheets && (
          <Panel open={at('library') && tome === null} label="Projects" closeLabel="put the catalogue away" onClose={close}>
            <Catalogue hot={hot} onHot={setHot} onProject={showProject} />
          </Panel>
        )}
        {sheets && (
          <Panel open={at('compartment')} label="About Otis" closeLabel="close the journal" wide onClose={close}>
            <Journal />
          </Panel>
        )}
        {sheets && (
          <Panel open={at('cab')} label="Skills" closeLabel="fold the list" onClose={close}>
            <Levers pulled={lever} onHot={setHot} onLever={pull} />
          </Panel>
        )}
        <Panel open={at('mail')} label="Write to Otis" closeLabel="put the card down" wide centre={!sheets} onClose={close}>
          <Postcard />
        </Panel>

        {!painted && <p className="unpainted hand">The world could not be painted on this device. Everything written in it is still here: follow the route map below.</p>}
        <Trail place={place} shown={place !== 'halt' || compact || !painted} onVisit={visit} />
        <p className="sr-only" aria-live="polite">
          {place === 'halt' ? '' : `${PLACES[place].name}: ${PLACES[place].role}`}
        </p>
        <Sprout />
      </main>

      <OpenBook index={sheets ? tome : null} seats={seats} onClose={() => where.current.tome !== null && close()} />
    </div>
  )
}
