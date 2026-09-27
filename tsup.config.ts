import { defineConfig } from 'tsup';

/**
 * Bundled, not transpiled file-by-file.
 *
 * The source uses extensionless relative imports (`from './descriptions'`),
 * which is what `moduleResolution: bundler` allows and what every consumer in
 * the original monorepo happened to be. Emitting those one-to-one produces a
 * package that works inside a bundler and throws ERR_MODULE_NOT_FOUND under
 * Node's own ESM resolver, which is not a package -- it is a package-shaped
 * thing that happens to work in one place.
 *
 * Bundling removes the question: there are no internal specifiers left to
 * resolve, `src/who/lms.json` is inlined, and the output runs in Node, in
 * webpack, in Vite and on an edge runtime without configuration. It also
 * retires clixa-tools/scripts/bundle-worker.mjs, which exists solely to
 * esbuild around this same problem for Vercel.
 */
export default defineConfig({
  entry: { index: 'src/index.ts', 'who/zscore': 'src/who/zscore.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Nothing to keep external: the engine has no runtime dependencies.
  noExternal: [/.*/],
  target: 'es2022',
  platform: 'neutral',
});
