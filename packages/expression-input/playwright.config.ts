import { defineConfig } from '@playwright/test'

export default defineConfig({
  //testIgnore: '*test-assets',
  testMatch: 'test/*_test.ts',
})