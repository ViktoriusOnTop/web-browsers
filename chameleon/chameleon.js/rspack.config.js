// Bundles the TypeScript library (js/index.ts) into an ESM dist/chameleon.js and
// ships the emscripten engine artifacts (chameleon.mjs/.wasm/.data/.worker.js, built
// by build-lib.sh into wasm/) alongside it.
//
// chameleon.js (the emscripten glue) and chameleon.worker.js (the pthread worker) are
// INLINED into the bundle as source strings (imported with `?source` ->
// asset/source) and loaded from Blob URLs at runtime, so consumers never serve
// them. Only the two big binaries -- chameleon.wasm and chameleon.data -- ship next to the
// bundle as assets the consumer serves (see ChameleonOptions.assetBase).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rspack from '@rspack/core';

const here = path.dirname(fileURLToPath(import.meta.url));
const wasm = (f) => path.resolve(here, 'wasm', f);

export default {
  target: 'web',
  mode: 'production',
  entry: './js/index.ts',
  experiments: { outputModule: true },
  output: {
    path: path.resolve(here, 'dist'),
    filename: 'chameleon.js',
    library: { type: 'module' },
    module: true,
    clean: false,
  },
  resolve: { extensions: ['.ts', '.js', '.mjs'] },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'builtin:swc-loader',
          options: { jsc: { parser: { syntax: 'typescript' }, target: 'es2022' } },
        },
      },
      // `import x from './chameleon.js?source'` -> the file's text, inlined in the bundle.
      { resourceQuery: /source/, type: 'asset/source' },
      // `import uri from './chameleon.data.zst?inline'` -> base64 data: URI, inlined.
      // .zst has no entry in the mimetype DB, so set one explicitly (the value is
      // irrelevant -- the loader fetch()es the data: URI for its bytes).
      { resourceQuery: /inline/, type: 'asset/inline', generator: { dataUrl: { mimetype: 'application/octet-stream', encoding: 'base64' } } },
    ],
  },
  plugins: [
    new rspack.CopyRspackPlugin({
      patterns: [
        // chameleon.js + chameleon.worker.js (asset/source) and chameleon.data.zst (asset/inline,
        // zstd) + chameleon-assets.json (JSON import) are all INLINED into the bundle.
        // The only artifact the consumer serves is the wasm: raw chameleon.wasm in debug,
        // or chameleon.wasm.zst in RELEASE (still too big to inline; decoded by the loader).
        ...(process.env.CHAMELEON_RELEASE === '1'
          ? [{ from: wasm('chameleon.wasm.zst'), to: 'chameleon.wasm.zst', noErrorOnMissing: true }]
          : [{ from: wasm('chameleon.wasm'), to: 'chameleon.wasm', noErrorOnMissing: true }]),
      ],
    }),
  ],
  optimization: { minimize: false },
};
