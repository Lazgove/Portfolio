import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-multi-html'

export default defineConfig({
  base: './',
  plugins: [
    createHtmlPlugin({
      pages: {
        index: 'index.html',
        about: 'about.html',
        contact: 'contact.html',
        projects: 'projects.html',
      }
    })
  ]
})
