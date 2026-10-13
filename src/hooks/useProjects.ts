import { queryOptions, useQuery } from '@tanstack/react-query'

/** One train car's worth of work. The file is public/data/projects.json; one entry per car, engine end first. */
export interface Project {
  id: string
  /** True while the entry is a stand-in for a project Otis has not written up yet. */
  placeholder?: boolean
  title: string
  /** A few words on what it is: "Tournament site", "Client website". */
  kind: string
  year: string
  role: string
  stack: string[]
  summary: string
  notes: string[]
  /** Code repository and live site; null when there is none to show. */
  repo: string | null
  live: string | null
}

async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/projects.json`)
  if (!response.ok) throw new Error(`The dockets did not arrive (${response.status}).`)
  return (await response.json()) as Project[]
}

/**
 * The dockets ship with the site and do not change during a visit: fetched
 * once, kept for the whole session, and shared by the ticket rack, the tags
 * over the train and the docket itself.
 */
export const projectsQuery = queryOptions({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
})

export const useProjects = () => useQuery(projectsQuery)
