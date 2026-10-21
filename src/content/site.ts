// Everything the site says about its owner, so it can be edited without the world
// Which repositories ride in the rack is listed in public/data/projects.json

export const OWNER = {
  name: 'Otis van der Stelt',
  title: 'Creative software developer',
  motto: 'Break things, learn from them, build better.',
  /** Cards from the mail car are addressed here */
  email: 'otisstelt@outlook.com',
  github: 'https://github.com/otisvdstelt',
}

/** What is shown wherever something has not been written yet */
export const SOON = 'Text soon to come'

/** The journal on the table in the compartment */
export const ABOUT = {
  story: [
    'I am a creative software developer from the Netherlands, in my third year at Grafisch Lyceum Rotterdam.',
    'Web development is where I feel at home. What I am after are websites that feel like its speaking a feeling into you so something like stunning and engaging. I really like making whats in my head a realitie',
  ],
  education: {
    school: 'Grafisch Lyceum Rotterdam',
    line: 'Software development, third year.',
  },
  /** The timeline, one card per year, oldest first. TODO(otis) write 2023 and 2027 */
  timeline: [
    { year: '2023', text: 'mmmm where you looking?' },
    { year: '2024', text: 'mmmm where you looking?' },
    { year: '2025', text: 'mmmm where you looking?' },
    { year: '2026', text: 'mmmm where you looking?' },
    { year: '2027', text: 'FUTURE!!!' },
  ],
  philosophy: ['I learn the most from the things that go wrong. So I try the hard version first, see where it breaks, and build the next one on what that taught me.'],
  away: 'I love animals. I also like to cook, work out (gym/kickboxing), play video games a lot, lay in bed watching series, draw and collect things im into like pokemon cards, manga, beyblades things like that.',
}

/** The four levers in the cab, left to right. An empty skills list makes the board say SOON */
export const DIVISIONS: readonly { name: string; skills: readonly string[] }[] = [
  { name: 'Technical skill', skills: ['TypeScript', 'JavaScript', 'REST APIs', 'Data fetching', 'Component architecture', '3D on the web'] },
  { name: 'Backend', skills: ['PHP', 'Node.js', 'Express.js', 'MongoDB', 'MySQL', 'SQLite'] },
  { name: 'Frontend', skills: ['React', 'Next.js', 'Tailwind CSS', 'SCSS', 'Bootstrap', 'Three.js and React Three Fiber', 'Responsive layouts'] },
  { name: 'Tools', skills: ['Git and GitHub', 'VS Code', 'WordPress and Divi 5', 'Canva', 'Blender', 'Vite', 'Vercel'] },
]


/** The four named pigeonholes in the mail car, left to right */
// TODO(otis) the LinkedIn link points at the front page until the real profile is known
export const LINKS = [
  { label: 'GitHub', href: OWNER.github },
  { label: 'Instagram', href: 'https://www.instagram.com/otis_stelt/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'Old site', href: 'https://otisvanderstelt.vercel.app/' },
] as const
