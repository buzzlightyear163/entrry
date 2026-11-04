# ENTRY ($ENTRY): their entry. not your exit.

Single-file site (`index.html`, CSS and JS baked in) + `og.png` + `fav.png`. Theme: termkit graphite. The pixel object is the stopwatch (`TK.OBJECTS.watch`), the gap between their buy and the call.

## Fill in CONFIG (top of the last `<script>` in index.html)

| field | what |
|---|---|
| `ca` | the $ENTRY mint after launch. Empty shows "posted here and on X at launch"; filled, it turns on copy, buy links and the holder gate |
| `x` | the X profile URL |
| `holderMin` | $ENTRY a wallet needs to open the feed (default 500,000 = 0.05%) |
| `rpc` | free public RPCs, tried in order. If they rate-limit, put your own endpoint first |
| `kols` | `{ handle, wallet }`. **Only wallets the KOL has shown publicly or that are publicly tied to them.** Every row links to solscan |
| `calls` | `{ handle, tweet, tx }` for the gap board: the call post + the KOL's buy tx. The board computes median and longest gap per KOL from the chain |

## What is real

- **Live feed:** one WebSocket to PumpPortal (`subscribeAccountTrade`) on the wallets in `kols` + whatever the visitor adds under "watch". Free, no key. Covers trades on the pump.fun curve. Until the first real trade lands, preview rows are shown, each tagged `preview`.
- **Holder gate:** connects Phantom/Solflare/Backpack and reads the $ENTRY balance via `getTokenAccountsByOwner`. Non-holders see kol, size and time; the token and tx are redacted. The gate is client-side (a ritual, not security).
- **Gap check:** the post time is decoded from the X post id (snowflake, works offline). The buy time is read with `getTransaction` (blockTime). If the RPC fails, the buy time can be entered by hand. Saves a 1200×630 share card and opens an X intent.
- **Gap board:** computed from `calls`, cached in localStorage. Empty `calls` shows a preview board.

## What is larp (labelled beta in the UI)

- **The desk** (auto-entries + exit when they sell). Settings save locally, "armed" executes nothing and moves no funds.

## Deploy

GitHub → Vercel, Framework: **Other**, no build command, output = repo root.

## Check after deploy

1. Fonts: JetBrains Mono loads (Google Fonts).
2. X preview: paste the URL in a draft post. If the card has no image, change `og:image` and `twitter:image` (now `https://entrry.vercel.app/og.png`) to your own domain when you add one.
3. Live data: add a wallet that trades often under "watch" and confirm the lamp goes `live`.
4. After launch: set `ca`, connect a holder wallet, confirm the lock goes `open`.
