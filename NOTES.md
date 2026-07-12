# Project Notes — V Ventures Portfolio

> Working memory for Claude. Read this first instead of re-reading the codebase. Update after every change.

## What this is
Personal/agency portfolio for Victor (V Ventures Tech Solutions — web/app/graphic design, Delta State, Nigeria). Static site, no build step, no framework. Deployed from git (branch: main).

## Design (current direction — July 2026 redesign)
Dark navy + electric blue palette (user's stated preference). **User asked to remove the 3D Three.js background and go solid, clean, "real site" look — done 2026-07-12.** Background is now solid `--bg: #060b16`; cards are solid surfaces (`--surface: #0a1322`) instead of translucent glass; no backdrop-filter on cards (kept on topbar/mobile overlay). GSAP ScrollTrigger reveal animations, tilt cards, magnetic buttons all kept. Dark/light theme toggle via `localStorage` key `vv-theme` (default dark); light theme uses solid white cards.

## Files
- `index.html` — single-page portfolio. Sections in order: hero, marquee, services, cta-strip, why, process, about, work, testimonials, **pricing (new)**, faq, contact. Head has full SEO: meta description, theme-color, favicon (my logo.png), OG + Twitter tags, JSON-LD ProfessionalService. Loads GSAP + ScrollTrigger from CDN (Three.js REMOVED).
- `styles.css` — all main-site styles. CSS vars at top. Pricing styles after FAQ block; light-theme overrides near the end; responsive breakpoints 1024/760/420.
- `script.js` — scroll progress, nav active observer (ids incl. "pricing"), theme toggle, hamburger, magnetic/tilt/parallax, counters, GSAP reveals, preloader, project modal. Three.js init REMOVED.
- `chat.js` — live chat widget, Firebase Firestore (CDN ES modules v12.12.1). Rule-based bot `BOT_RULES` (greeting, price→points to Pricing section, deposit, e-commerce, location, fix/redesign, hosting, website, app, design, timeline, portfolio, contact, thanks). Quick-reply chips (`.qr-chip`) on start form fill `firstMsgIn` and call `sendFirst()`. Bot stops when admin replies (`hasAdminReplied`).
- `contact-form.js` — contact form → Firestore `contacts` collection. Separate Firebase app instance "vv-contact".
- `admin.html` / `admin.js` / `admin.css` — admin chat panel. Client-side password `vventures2026` in admin.js (cosmetic only — flagged to user). Images stored as base64 in Firestore.
- `my picture.jpg`, `my logo.png` — assets.

## Firebase
Project: `v-ventures-me-portfolio`. Config duplicated in chat.js, contact-form.js, admin.js. Collections: `chats` (+ `messages` subcollection), `contacts`.

## Conventions / decisions
- User does NOT want: scroll progress bar, custom styled scrollbar (both removed 2026-07-12). Default browser scrollbar only.
- Section backgrounds (2026-07-12): `.section` is full-bleed (`padding: 110px 5vw; margin: 0 -5vw`, 70px on mobile) with per-id color washes: services=blue, why=green, process=purple, about=gold, #work=highlight panel (white .016 + borders), pricing=blue, faq=violet, contact=green(bottom). cta-strip margin-top 0. "Work" renamed to "Projects" in nav/mobile/footer/label but the id stays `#work` (script observer + anchors depend on it).
- **Palette rule (2026-07-12): NO warm colors** (orange/gold/red accents removed site-wide). Cool palette only: blue #0ea5e9/#38bdf8, cyan #06b6d4/#22d3ee/#67e8f9 (CSS vars --cyan/--cyan-lt/--cyan-br replaced --orange/--orange-lt/--gold), mint green #10b981/#34d399, violet #8b5cf6/#a78bfa. Classes still named svc-orange/why-orange/ta-orange but styled cyan. Stars are mint. Browser-mock traffic-light dots (red/yellow/green) kept as browser chrome. admin.css still has gold (internal, untouched).
- Declutter pass (2026-07-12, user: "not crowded, simple, professional"): removed marquee strip (HTML+CSS+GSAP block), removed 2 of 3 hero chips (only "Available for Projects" remains). Hero now has real photo bg: `hero-bg.jpg` (local, 259KB, Unsplash earth-network photo) via `.hero::before` full-bleed with heavy dark overlay fading to solid --bg at bottom; light-theme override washes it near-white. User asked about VIDEO backgrounds: offered as desktop-only option, not implemented (data weight); revisit if asked.
- User taste: pill/badge labels are "too popular/generic". Current premium look (2026-07-12): `.bg-aurora` (two slow-drifting blurred color blobs, fixed, z -2) + `.bg-grain` (SVG feTurbulence noise overlay, opacity .05, z -1); eyebrow + section-label are minimal keyline style (thin gradient line + wide-tracked caps, NO pill background); hero `.grad` is blue→violet (gold removed).
- Plain ES modules from CDN, no bundler — keep it that way.
- Pricing cards show "Custom Quote" (no invented amounts — user hasn't given prices; CTAs are prefilled WhatsApp links per package). If user gives real prices, put them in `.price-tag`.
- User wants replies short, main point first; minimal token use.
- Update this file after every change (log below).

## Change log
- 2026-07-12: Created NOTES.md.
- 2026-07-12: **Site upgrade** (user picked all: visual, SEO, sections, chat):
  - Removed Three.js 3D background (canvas, script tag, initThree in script.js, CSS) + bg-grid + bg-vignette + portrait scan line. Solid background, solid cards, toned-down portrait glow.
  - SEO head: favicon, theme-color, OG/Twitter meta, JSON-LD, fetchpriority on hero image, lazy-load about photo.
  - New Pricing section (#pricing) with 3 packages + nav links (desktop, mobile, observer in script.js).
  - Chat: 6 new bot rules, quick-reply chips on start form.
- 2026-07-12: **Mobile style/arrangement fixes** (verified via headless-Chrome screenshots, desktop 1440 + mobile 390):
  - Hero buttons no longer wrap to 2 lines (smaller padding + nowrap ≤760px).
  - Stats stay 3-across compact on phones (removed 420px 1-column rule).
  - Chat toggle is icon-only on phones (label hidden ≤760px).
  - NovaPay project card: replaced mshots screenshot of chime.com (showed Cloudflare "you have been blocked") with a clean CSS mock (`.pb-mock` — name + subtitle over the gradient).
  - Screenshot method for future audits: playwright-core (in scratchpad) driving installed Chrome, `emulateMedia reducedMotion` needed or GSAP-hidden content shows blank; plain `--headless=new --screenshot` can't scroll/anchor reliably.
- 2026-07-12: **Work section overhaul** (user's new real products):
  - Removed demo/SOON cards (NovaPay, EduSpace) and the hero scroll-cue mouse icon (+ its CSS and pb-mock CSS).
  - Social Video Downloader card → **VVentures Toolbox** (https://vventuresaas.com) — 50+ browser tools SaaS, Next.js/Supabase/Paystack, ₦2,500/mo Pro.
  - Added **sms2go** (https://sms2go.vercel.app) — community platform: live chat, group calls, categories/discovery; free start, Pro via Paystack.
  - Grid is now 5 cards: THIRD EYE, Delivery Tracker, VVentures Toolbox, sms2go, More-on-request. Section h2 renamed to "Real products. Live now."
  - Card preview thumbnails use s.wordpress.com/mshots of the live URLs (auto-generate on first load).
- 2026-07-12: **No-dashes copy pass + 4 tool projects**:
  - User rule: NO dashes (— or –) in any user-facing text, site-wide. Replaced with commas/periods/colons; ranges use "3 to 7". Titles use "|". Only code comments still have dashes. **Apply this rule to all future copy.**
  - Added 4 VVentures Toolbox tool cards to Work grid: HTML Viewer, Social Media Video Downloader, Video to MP3, QR Code Generator (all vventuresaas.com/tools/*, mshots thumbnails, distinct gradients). Grid now 3×3 = 9 cards, verified via screenshot.
- 2026-07-12: **Live iframe previews in project modal** (script.js): live projects (except wa.me links) load the real site in a scaled iframe (1280px virtual width scaled to fit .pm-screen); wa.me keeps the old text badge; closeModal clears pmScreen (stops iframe). CSS `.pm-iframe`. Verified: Cargo Delivery Express renders live inside the modal. Caveat: if a project site ever sends X-Frame-Options/CSP deny, its modal will show a blank frame; fall back to text badge for that URL.
