export const FOLDERS = [
  {
    id: 'eternal-entries',
    name: 'Eternal Entries',
    color: 'sage',
    type: 'coding',
    position: { x: 40, y: 50 },
    content: {
      title: 'Eternal Entries',
      subtitle: 'Coding Project — Full-Stack Web App',
      description:
        'A beautiful journaling web app where thoughts become timeless. Eternal Entries provides a calm, distraction-free writing space where users can capture daily reflections, track moods, and revisit memories.',
      features: [
        'Rich text editor with markdown support and auto-save',
        'Mood tracking with visual analytics and streak calendar',
        'Search and filter across all entries by date, mood, or keyword',
        'Customizable themes and font choices for a personal feel',
        'Responsive design that works beautifully on mobile',
      ],
      stats: [
        { label: 'Entries Written', value: '2,400+' },
        { label: 'Active Users', value: '180+' },
        { label: 'Uptime', value: '99.9%' },
      ],
      tags: ['React', 'Next.js', 'Tailwind CSS', 'Prisma', 'PostgreSQL', 'Vercel'],
      link: 'https://eternal-entries.vercel.app',
      linkLabel: 'Visit Eternal Entries',
      mockupUrl: 'eternal-entries.vercel.app',
    },
  },
  {
    id: 'twix-chat',
    name: 'Twix Chat',
    color: 'terra',
    type: 'coding',
    position: { x: 40, y: 160 },
    content: {
      title: 'Twix Chat',
      subtitle: 'Coding Project — Real-Time Messaging',
      description:
        'A tangent-friendly chat platform that embraces the way conversations actually flow. Threads branch naturally so side conversations get their own space without derailing the main topic.',
      features: [
        'Branching thread system — conversations fork like git repos',
        'Real-time messaging with typing indicators and read receipts',
        'Smart notifications that prioritize threads you care about',
        'Media sharing with drag-and-drop image/file uploads',
        'Thread summaries powered by AI for catching up fast',
      ],
      stats: [
        { label: 'Messages Sent', value: '12K+' },
        { label: 'Threads Created', value: '850+' },
        { label: 'Avg. Response', value: '<2s' },
      ],
      tags: ['React', 'Socket.io', 'Node.js', 'Express', 'MongoDB', 'Redis'],
      link: 'https://twix-chat.vercel.app',
      linkLabel: 'Visit Twix Chat',
      mockupUrl: 'twix-chat.vercel.app',
    },
  },
  {
    id: 'undercover-agents',
    name: 'Undercover Agents',
    color: 'warm',
    type: 'browser',
    position: { x: 40, y: 270 },
    content: {},
  },
  {
    id: 'photos',
    name: 'Photos',
    color: 'rose',
    type: 'gallery',
    position: { x: 140, y: 160 },
    content: {
      title: 'Photo Gallery',
      subtitle: 'Moments & Memories',
      photos: [
        { src: '/photos/1.jpg', label: 'Portrait' },
        { src: '/photos/2.jpg', label: 'City days' },
        { src: '/photos/3.jpg', label: 'The crew' },
        { src: '/photos/4.jpg', label: 'On stage' },
        { src: '/photos/5.jpg', label: 'Presenting' },
      ],
    },
  },
]

export const STICKY_NOTES = [
  {
    id: 'note-1',
    title: 'Did you know?',
    content: "There's a picture of me on the moon. No seriously, look it up.",
    color: 'yellow',
    style: { right: 30, top: 50, rotate: 3 },
    delay: 3.2,
  },
  {
    id: 'note-2',
    title: '15 years & counting',
    content: "I've been vegan for 15 years. Yes, I get enough protein.",
    color: 'pink',
    style: { right: 30, top: 210, rotate: -2 },
    delay: 3.4,
  },
  {
    id: 'note-3',
    title: 'Try this!',
    content: 'Click on Undercover Agents and see if you can solve some cool AI riddles.',
    color: 'green',
    style: { right: 210, top: 50, rotate: 1 },
    delay: 3.6,
  },
]
