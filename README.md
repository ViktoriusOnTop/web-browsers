<div align="center">

<br />

<img src="assets/logo.png" alt="web-browsers logo" width="160" />

# web-browsers

### An actual, real Firefox engine compiled to WebAssembly, browsing for you inside of a single tab!

<br />

![emscripten](https://img.shields.io/badge/emscripten-6.0.1-0F172A?style=for-the-badge)
![rust](https://img.shields.io/badge/rust-1.95-B7410E?style=for-the-badge&logo=rust&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-9.12-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![license](https://img.shields.io/badge/license-MPL--2.0-22C55E?style=for-the-badge)

![forks](https://img.shields.io/github/forks/ViktoriusOnTop/web-browsers?style=flat-square&color=3B82F6)
![issues](https://img.shields.io/github/issues/ViktoriusOnTop/web-browsers?style=flat-square&color=EF4444)
![last commit](https://img.shields.io/github/last-commit/ViktoriusOnTop/web-browsers?style=flat-square&color=8B5CF6)
![repo size](https://img.shields.io/github/repo-size/ViktoriusOnTop/web-browsers?style=flat-square&color=14B8A6)
![top language](https://img.shields.io/github/languages/top/ViktoriusOnTop/web-browsers?style=flat-square)

<br />

[What is this](#what-is-this) &nbsp;/&nbsp; [How it works](#how-it-works) &nbsp;/&nbsp; [Quick start](#quick-start) &nbsp;/&nbsp; [Using the demo](#using-the-demo)

<br />

</div>

---

## What is this?

Chameleon is a browser-based web proxy in the same family as Ultraviolet and Scramjet, but with different behavior.

Those proxies intercept a page and *rewrite* its URLs, scripts and requests so it behaves under a proxied origin. Chameleon doesn't rewrite anything. It compiles the Firefox engine (layout, styling, JavaScript, networking, media) to WebAssembly and runs it in your tab. Pages are fetched through a WISP websocket and rendered by a real engine into a `<canvas>` element, so site behaviour comes from Gecko itself instead of a rewriting layer.

You can open `/web/<base64url-encoded-url>` on the demo and the engine loads that site.

## How it works

1. chameleon.js boots the wasm engine on its own pthreads.
2. Necko, Firefox's network stack, opens sockets through a WasmFS backend.
3. The wisp server (wisp-js) relays the bytes to the real site.
4. The engine paints frames, and the library renders them to the `<canvas>`.

The trade versus something like Ultraviolet or Scramjet is weight for fidelity; heavier to load, but nothing needs patching per site.

---

## Quick start

> [!WARNING]
> This compiles Firefox from source. Expect about 45 minutes, a lot of RAM and CPU, and double digits of GB of disk (the engine object directory alone is ~26 GB).

```bash
./make-chameleon.sh     # builds the engine & chameleon.js, then offers to launch the demo
./run-chameleon.sh      # just starts the demo (pnpm demo)
```

### Prerequisites

| Tool | Version / notes |
| --- | --- |
| node | 22 recommended |
| pnpm | 9.12.0 |
| rustc + cargo | 1.95 with rust-src and the wasm32-unknown-emscripten target |
| python3 | 3.12 or older |
| emsdk | emscripten 6.0.1 |
| clang + libclang | libclang 21 |
| zstd, rsync, git, make | N/A |

> [!IMPORTANT]
> The checkout path must not contain spaces, make-chameleon.sh will not run otherwise.

---

## Using the demo

The demo (chameleon/demo/embed) is a Vite app that serves the engine with the required cross-origin isolation headers and runs a wisp proxy on the dev server at `/wisp/`.

Browse to any site by base64url-encoding its address into the path:

```
http://localhost:5173/web/<base64url-encoded-url>
```

Bare hosts such as `google.com` are normalised to `https://google.com`. With no `/web/` path, a small welcome page is loaded.

### Query parameters

| Parameter | Default | Effect |
| --- | --- | --- |
| `?wisp=<b64url>` | built-in `/wisp/` | Use a different wisp server (base64url encoded). |
| `?jit=on\|off` | `off` | Enable the wasm JIT. |
| `?gpu=on\|off` | `off` | Render through WebRender on WebGL2. |
| `?gl=on\|off` | `on` | WebGL passthrough (only relevant with `gpu=on`). |
| `?env.KEY=VALUE` | none | Set an engine environment variable. An empty value removes it. |

---

## License

Released under the Mozilla Public License 2.0. See [`chameleon/LICENSE`](chameleon/LICENSE).
