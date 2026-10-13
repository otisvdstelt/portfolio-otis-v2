import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

/** One seat in the train. The file is public/data/projects.json: one entry per bench, in order along the car. */
export interface Seat {
  id: string
  /** The repository on GitHub, as `owner/name`. Its figures are fetched live. */
  repo: string
  title: string
  /** A few words on what it is: "A tournament site". */
  kind: string
  /** In Otis's own words. Shown as it is; GitHub's description is used only when this is empty. */
  summary: string
  stack: string[]
}

async function fetchSeats(): Promise<Seat[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/projects.json`)
  if (!response.ok) throw new Error(`The passenger list did not arrive (${response.status}).`)
  return (await response.json()) as Seat[]
}

/** Who is riding. Ships with the site and does not change during a visit: fetched once and kept. */
export const seatsQuery = queryOptions({
  queryKey: ['seats'],
  queryFn: fetchSeats,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
})

/** Suspends until the passenger list is in; the sprout in the corner grows meanwhile. */
export const useSeats = () => useSuspenseQuery(seatsQuery)

/** What GitHub knows about one repository, reduced to what the parchment shows. */
export interface Repository {
  fullName: string
  description: string | null
  /** The repository's page, and the live site if one is set. */
  url: string
  homepage: string | null
  stars: number
  forks: number
  openIssues: number
  /** ISO dates. */
  createdAt: string
  pushedAt: string
  /** Share of the code in each language, largest first, as fractions of 1. */
  languages: { name: string; share: number }[]
  licence: string | null
}

/** GitHub answered, but not with the repository: it has moved, or the hourly allowance for anonymous questions is spent. */
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

/**
 * One repository's figures, straight from GitHub. Asked for only when its
 * seat is chosen, then kept for half an hour, so walking back and forth along
 * the car costs nothing. A refusal is not retried: asking again only spends
 * more of the allowance.
 */
export const repositoryQuery = (repo: string) =>
  queryOptions({
    queryKey: ['repository', repo],
    queryFn: ({ signal }) => fetchRepository(repo, signal),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: (failures, error) => !(error instanceof Refused) && failures < 1,
  })

export const useRepository = (repo: string | undefined) => useQuery({ ...repositoryQuery(repo ?? ''), enabled: Boolean(repo) })

/** Everything written inside one project's book, as plain words: the scene sets them on its pages, the page reads them out. */
export interface Leaves {
  /** "Volume II" */
  volume: string
  title: string
  kind: string
  summary: string
  stack: string
  /** What GitHub says about the repository: its figures, or a line saying why there are none (yet). */
  figures: { languages: readonly { name: string; share: number }[]; rows: readonly (readonly [label: string, value: string])[] } | { waiting: true } | { trouble: string }
  /** Where it runs, if anywhere, and where its source is. */
  live: string | null
  source: string
}

export const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI']
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
/** A date as it would be written by hand: 12 October 2026. */
export const written = (iso: string) => day.format(new Date(iso))

/**
 * The words for one book, with GitHub's figures as they stand: asked for
 * when the book is chosen, and kept by the query cache after that.
 */
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
      volume: `Volume ${NUMERALS[index] ?? index + 1}`,
      title: seat.title,
      kind: seat.kind,
      summary: seat.summary || data?.description || 'No description has been written for this one yet.',
      stack: seat.stack.join(', '),
      figures,
      live: data?.homepage ?? null,
      source: data?.url ?? `https://github.com/${seat.repo}`,
    }
  }, [seat, index, data, error])
  return { leaves, ask: () => void refetch() }
}
