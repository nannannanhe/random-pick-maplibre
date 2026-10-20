import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// DOM テストは行わないため environment は node のまま
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
      // lib/ のテストが揃うまではテストファイル 0 件でも成功扱いにする
      passWithNoTests: true,
    },
  }),
)
