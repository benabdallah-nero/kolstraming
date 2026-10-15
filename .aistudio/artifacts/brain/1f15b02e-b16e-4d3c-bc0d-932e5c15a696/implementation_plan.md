# Real-Time EPG Broadcast Guide, Video Quality Downgrade, Website Essentials & SEO

Transform the sports streaming portal into a complete, website-grade production platform featuring real-time "Currently Broadcasting" guides on channel cards (inspired by official broadcast schedules like beIN Sports MENA), manual resolution picker (1080p, 720p, 480p, 360p, Auto) to eliminate buffering, complete SEO metadata (OpenGraph, Twitter Cards, Schema.org JSON-LD), standard website policies (Privacy, Terms, DMCA), and a wide desktop layout with cinema theater mode.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your revision feedback, the blueprint incorporates:
> 1. **Live Broadcast EPG Guide on Channel Cards**: Pulling live on-air program information (matching channels to official schedules like beIN Sports MENA schedule `beinsports.com/ar-mena/جدول-البث` and verified match fixtures) so each channel card displays the exact program, match, or studio currently broadcasting.
> 2. **Manual Video Quality Downgrade**: 1080p FHD, 720p HD, 480p SD, 360p Low-Data, and Auto adaptive bitrate in the player to prevent buffering on weak connections.
> 3. **Website Essentials & Legal Policies**: Dedicated routes and modal pages for Privacy Policy (`/privacy`), Terms of Service (`/terms`), and DMCA / Copyright Disclaimer (`/dmca`).
> 4. **Comprehensive SEO & Structured Data**: Branded titles, meta descriptions, OpenGraph social cards, Twitter cards, and Schema.org JSON-LD (`BroadcastService` & `WebApplication`).
> 5. **Wide Desktop Cinema Experience**: Optimized 1440px canvas (`max-w-7xl`), cinema theater mode (`T` key), and desktop keyboard shortcuts.

---

### 1. Overview & Core Concept

- **What It Does**:
  - **Live "On Air Now" Program Catalog**: Upgrades the channel catalog (`دليل القنوات الرياضية`) so every channel card reveals what is broadcasting right now (e.g., "دوري أبطال أوروبا: ريال مدريد ضد مانشستر سيتي - مباشر" or "استوديو الدوري الإنجليزي الممتاز" or "حصاد الأسبوع") with match minute or start/end broadcast time.
  - **Player Resolution & Anti-Lag Engine**: Gives users a resolution picker to manually throttle video bandwidth (1080p, 720p, 480p, 360p, Auto) with low-latency buffering modes.
  - **Full Website Architecture**: Includes comprehensive SEO tags in `index.html`, rich Schema.org metadata, footer navigation, and standard legal policies (Privacy Policy, Terms of Service, DMCA Disclaimer).
  - **Wide Desktop Theater Mode**: Cinema mode on desktop viewports with dimmed surround lighting, wide 16:9 viewport, and keyboard shortcuts (`F` for fullscreen, `T` for theater mode, `R` for reload, `M` for mute).
- **Target Audience**: Sports fans streaming on desktops, laptops, tablets, and mobile devices across different connection speeds.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Channel Browsing with Live Program Context*: User visits `/home` and instantly sees what is airing on each channel (beIN 1, SSC 1, Alkass, Eurosport) with live match score/minute or program title. A "المنقول عليها الآن" (Live On Air Now) filter chip isolates channels currently broadcasting live events.
  2. *Quality Downgrade for Unstable Connections*: Inside `/watchroom/:channelId`, user clicks the Quality menu (`⚙️ 1080p`), picks `720p` or `480p`, and playback adapts smoothly without buffering.
  3. *Wide Desktop Cinema Theater Mode*: User toggles "وضع المسرح" or presses `T` to expand the player to the full container width with an adjacent channel and fixtures rail.
  4. *Website Transparency & Policies*: Site footer provides accessible links to Privacy Policy (`/privacy`), Terms (`/terms`), and DMCA Disclaimer (`/dmca`), opening in clean reader modals or dedicated views.
- **Visual Identity & Theme**:
  - *Color Discipline*: 60% deep obsidian canvas (`#08090a`), 30% structural card surfaces (`#111317`), 10% purposeful emerald accent (`#10b981`) and live match timer rose (`#f43f5e`).
  - *Zero-Pill Discipline*: Unboxed metadata with typographic separators (`·`, `/`); clean segmented buttons for interactive filter bars.
  - *SEO & Social Cards*: Clean, high-contrast OpenGraph card with preview imagery and localized Arabic/English descriptions.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Channel-to-Broadcast EPG Data Pipeline**
  - *Chosen Approach*: Implement an EPG broadcast indexer in the API (`/api/epg/live`) combining real-time match broadcaster mappings (beIN 1-9, SSC 1-5, Alkass 1-4) with program title schedules.
  - *Why*: Delivers exact "Currently On Air" information directly onto channel cards without user guesswork.
- **Decision 2: In-Player Quality Selector Architecture**
  - *Chosen Approach*: Support resolution selection across both player engines:
    - *Native HLS Mode*: Dynamically inspect `hls.levels` and assign `hls.currentLevel` to switch stream bitrates/resolutions instantaneously.
    - *Clean-Embed Mode*: Pass quality query parameters and low-bandwidth proxy buffer configs.
  - *Why*: Solves internet buffering for mobile and high-latency broadband users.
- **Decision 3: Complete Website Polish (SEO & Policies)**
  - *Chosen Approach*: Add full OpenGraph tags, Twitter summary card, Schema.org JSON-LD, and responsive footer with Privacy, Terms, and DMCA pages.
  - *Why*: Elevates the app from a simple widget to a legitimate, production-grade web platform.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KOLSTREAM WEB PLATFORM                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   Navbar (Wide Brandmark · Live Broadcast Counter · Search Shortcut)   │
│                                                                        │
├───────────────────────────────────┬────────────────────────────────────┤
│           /home                   │       /watchroom/:channelId        │
│   (Live Channel Catalog)          │     (Theater Viewport & Player)    │
│                                   │                                    │
│ ┌───────────────────────────────┐ │ ┌────────────────────────────────┐ │
│ │ Top Marquee Live Match Hero   │ │ │ Video Viewport (HLS / Clean)   │ │
│ ├───────────────────────────────┤ │ ├────────────────────────────────┤ │
│ │ Filters: All | beIN | SSC |   │ │ │ Quality Picker: 1080p - 360p   │ │
│ │ Alkass | Euro | Live Now      │ │ │ Theater Mode | Fullscreen | Rel│ │
│ ├───────────────────────────────┤ │ ├────────────────────────────────┤ │
│ │ Paginated Channel Grid:       │ │ │ Side Rail: Live Matches Feed   │ │
│ │ [Channel Card + Live Program] │ │ │ In-Room Paginated Switcher     │ │
│ └───────────────────────────────┘ │ └────────────────────────────────┘ │
├───────────────────────────────────┴────────────────────────────────────┤
│   Footer (Brand Links · Privacy Policy · Terms of Service · DMCA)      │
├────────────────────────────────────────────────────────────────────────┤
│             AppContext (Channels · Matches · EPG Broadcast Index)      │
│                                ▲                                       │
│          REST APIs: /api/channels · /api/live-matches · /api/epg/live  │
└────────────────────────────────────────────────────────────────────────┘
```

- **Interactive State & Handlers**:
  - `AppContext`: Fetches live match schedules and builds `broadcastMap: Record<number, LiveBroadcastInfo>` mapping each channel to its current on-air match or show.
  - `HomePage`: Each channel card checks `broadcastMap[channel.id]`. If active, displays live match teams, live score badge, tournament, and live minute.
  - `WatchRoomPage`:
    - Quality Selector: Modal/dropdown with options `[ Auto (تلقائي) | 1080p FHD | 720p HD | 480p SD | 360p منخفض ]`.
    - Cinema Theater Mode: Toggles wide viewport and dims background.
    - Keyboard Listeners: `f` (fullscreen), `t` (theater mode), `r` (reload), `m` (mute), `Space` (play/pause).
  - Legal Pages (`/privacy`, `/terms`, `/dmca`): Clean markdown-styled legal disclosures detailing disclaimer of non-hosting, DMCA compliance, and cookie/privacy notices.
  - `index.html`: OpenGraph tags, Twitter cards, meta descriptions, and Schema.org JSON-LD.
