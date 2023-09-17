import type { Options } from 'tsup'
import { defineConfig } from 'tsup'

export default defineConfig(options => {
  const commonOptions: Options = {
    entry: {
      'reselect-tools': 'src/index.ts'
    },
    sourcemap: true,
    ...options
  }
  return [
    {
      ...commonOptions,
      // target: 'esnext',
      format: ['esm'],
      outExtension: () => ({ js: '.mjs' }),
      // dts: { resolve: true },
      // dts: true,
      clean: true
    },
    {
      ...commonOptions,
      entry: {
        'reselect-tools.legacy-esm': 'src/index.ts'
      },
      format: ['esm'],
      outExtension: () => ({ js: '.js' }),
      target: 'es2017'
    },
    {
      ...commonOptions,
      entry: ['src/index.ts'],
      format: 'cjs',
      outDir: './dist/cjs/',
      outExtension: () => ({ js: '.cjs' })
    }
  ]
})
