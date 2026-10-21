import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

/** One project, as listed in public/data/projects.json, in order, with room for four */
export interface Seat {
  id: string
  /** The repository on GitHub, as owner then name. Its figures are fetched live */
  repo: string
  title: string
  /** A few words on what it is */
  kind: string
  /** Shown as it is. The GitHub description is used only when this is empty */
  summary: string
  stack: string[]
  /** A still for the screen, as a path under public. Left out, the screen says so */
  image?: string
}

async function fetchSeats(): Promise<Seat[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/projects.json`)
  if (!response.ok) throw new Error(`The passenger list did not arrive (${response.status}).`)
  return (await response.json()) as Seat[]
}

/** Who is riding. It ships with the site, so it is fetched once and kept */
export const seatsQuery = queryOptions({
  queryKey: ['seats'],
  queryFn: fetchSeats,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
})

/** Suspends until the passenger list is in, while the sprout grows */
export const useSeats = () => useSuspenseQuery(seatsQuery)

/** What GitHub knows about one repository, reduced to what the parchment shows */
export interface Repository {
  fullName: string
  description: string | null
  /** The page of the repository, and the live site if one is set */
  url: string
  homepage: string | null
  stars: number
  forks: number
  openIssues: number
  /** ISO dates */
  createdAt: string
  pushedAt: string
  /** Share of the code in each language, largest first, as fractions of 1 */
  languages: { name: string; share: number }[]
  licence: string | null
}

/** GitHub answered, but not with the repository. It moved, or the allowance is spent */
export class Refused extends Error {
  status: number
  constructor(status: number) {
    super(status === 404 ? 'GitHub has no repository under that name any more.' : 'GitHub is rationing its answers for the moment. Try again in a little while.')
    this.status = status
  }
}

async function ask<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/vnd.github+json' } })
  if (!response.ok) throw new Refused(response.status)
  return (await response.json()) as T
}

interface GitHubRepository {
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  created_at: string
  pushed_at: string
  license: { spdx_id: string | null } | null
}

async function fetchRepository(repo: string, signal: AbortSignal): Promise<Repository> {
  const [facts, bytes] = await Promise.all([ask<GitHubRepository>(`https://api.github.com/repos/${repo}`, signal), ask<Record<string, number>>(`https://api.github.com/repos/${repo}/languages`, signal)])
  const total = Object.values(bytes).reduce((sum, count) => sum + count, 0) || 1
  return {
    fullName: facts.full_name,
    description: facts.description,
    url: facts.html_url,
    homepage: facts.homepage || null,
    stars: facts.stargazers_count,
    forks: facts.forks_count,
    openIssues: facts.open_issues_count,
    createdAt: facts.created_at,
    pushedAt: facts.pushed_at,
    languages: Object.entries(bytes)
      .map(([name, count]) => ({ name, share: count / total }))
      .sort((a, b) => b.share - a.share),
    licence: facts.license?.spdx_id && facts.license.spdx_id !== 'NOASSERTION' ? facts.license.spdx_id : null,
  }
}

/** Figures from GitHub, asked for when a seat is chosen and then kept for half an hour */
export const repositoryQuery = (repo: string) =>
  queryOptions({
    queryKey: ['repository', repo],
    queryFn: ({ signal }) => fetchRepository(repo, signal),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: (failures, error) => !(error instanceof Refused) && failures < 1,
  })

export const useRepository = (repo: string | undefined) => useQuery({ ...repositoryQuery(repo ?? ''), enabled: Boolean(repo) })

/** Everything there is to say about one project, as plain words */
export interface Leaves {
  /** Such as Volume II */
  volume: string
  title: string
  kind: string
  summary: string
  stack: string
  /** The figures from GitHub, or a line saying why there are none */
  figures: { languages: readonly { name: string; share: number }[]; rows: readonly (readonly [label: string, value: string])[] } | { waiting: true } | { trouble: string }
  /** Where it runs, if anywhere, and where its source is */
  live: string | null
  source: string
  /** A still of it, as an address the page can load, or null */
  image: string | null
}

export const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI']
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
/** A date as it would be written by hand */
export const written = (iso: string) => day.format(new Date(iso))

/** The words for one book, with the GitHub figures as they stand */
export function useLeaves(seat: Seat | undefined, index: number | null): { leaves: Leaves | null; ask: () => void } {
  const { data, error, refetch } = useRepository(seat?.repo)
  const leaves = useMemo<Leaves | null>(() => {
    if (!seat || index === null) return null
    const figures: Leaves['figures'] = data
      ? {
          languages: data.languages,
          rows: [['Last worked on', written(data.pushedAt)], ['Started', written(data.createdAt)], ['Stars', String(data.stars)], ['Forks', String(data.forks)], ['Open issues', String(data.openIssues)], ...(data.licence ? [['Licence', data.licence] as const] : [])],
        }
      : error
        ? { trouble: error instanceof Refused ? error.message : 'GitHub could not be reached. Check your connection.' }
        : { waiting: true }
    return {
      volume: `Reel ${NUMERALS[index] ?? index + 1}`,
      title: seat.title,
      kind: seat.kind,
      summary: seat.summary || data?.description || 'No description has been written for this one yet.',
      stack: seat.stack.join(', '),
      figures,
      live: data?.homepage ?? null,
      source: data?.url ?? `https://github.com/${seat.repo}`,
      image: seat.image ? `${import.meta.env.BASE_URL}${seat.image}` : null,
    }
  }, [seat, index, data, error])
  return { leaves, ask: () => void refetch() }
}
