# Music Video Prompt Studio

Upload a song → the app splits it into 10-second blocks, analyzes each block's
energy and brightness right in your browser, and drafts image + video prompts
per block. Generate keyframes in-app via the free Pollinations image endpoint
(no key needed).

## Run it locally

```bash
npm install
npm run dev
# open http://localhost:3000/Create-videos
```

## How it works

- Audio analysis runs 100% in the browser (Web Audio API + Meyda): each
  10-second block gets an energy (RMS) and spectral-centroid reading plus a
  rough tempo estimate.
- Prompts are deterministic templates (image < 75 words, video < 50 words,
  describing only what is seen) — no LLM key required.
- Keyframes are generated client-side straight from the browser via the free
  Pollinations image endpoint. (The original scaffold used a server-side
  `/api` proxy; this build is fully static so the browser calls Pollinations
  directly — same result, no server needed.)

## Deploy

`npm run build` produces a static `out/` folder. That folder is published to
the `gh-pages` branch and served with GitHub Pages.
