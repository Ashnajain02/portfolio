import { BROWSER_PROJECTS, PHOTOS, PHOTOS_FOLDER, STICKY_NOTES } from './siteConfig'

export const FOLDERS = [
  ...BROWSER_PROJECTS.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    type: 'browser',
    position: p.position,
    content: {},
  })),
  {
    id: PHOTOS_FOLDER.id,
    name: PHOTOS_FOLDER.name,
    color: PHOTOS_FOLDER.color,
    type: 'gallery',
    position: PHOTOS_FOLDER.position,
    content: {
      title: 'Photo Gallery',
      subtitle: 'Moments & Memories',
      photos: PHOTOS,
    },
  },
]

export { STICKY_NOTES }
