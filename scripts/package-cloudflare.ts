import { cp, mkdir, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { cleanBuildOutputDir, getWorkerBundleDir, readBuildOutput, writeAssets, writeRootConfig, writeWorkerConfig } from '@cloudflare/build-output-utils'
import config from '../cloudflare.config'

const root = process.cwd()
await cleanBuildOutputDir(root)
const bundle = getWorkerBundleDir(root)
await mkdir(bundle, { recursive: true })
const modules: Record<string, { type: 'esm' }> = {}
async function copyModules(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = join(directory, entry.name)
    if (entry.isDirectory()) await copyModules(source)
    else if (/\.m?js$/.test(entry.name)) {
      const name = relative('.output/server', source)
      const destination = join(bundle, name)
      await mkdir(join(destination, '..'), { recursive: true })
      await cp(source, destination)
      modules[name] = { type: 'esm' }
    }
  }
}
await copyModules('.output/server')
await writeRootConfig(root, { accountId: config.accountId }, { isPreview: false, mode: undefined })
await writeWorkerConfig({ root, config: config.worker, manifest: { type: 'complete', mainModule: 'index.mjs', modules } })
await writeAssets({ root, sourceDirectory: '.output/public' })
await readBuildOutput(root)
console.log(`Packaged ${Object.keys(modules).length} modules for cf deploy --prebuilt`)
