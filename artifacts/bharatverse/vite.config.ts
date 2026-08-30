import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

/** Dev server needs an explicit PORT from the workflow env — fail fast if missing. */
function requiredPort(): number {
  const rawPort = process.env.PORT;
  if (!rawPort) {
    throw new Error(
      'PORT environment variable is required but was not provided.',
    );
  }
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
  return port;
}

export default defineConfig(async ({ command }) => {
  // `vite build` produces a static bundle: no server runs, so PORT is
  // irrelevant, and the deployment config (artifact.toml) serves it at "/".
  // Dev (`vite serve`) keeps the strict checks — those values come from the
  // workflow env and a silent fallback would hide a misconfigured workflow.
  const basePath =
    process.env.BASE_PATH ?? (command === 'build' ? '/' : undefined);
  if (!basePath) {
    throw new Error(
      'BASE_PATH environment variable is required but was not provided.',
    );
  }

  const devOnlyPlugins: PluginOption[] =
    command === 'serve' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          (await import('@replit/vite-plugin-cartographer')).cartographer({
            root: path.resolve(import.meta.dirname, '..'),
          }),
          (await import('@replit/vite-plugin-dev-banner')).devBanner(),
        ]
      : [];

  const port = command === 'serve' ? requiredPort() : undefined;

  return {
    base: basePath,
    plugins: [react(), tailwindcss(), runtimeErrorOverlay(), ...devOnlyPlugins],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
    },
    ...(port !== undefined
      ? {
          server: {
            port,
            strictPort: true,
            host: '0.0.0.0',
            allowedHosts: true,
            fs: {
              strict: true,
            },
          },
          preview: {
            port,
            host: '0.0.0.0',
            allowedHosts: true,
          },
        }
      : {}),
  };
});
