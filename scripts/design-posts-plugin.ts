import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin } from 'vite'

// Development middleware only: private posts are never imported into a build.
export function privateDesignPosts(directory: string): Plugin {
  return {
    name: 'private-design-posts',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request,response,next) => {
        const path = request.url?.split('?')[0]
        if (path !== '/__design/posts' && !path?.startsWith('/__design/media/')) return next()
        if (request.method !== 'GET' && request.method !== 'HEAD') { response.statusCode=405;response.end();return }
        response.setHeader('Cache-Control','no-store')
        response.setHeader('X-Content-Type-Options','nosniff')
        const filename = path === '/__design/posts' ? 'posts.json' : path.slice('/__design/media/'.length)
        if (filename !== 'posts.json' && !/^[a-f0-9]{20}\.(jpg|png|webp|gif|mp4)$/.test(filename)) {
          response.statusCode=404;response.end();return
        }
        try {
          const file = join(directory,filename==='posts.json' ? filename : `media/${filename}`)
          const metadata = await stat(file)
          const types: Record<string,string> = { json:'application/json',jpg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',mp4:'video/mp4' }
          response.setHeader('Content-Type',types[filename.split('.').at(-1)!])
          const bytes=request.method==='HEAD' ? null : await readFile(file)
          const range=typeof request.headers.range==='string' ? request.headers.range.match(/^bytes=(\d*)-(\d*)$/) : null
          if (filename.endsWith('.mp4')) response.setHeader('Accept-Ranges','bytes')
          if (range) {
            const start=range[1] ? Number(range[1]) : Math.max(0,metadata.size-Number(range[2]))
            const end=range[1] && range[2] ? Math.min(Number(range[2]),metadata.size-1) : metadata.size-1
            if (start>end || start>=metadata.size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
              response.statusCode=416;response.setHeader('Content-Range',`bytes */${metadata.size}`);response.end();return
            }
            response.statusCode=206
            response.setHeader('Content-Range',`bytes ${start}-${end}/${metadata.size}`)
            response.setHeader('Content-Length',end-start+1)
            response.end(bytes?.subarray(start,end+1))
          } else {
            response.setHeader('Content-Length',metadata.size)
            response.end(bytes)
          }
        } catch {
          response.statusCode = filename==='posts.json' ? 204 : 404
          response.end()
        }
      })
    },
  }
}
