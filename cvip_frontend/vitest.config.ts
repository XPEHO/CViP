import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        reporter: ['lcov', 'text'],
        include: ['src/**/*.{ts,vue}'],
        thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
        exclude: [
          ...(configDefaults.coverage?.exclude ?? []),
          'src/main.ts',
          'src/router/index.ts',
        ],
      },
    },
  }),
)
