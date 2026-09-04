import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {
    build: {
      target: "node24"
    }
  },
  preload: {},
  renderer: {}
})
