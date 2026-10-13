// Everything the site says about its owner lives here, so it can be edited
// without touching the valley. Projects are the exception: they are fetched
// from public/data/projects.json.
import { PAINT } from '../lib/world/palette'

export const OWNER = {
  name: 'Otis van der Stelt',
  title: 'Creative software developer',
  motto: 'Break things, learn from them, build better.',
  /** Letters from the postbox are addressed here. */
  email: 'otisstelt@outlook.com',
}

/** The journal in the greenhouse. Drafted from Otis's GitHub profile and previous portfolio. */
export const JOURNAL = {
  about: [
    'I am a creative software developer from the Netherlands, in my third year at Grafisch Lyceum Rotterdam.',
    'Web development is where I feel at home. What I am after are websites that are visually stunning and engaging, and still easy to maintain and friendly to use.',
  ],
  education: {
    school: 'Grafisch Lyceum Rotterdam',
    line: 'Software development, third year.',
  },
  /** The trail so far, oldest first. */
  history: [
    { year: '2024', text: 'Put my first repositories on GitHub.' },
    { year: '2025', text: 'Built Salon San, a website for a real salon.' },
    { year: '2026', text: 'Overwatch League, a tournament site in Next.js, TypeScript and MongoDB.' },
    { year: '2026', text: 'Three Pokédexes in a row, each braver than the last. The third, Rotom Dex, is a talking 3D character.' },
    { year: 'Now', text: 'This valley.' },
  ],
  philosophy: [
    'I learn the most from the things that go wrong. So I try the hard version first, see where it breaks, and build the next one on what that taught me.',
  ],
  away: 'I love animals. Away from the screen I cook, work out, play video games, and try to learn something new every day.',
}

/** One windmill per kind of work, west to east across the meadow. */
export const SKILLS = [
  { name: 'Languages', accent: PAINT.terracotta, skills: ['JavaScript', 'TypeScript', 'PHP', 'HTML', 'CSS'] },
  { name: 'Frontend', accent: PAINT.cornflower, skills: ['React', 'Next.js', 'Tailwind CSS', 'SCSS', 'Bootstrap'] },
  { name: '3D and motion', accent: PAINT.gold, skills: ['Three.js', 'React Three Fiber', 'Blender'] },
  { name: 'Backend', accent: PAINT.clover, skills: ['Node.js', 'Express.js', 'MongoDB', 'MySQL', 'SQLite'] },
  { name: 'Tools', accent: PAINT.terracottaLight, skills: ['Git and GitHub', 'VS Code', 'Figma', 'Vite', 'Vercel'] },
] as const

/**
 * The wooden charms under the postbox, left to right.
 * TODO(otis): the LinkedIn charm points at LinkedIn's front page until the real profile URL is filled in.
 */
export const CHARMS = [
  { label: 'GitHub', href: 'https://github.com/otisvdstelt' },
  { label: 'Instagram', href: 'https://www.instagram.com/otis_stelt/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'Old site', href: 'https://otisvanderstelt.vercel.app/' },
] as const
