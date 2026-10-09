import { build } from 'vite'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
await build({ configFile:false, build:{outDir:'.test-dist',lib:{entry:resolve('tests/local-provider.test.ts'),formats:['es'],fileName:()=> 'local-provider.test.mjs'},rollupOptions:{external:['node:test','node:assert/strict']}} })
execFileSync(process.execPath,['--test',resolve('.test-dist/local-provider.test.mjs')],{stdio:'inherit'})
