import type { Post, Profile } from './model'

export const sampleProfile: Profile = {
  summary: 'Small tools, playful interfaces and things that make you want to build something. Leave a little room for excellent nonsense.',
  interests: ['Creative coding', 'Useful little packages', 'Tactile interfaces', 'Photography', 'Good explanations', 'Excellent nonsense'],
  avoid: ['Engagement bait', 'Repeated announcements', 'Vague productivity advice'],
}

const items = [
  ['A tiny spring with a big personality', 'A little animation playground: change the mass, stiffness and damping and see how a spring behaves. Useful for making a button feel just right.', 'https://motion.dev/docs/animate', 'inspiring'],
  ['A camera made of sunshine', 'Cyanotypes turn leaves, paper and sunlight into blue prints. An afternoon project that gets better when you stop checking your phone.', 'https://en.wikipedia.org/wiki/Cyanotype', 'inspiring'],
  ['An entire database in your browser', 'PGlite runs Postgres in WebAssembly. A small ingredient for offline tools and experiments that need a proper database.', 'https://github.com/electric-sql/pglite', 'useful'],
  ['Your inbox is a personality test', 'A fictional status update: I have labelled all my cables. I am now the kind of person who has a favourite label.', 'https://www.wikipedia.org/', 'fun'],
  ['Make a tiny world', 'A beginner-friendly creative coding library for drawing, animation and interactive experiments. Start with ten lines and see where they take you.', 'https://p5js.org/', 'inspiring'],
  ['A package for those impossible dates', 'Temporal brings clear date, time and timezone types to JavaScript. This polyfill is a useful place to try them before your next scheduling bug.', 'https://github.com/js-temporal/temporal-polyfill', 'useful'],
  ['Ten habits of very productive people', 'A fictional generic productivity list: wake up earlier, schedule every minute, buy another notebook and never sit still.', 'https://www.wikipedia.org/', 'useful'],
  ['Another database announcement', 'PGlite again: browser Postgres, WebAssembly and local-first tools. The same idea surfaced from a second account.', 'https://github.com/electric-sql/pglite', 'useful'],
  ['A little planet you can drag', 'An open-source 3D library makes it possible to build a small orbiting planet or a rotating piece of furniture in a web page.', 'https://threejs.org/', 'inspiring'],
  ['Numbers, but you can see them', 'Interactive explanations that turn an abstract idea into something you can play with. A good reference for explaining your next technical project.', 'https://ciechanow.ski/', 'inspiring'],
  ['The discourse is happening again', 'Fictional engagement bait: everything is over, everyone is wrong, quote this post to explain why.', 'https://www.wikipedia.org/', 'fun'],
  ['Go for a very small walk', 'An experiment: take the same photograph every day for a week. Light changes, familiar things become unfamiliar, and you notice your own street again.', 'https://en.wikipedia.org/wiki/Photowalking', 'inspiring'],
] as const

export const samplePosts: Post[] = items.map(([title, text, url], index) => ({
  id: `sample-${index + 1}`, platform: index % 3 === 1 ? 'instagram' : 'x',
  author: ['Little Workshop', 'Sunday Studio', 'Useful Things', 'Mild Nonsense'][index % 4],
  handle: ['littleworkshop', 'sundaystudio', 'usefulthings', 'mildnonsense'][index % 4],
  text: `${title}\n\n${text}`, url, images: [],
}))

export const sampleLikes = [samplePosts[0], samplePosts[1], samplePosts[2], samplePosts[3], samplePosts[4], samplePosts[9]]
