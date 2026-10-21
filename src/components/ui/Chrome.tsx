import type { ReactNode } from 'react'
import { OWNER } from '../../content/site'
import type { Phase, Weather } from '../../lib/air'
import { PLACES, ROUTE, type PlaceId } from '../../lib/places'

/** The filters that make paper look torn and paint look wet, named by the stylesheet */
export function PaperFilters() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        {/* The deckle, the uneven edge of a sheet made by hand */}
        <filter id="deckle" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="4" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="deckle-fine" x="-6%" y="-12%" width="112%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="11" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* A brush that will not hold an even line */}
        <filter id="wobble" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Pigment spreading into wet paper */}
        <filter id="bleed" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="2" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="14" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>
    </svg>
  )
}

interface HeaderProps {
  /** At the halt the big title already says the name */
  atHome: boolean
  weather: Weather
  phase: Phase
  onHome: () => void
  onWeather: (weather: Weather) => void
  onPhase: (phase: Phase) => void
}

/** The top of the page, the name on a scrap and the hour and weather as two words */
export function Header({ atHome, weather, phase, onHome, onWeather, onPhase }: HeaderProps) {
  const raining = weather === 'rain'
  const dark = phase === 'night'
  return (
    <header className="absolute inset-x-0 top-0 z-[4] flex items-start justify-between gap-4 px-4 pt-4 sm:px-7 sm:pt-6" style={{ pointerEvents: 'none' }}>
      <button type="button" className="slip paper wordmark pointer-events-auto" data-hidden={atHome} tabIndex={atHome ? -1 : 0} aria-hidden={atHome} onClick={onHome}>
        {OWNER.name}
      </button>
      <div className="flex flex-wrap items-start justify-end gap-2.5">
        {/* Switches written as two words, with the true one underlined */}
        <button type="button" role="switch" aria-checked={dark} aria-label="Night" className="slip paper weather pointer-events-auto" onClick={() => onPhase(dark ? 'day' : 'night')}>
          <span className="weather-word" data-on={!dark}>
            day
          </span>
          <span className="weather-sep" aria-hidden="true">
            /
          </span>
          <span className="weather-word" data-on={dark}>
            night
          </span>
        </button>
        <button type="button" role="switch" aria-checked={raining} aria-label="Rain" className="slip paper weather pointer-events-auto" onClick={() => onWeather(raining ? 'sun' : 'rain')}>
          <span className="weather-word" data-on={!raining}>
            sun
          </span>
          <span className="weather-sep" aria-hidden="true">
            /
          </span>
          <span className="weather-word" data-on={raining}>
            rain
          </span>
        </button>
      </div>
    </header>
  )
}

interface LandingProps {
  shown: boolean
  /** False while the world is still loading */
  ready: boolean
  onBoard: () => void
}

/** The title card over the sea, the name, the title and the way aboard */
export function Landing({ shown, ready, onBoard }: LandingProps) {
  return (
    <section className="landing" data-shown={shown} inert={!shown} aria-labelledby="owner-name">
      <h1 id="owner-name" className="landing-name">
        {OWNER.name}
      </h1>
      <p className="landing-title">{OWNER.title}</p>
      <button type="button" className="plaque" disabled={!ready} onClick={onBoard}>
        Board the Train
      </button>
    </section>
  )
}

interface TrailProps {
  place: PlaceId
  shown: boolean
  onVisit: (place: PlaceId) => void
}

/** The route map, the train and its four stops along one drawn line */
export function Trail({ place, shown, onVisit }: TrailProps) {
  return (
    <nav className="trail paper" data-shown={shown} inert={!shown} aria-label="Route map">
      <ul className="trail-list">
        {ROUTE.map((id) => (
          <li key={id}>
            <button type="button" className="trail-stop" aria-current={place === id ? 'true' : undefined} onClick={() => onVisit(id)}>
              <span className="trail-name">{PLACES[id].name}</span>
              <span className="trail-role trail-long">{PLACES[id].role}</span>
              <span className="trail-role trail-short">{PLACES[id].short}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** One thing that can be done in a scene, written out */
export interface Prompt {
  label: string
  note?: string
  /** Lit because the thing itself is under the pointer */
  hot?: boolean
  onPress: () => void
  /** Pointing at the words is pointing at the thing */
  onPoint?: (over: boolean) => void
}

interface PromptsProps {
  shown: boolean
  /** A line of introduction, such as one tin in the rack */
  title: string
  prompts: readonly Prompt[]
}

/** What a scene offers as words beside it, giving the keyboard the reach of a pointer */
export function Prompts({ shown, title, prompts }: PromptsProps) {
  return (
    <nav className="prompts paper" data-shown={shown} inert={!shown} aria-label="In this scene">
      <p className="prompts-title">{title}</p>
      <ul className="prompts-list">
        {prompts.map(({ label, note, hot, onPress, onPoint }) => (
          <li key={label}>
            <button type="button" className="prompt" data-hot={hot} onClick={onPress} onPointerEnter={() => onPoint?.(true)} onPointerLeave={() => onPoint?.(false)} onFocus={() => onPoint?.(true)} onBlur={() => onPoint?.(false)}>
              <span>{label}</span>
              {note && <span className="prompt-note">{note}</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** A line of guidance on a slip, for the first moment aboard */
export function Hint({ shown, children }: { shown: boolean; children: ReactNode }) {
  return (
    <p className="hint slip paper" data-shown={shown} aria-hidden={!shown}>
      {children}
    </p>
  )
}
