export interface SampleTweet {
  id: string
  name: string
  handle: string
  initials: string
  time: string
  text: string
  url?: string
  linkLabel?: string
  originalUrl?: string
  avatarUrl?: string
  photos?: { src: string; alt: string }[]
  video?: { src: string; poster?: string }
  media?: 'database' | 'spring' | 'light' | 'grid'
  quote?: { name: string; handle: string; text: string; originalUrl?: string }
  why: string
}

export const sampleTweets: SampleTweet[] = [
  {
    id: 'postgres', name: 'Little Workshop', handle: 'littleworkshop', initials: 'LW', time: '2h',
    text: 'Postgres, in your browser.\n\nA tiny database for the offline-first thing you keep meaning to build. This feels like a very good ingredient.',
    url: 'https://github.com/electric-sql/pglite', linkLabel: 'github.com/electric-sql/pglite', media: 'database',
    why: 'Small developer tools that make new projects possible.',
  },
  {
    id: 'spring', name: 'Soft Landing', handle: 'softlanding', initials: 'SL', time: '4h',
    text: 'Spent an unreasonable amount of time making a little spring feel nice.\n\nThe trick was less bounce. It is almost always less bounce.',
    url: 'https://motion.dev', linkLabel: 'motion.dev', media: 'spring',
    why: 'Playful interfaces, with an actual detail you can use.',
  },
  {
    id: 'cables', name: 'Mild Nonsense', handle: 'mildnonsense', initials: 'MN', time: '6h',
    text: 'Labelled all my cables today.\n\nUnfortunately I have become the sort of person who has a favourite label.',
    why: 'A small amount of excellent nonsense belongs in every edition.',
  },
  {
    id: 'sunlight', name: 'Sunday Studio', handle: 'sundaystudio', initials: 'SS', time: '8h',
    text: 'A camera made of sunshine.\n\nLeaves, paper, a little patience. Made these blue prints without looking at a single notification.',
    url: 'https://en.wikipedia.org/wiki/Cyanotype', linkLabel: 'A small introduction to cyanotypes ↗', media: 'light',
    why: 'Photography and little experiments that take you away from a screen.',
  },
  {
    id: 'tiny-tools', name: 'Useful Things', handle: 'usefulthings', initials: 'UT', time: '10h',
    text: 'My favourite kind of software: does one small thing, opens immediately, doesn’t ask me to create a workspace.',
    quote: { name: 'Little Workshop', handle: 'littleworkshop', text: 'Built a tool to line up the things in my other tools. It has one button. I think it is finished.' },
    why: 'Tools with a clear purpose and interfaces that get out of the way.',
  },
  {
    id: 'grid', name: 'Small Objects', handle: 'smallobjects', initials: 'SO', time: '12h',
    text: 'Four shapes. One colour.\n\nSometimes the whole afternoon is just moving the same circle a few pixels to the left.',
    media: 'grid',
    why: 'A little graphic inspiration, with room to make something of your own.',
  },
  {
    id: 'walk', name: 'Around the Corner', handle: 'aroundthecorner', initials: 'AC', time: '1d',
    text: 'An extremely low-budget photography project:\n\nTake the same picture on your street every day for a week. The light does most of the work. You just have to notice.',
    why: 'Photography, familiar places and an excuse for a very small walk.',
  },
  {
    id: 'end', name: 'Very Small Club', handle: 'verysmallclub', initials: 'VC', time: '1d',
    text: 'Made something small. Showed a friend. Closed the laptop.\n\nA surprisingly good release strategy.',
    why: 'A useful reminder that a small finished thing is enough.',
  },
]
