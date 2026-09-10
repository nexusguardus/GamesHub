# Game Hub

Recovered clone of **https://littlexia.netlify.app/** — a single-page game collection (25 playable games, see below).

The original source code was lost, so this was reconstructed by downloading the deployed site. The app code lives in **one `index.html`** (HTML + CSS + JS inline, ~320 KB) — there is no build step. The only other files are the chess board/piece images under **`assets/`** (the chess board is drawn from `assets/board.png` and pieces from `assets/alpha/{color}{piece}.png`).

## Run it locally

Serve the folder as static files (any static server works):

```bash
npx serve .
```

Then open http://localhost:3000. You can also just double-click `index.html`, but serving is recommended.

## Deploy to Netlify again

1. Go to https://app.netlify.com/drop
2. Drag this folder in.

That's it — no config needed, since the site is a single static file.

## 🎮 Games included

Playable: **Chess, Connect Four, Snake, Minesweeper, GeoGuessr, 2048, Memory Match, Simon Says, Hangman, Mastermind, 15-Puzzle, Breakout, Flappy Bird, Rock Paper Scissors, Whack-a-Mole, Math Sprint, Reaction Time, Blackjack, Battleship, Dots & Boxes, Number Memory, Word Scramble, Trivia Quiz, Space Dodge, Lights Out** — 25 games in all. Tic-Tac-Toe / Pong / Sudoku are still marked *Coming Soon* (left as placeholders).

Nineteen of the games were added later, built to match the original glassmorphism design. They live entirely in `index.html` like everything else:

- Additive code: the original game code was not modified — the new games hook into the hub's card/Back buttons, so they can't break the originals.
- **Best scores** are stored per game in `localStorage` (keys prefixed `gh_mem_best_v1`, `gh_simon_best`, `gh_hg_best`, `gh_mm_best`, `gh_pz_best_v1`, `gh_bo_best`, `gh_fl_best`, `gh_rps_best`, `gh_whk_best`, `gh_mth_best`, `gh_rxn_best`, `gh_bj_best`, `gh_btl_best`, `gh_nm_best`, `gh_scr_best`, `gh_tri_best`, `gh_spc_best`, `gh_lit_best`).
- Canvas games (Breakout, Flappy, Space Dodge) work with mouse/touch/keyboard; puzzle and card games accept taps/clicks (Hangman, 15-Puzzle, Reaction Time, Math Sprint also accept the physical keyboard); Dots & Boxes plays vs a bot or 2-player.
- Small synthesized sound effects (WebAudio) with no external audio assets.

## ⚠️ Things to know about the recovered code

1. **Malware removed.** The live site had two injected scripts loading from `sorrowfulpsychology.com` (obfuscated paths, dynamically injected into `<head>` — a classic sign of a compromised static site). They were removed. Check your Netlify account / DNS / deploy pipeline for how they got in, and consider rotating your Netlify access token. If you still have the original repo, diff it against this file to see what else changed.
2. **AdSense is a placeholder.** All ad tags use `ca-pub-REPLACE_WITH_YOUR_ID` / `REPLACE_WITH_AD_SLOT` (search for `REPLACE_WITH`). They never worked — insert your real publisher ID and slot IDs if you want ads, or delete the `<div class="ad-container">` blocks and the AdSense script tag in `<head>`.
3. **Online multiplayer needs the original Supabase project.** The Chess "Online Room" mode talks to a Supabase project (`ayajuyhoztzujpuhbcxu.supabase.co`) whose URL and anon key are embedded in the file. The anon key is public by design, but:
    - If you still own that Supabase project, online rooms will work again once you redeploy (the app needs a `rooms`-style table/channel — the code at `// ========== ONLINE MULTIPLAYER (Supabase Realtime) ==========` shows what it expects). If rooms fail with auth errors, the key was likely rotated: copy the current **anon public** key from Supabase dashboard > Project Settings > API over the `SUPABASE_KEY` constant.
    - If you don't, create a new Supabase project and paste its URL/key over the `SUPABASE_URL` / `SUPABASE_KEY` constants, otherwise the button shows "Supabase not configured".
    - **Keep-alive:** Supabase pauses free projects after ~7 days idle. `.github/workflows/supabase-keepalive.yml` pings the project every 3 days (via `scripts/supabase-keepalive.mjs`, which reads the URL/key from `index.html`, overridable with `SUPABASE_URL` / `SUPABASE_ANON_KEY` repo secrets). Push this folder to GitHub for the schedule to run.
4. **GeoGuessr** uses the free Google Maps Street View embed + Leaflet/OpenStreetMap, so it works without API keys.
