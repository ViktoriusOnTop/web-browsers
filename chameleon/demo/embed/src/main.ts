import { Chameleon } from 'chameleon.js';

declare const __CHAMELEON_WASM__: { url: string; compressed: boolean };

const canvas = document.getElementById('screen') as HTMLCanvasElement;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const params = new URLSearchParams(location.search);

//docs:base64-url not base64 (not that different @oslojs/encoding is pretty good for encoding
function decodeB64Url(value: string): string | null {
  if (!value) return null;
  let b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  try {
    const binary = atob(b64);
    return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  } catch (e) {
    console.warn('[demo] bad base64url:', e);
    return null;
  }
}

//docs:stuff like google.com autocorrects to https://google.com/ dont you worry little children
function normalize(input: string): string {
  const s = input.trim();
  if (!s) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s;
  return 'https://' + s;
}

//docs:url is a /web/then a base 64 encoded version of the URL
const urlMatch = /^\/web\/([^/]+)/.exec(location.pathname);
const target = normalize(urlMatch ? decodeB64Url(urlMatch[1]) || '' : '');

const encodedWisp = params.get('wisp');
const wispUrl = encodedWisp ? decodeB64Url(encodedWisp) || '' : ''; //docs:put the wisp under ?wisp=b64url of wisp. YES ITS NEEDED, you can test wisps and then pass it in

const env: Record<string, string> = {};
if (location.protocol === 'file:') env.CHAMELEON_SKIP_OPFS = '1';
const hostEnv = (window as unknown as { CHAMELEON_ENV?: Record<string, string> }).CHAMELEON_ENV;
if (hostEnv) Object.assign(env, hostEnv);
//docs:for debugging, ?env.<KEY>=<VALUE> edits envs for chameleon
for (const [k, v] of params) {
  if (!k.startsWith('env.')) continue;
  if (v === '') delete env[k.slice(4)];
  else env[k.slice(4)] = v;
}

const jit = (params.get('jit') || 'off').toLowerCase() === 'on'; //docs:?jit=on or off (off by default)
if (jit) delete env.CHAMELEON_NOWASMJIT;
else env.CHAMELEON_NOWASMJIT = '1';

const gpu = (params.get('gpu') || 'off').toLowerCase() !== 'off'; //docs:gpu on or off (errors by default, make your site test then load)
const gl = (params.get('gl') || 'on').toLowerCase(); //docs:webgl passthrough ?gl=off and no need for ?gl=on but you can do it ig (passthrough by defauly)
if (gpu) {
  env.CHAMELEON_GPU = '1';
  env.GECKO_WR_DIRECT = '1';
  env.CHAMELEON_APZ = '1';
  if (gl !== 'off') env.CHAMELEON_GL_PASSTHROUGH = '1';
}
if (gl === 'off') env.CHAMELEON_GL_PASSTHROUGH = '0';

const chameleon = new Chameleon({
  canvas,
  wasm: __CHAMELEON_WASM__,
  wispUrl: wispUrl.trim() || undefined,
  env,
  print: (s) => console.log('[chameleon]', s),
  printErr: (s) => console.warn('[chameleon]', s),
});

await chameleon.init();
console.log('[demo] engine ready');
Object.assign(window, { chameleon, __chameleonReady: true });

const welcome = `<!doctype html><meta charset="utf-8">
<body style="font-family:sans-serif;padding:2rem;line-height:1.5">
  <h1 style="color:#b5179e;margin-top:0">chameleon.js</h1>
  <p>Don't you dare use this basic template on your actual site</p>
</body>`;//docs:edit this with a HTML for a default site, and then make your home page point to /web/

const url = target || 'data:text/html,' + encodeURIComponent(welcome);
try {
  await chameleon.load(url);
  Object.assign(window, { __chameleonUrl: url, __chameleonError: null });
  console.log('[demo] page loaded', url);
} catch (e) {
  const message = String((e && (e as Error).message) || e);
  Object.assign(window, { __chameleonUrl: null, __chameleonError: message });
  console.warn('[demo] load failed', url, message);
}