import type { Options } from 'tsup'
import { defineConfig } from 'tsup'

export default defineConfig(options => {
  const commonOptions: Options = {
    tsconfig: './tsconfig.build.json',
    clean: true,
    entry: {
      'reselect-tools': 'src/index.ts'
    },
    sourcemap: true,
    ...options
  }
  return [
    // Modern ESM
    {
      ...commonOptions,
      format: ['esm'],
      outExtension: () => ({ js: '.mjs' }),
      dts: true
    },
    // Support Webpack 4 by pointing `"module"` to a file with a `.js` extension
    // and optional chaining compiled away
    {
      ...commonOptions,
      entry: {
        'reselect-tools.legacy-esm': 'src/index.ts'
      },
      format: ['esm'],
      outExtension: () => ({ js: '.js' }),
      target: 'es2017'
    },
    // CommonJS
    {
      ...commonOptions,
      entry: ['src/index.ts'],
      format: ['cjs'],
      outDir: './dist/cjs/',
      outExtension: () => ({ js: `.cjs` })
    },
    {
      ...commonOptions,
      format: ['cjs'],
      dts: { only: true, entry: ['src/index.ts'] }
    }
  ]
})
