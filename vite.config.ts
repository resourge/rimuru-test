/// <reference types="vitest" />

import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.ts'
	},
	plugins: [
		tsconfigPaths()
	]
})
