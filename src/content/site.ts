// Everything the site says about its owner lives here, so it can be edited
// without touching the world. Projects are the exception: which repositories
// stand on the library's ledge is listed in public/data/projects.json, and
// their figures are fetched from GitHub when a book is opened.

export const OWNER = {
  name: 'Otis van der Stelt',
  title: 'Creative software developer',
  motto: 'Break things, learn from them, build better.',
  /** Notes from the bus stop are addressed here. */
  email: 'otisstelt@outlook.com',
  github: 'https://github.com/otisvdstelt',
}

/** The sketchpad on the drafting table in the clocktower. Drafted from Otis's GitHub profile and previous portfolio. */
export const SKETCHPAD = {
  story: [
    'I am a creative software developer from the Netherlands, in my third year at Grafisch Lyceum Rotterdam.',
    'Web development is where I feel at home. What I am after are websites that are visually stunning and engaging, and still easy to maintain and friendly to use.',
  ],
  education: {
    school: 'Grafisch Lyceum Rotterdam',
    line: 'Software development, third year.',
  },
  /** The timeline, oldest first. */
  timeline: [
    { year: '2024', text: 'Put my first repositories on GitHub.' },
    { year: '2025', text: 'Built Salon San, a website for a real salon.' },
    { year: '2026', text: 'Overwatch League, a tournament site in Next.js, TypeScript and MongoDB.' },
    { year: '2026', text: 'Three Pokédexes in a row, each braver than the last. The third, Rotom Dex, is a talking 3D character.' },
    { year: 'Now', text: 'This railway across the sea, and the places it stops.' },
  ],
  philosophy: ['I learn the most from the things that go wrong. So I try the hard version first, see where it breaks, and build the next one on what that taught me.'],
  away: 'I love animals. Away from the screen I cook, work out, play video games, and try to learn something new every day.',
}

/**
 * The four plaques of the signpost, top to bottom, one per division of the
 * craft. Each points along its own line of the coast and has its own hour:
 * `sky` is the colour the sky leans toward while the plaque is chosen.
 */
export const DIVISIONS = [
  { name: 'Frontend', plaque: 'Frontend', sky: '#f29a8e', hour: 'toward first light', skills: ['React', 'Next.js', 'Tailwind CSS', 'SCSS', 'Bootstrap'] },
  { name: '3D and Motion', plaque: '3D and Motion', sky: '#7d6ad6', hour: 'toward twilight', skills: ['Three.js', 'React Three Fiber', 'Blender'] },
  { name: 'Backend and Data', plaque: 'Backend', sky: '#2f9a9c', hour: 'toward deep water', skills: ['Node.js', 'Express.js', 'PHP', 'MongoDB', 'MySQL', 'SQLite'] },
  { name: 'Languages and Tools', plaque: 'Languages', sky: '#f0b45c', hour: 'toward late afternoon', skills: ['TypeScript', 'JavaScript', 'HTML and CSS', 'Git and GitHub', 'Figma', 'Vite', 'Vercel'] },
] as const

/**
 * The planks nailed to the bus stop's pole, top to bottom.
 * TODO(otis): the LinkedIn plank points at LinkedIn's front page until the real profile URL is filled in.
 */
export const PLANKS = [
  { label: 'GitHub', href: OWNER.github },
  { label: 'Instagram', href: 'https://www.instagram.com/otis_stelt/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'Old site', href: 'https://otisvanderstelt.vercel.app/' },
] as const
