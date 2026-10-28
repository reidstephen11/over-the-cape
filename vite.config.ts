import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig, type Plugin } from 'vite';

/** GitHub Pages project path. Vite assets stay relative (`base: './'`); the PWA uses this. */
const PAGES_BASE = '/over-the-cape/';
const THEME_COLOR = '#54614B';
const BACKGROUND_COLOR = '#D8D0C0';

// Short commit and UTC build time, shown when hovering the version number
// so a tester can tell exactly which build GitHub Pages is serving.
function buildLabel(): string {
  let commit = process.env.GITHUB_SHA?.slice(0, 7);
  if (!commit) {
    try {
      commit = execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      commit = 'local';
    }
  }
  const time = new Date().toISOString().slice(0, 16).replace('T', ' ');
  return `${commit} · ${time} UTC`;
}

/** The plugin appends the manifest after Workbox transforms, so it misses the Pages prefix. */
function dropUnprefixedManifestEntry(): Plugin {
  return {
    name: 'pwa-drop-unprefixed-manifest',
    apply: 'build',
    closeBundle: {
      sequential: true,
      order: 'post',
      handler() {
        const swPath = resolve('dist/sw.js');
        if (!existsSync(swPath)) return;
        const source = readFileSync(swPath, 'utf8');
        const next = source.replace(/,\{url:"manifest\.webmanifest",revision:"[a-f0-9]+"\}/g, '');
        if (next !== source) writeFileSync(swPath, next);
      },
    },
  };
}

// Relative base so the build works under the GitHub Pages project URL
// (/over-the-cape/) and from any other static host or sub-folder.
export default defineConfig({
  base: './',
  define: { __BUILD_LABEL__: JSON.stringify(buildLabel()) },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // Register from main.ts so local preview / e2e (served at /) do not 404 /over-the-cape/sw.js.
      injectRegister: false,
      base: PAGES_BASE,
      scope: PAGES_BASE,
      // globPatterns already picks up public icons; extra includes were stored without the Pages prefix.
      includeManifestIcons: false,
      manifest: {
        id: PAGES_BASE,
        name: 'Over the Cape',
        short_name: 'Cape',
        description:
          'A single-player Cape York 4WD adventure, told in episodes from the Daintree to the Tip.',
        start_url: PAGES_BASE,
        scope: PAGES_BASE,
        display: 'standalone',
        lang: 'en',
        theme_color: THEME_COLOR,
        background_color: BACKGROUND_COLOR,
        icons: [
          {
            src: `${PAGES_BASE}pwa-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${PAGES_BASE}pwa-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${PAGES_BASE}pwa-512x512-maskable.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webmanifest}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: `${PAGES_BASE}index.html`,
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // Vite already hashes files under assets/; a Workbox query string can break large ones.
        dontCacheBustURLsMatching: /\/assets\//,
        // Vite's relative base would leave these as "index.html"; Android and navigateFallback need the Pages path.
        modifyURLPrefix: { '': PAGES_BASE },
        manifestTransforms: [
          async (entries) => ({
            manifest: entries.map((entry) => ({
              ...entry,
              url: entry.url.startsWith(PAGES_BASE)
                ? entry.url
                : `${PAGES_BASE}${entry.url.replace(/^\.?\//, '')}`,
            })),
          }),
        ],
      },
    }),
    dropUnprefixedManifestEntry(),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 4000,
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
