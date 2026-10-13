// Everything the site says about its owner lives here, so it can be edited
// without touching the world. Projects are the exception: which repositories
// ride in the train is listed in public/data/projects.json, and their figures
// are fetched from GitHub when a seat is chosen.
import { PAINT } from '../lib/world/palette'

export const OWNER = {
  name: 'Otis van der Stelt',
  title: 'Creative software developer',
  motto: 'Break things, learn from them, build better.',
  /** Letters from the postbox are addressed here. */
  email: 'otisstelt@outlook.com',
  github: 'https://github.com/otisvdstelt',
}

/** The guestbook on the bakery counter. Drafted from Otis's GitHub profile and previous portfolio. */
export const GUESTBOOK = {
  story: [
    'I am a creative software developer from the Netherlands, in my third year at Grafisch Lyceum Rotterdam.',
    'Web development is where I feel at home. What I am after are websites that are visually stunning and engaging, and still easy to maintain and friendly to use.',
  ],
  education: {
    school: 'Grafisch Lyceum Rotterdam',
    line: 'Software development, third year.',
  },
  /** The journey so far, oldest first. */
  journey: [
    { year: '2024', text: 'Put my first repositories on GitHub.' },
    { year: '2025', text: 'Built Salon San, a website for a real salon.' },
    { year: '2026', text: 'Overwatch League, a tournament site in Next.js, TypeScript and MongoDB.' },
    { year: '2026', text: 'Three Pokédexes in a row, each braver than the last. The third, Rotom Dex, is a talking 3D character.' },
    { year: 'Now', text: 'This railway across the sea.' },
  ],
  philosophy: ['I learn the most from the things that go wrong. So I try the hard version first, see where it breaks, and build the next one on what that taught me.'],
  away: 'I love animals. Away from the screen I cook, work out, play video games, and try to learn something new every day.',
}

/**
 * The five clusters of artefacts in the attic, one per kind of skill. The
 * order matches ATTIC.clusters in src/lib/world/spec.ts: potions, floating
 * solids, books, hanging brass, tools on the bench.
 */
export const SKILLS = [
  { name: 'Frontend Sorcery', accent: PAINT.rose, things: 'the potions on the long shelf', skills: ['React', 'Next.js', 'Tailwind CSS', 'SCSS', 'Bootstrap'] },
  { name: '3D Canvas Alchemy', accent: PAINT.teal, things: 'the solids turning over the drawing table', skills: ['Three.js', 'React Three Fiber', 'Blender'] },
  { name: 'Runes and Languages', accent: PAINT.honey, things: 'the grammar books by the bookcase', skills: ['JavaScript', 'TypeScript', 'PHP', 'HTML', 'CSS'] },
  { name: 'Data Infrastructure', accent: PAINT.gold, things: 'the brass wheels hung from the rafters', skills: ['Node.js', 'Express.js', 'MongoDB', 'MySQL', 'SQLite'] },
  { name: 'Workshop Tools', accent: PAINT.cornflower, things: 'what is laid out on the workbench', skills: ['Git and GitHub', 'VS Code', 'Figma', 'Vite', 'Vercel'] },
] as const

/**
 * The wooden tags under the postbox, left to right.
 * TODO(otis): the LinkedIn tag points at LinkedIn's front page until the real profile URL is filled in.
 */
export const CHARMS = [
  { label: 'GitHub', href: OWNER.github },
  { label: 'Instagram', href: 'https://www.instagram.com/otis_stelt/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'Old site', href: 'https://otisvanderstelt.vercel.app/' },
] as const
