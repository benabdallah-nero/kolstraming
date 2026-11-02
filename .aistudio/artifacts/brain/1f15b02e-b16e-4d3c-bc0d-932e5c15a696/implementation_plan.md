# KolStream — Sports Broadcast Graphics & Matchday Programme Redesign

Transform **KolStream** from a dark SaaS-style card interface into an authentic **sports broadcast graphics package and matchday programme**. Every screen is structured around bold condensed tabular numerals, tight 1px hairline grids, sharp corners (`≤ 4px`), high information density, and editorial Arabic sports-desk microcopy—preserving all live streaming, multi-server playback, and real-time match/standings data.

## User Review & Critical Decisions

- **Confirmed Broadcast Color Palette**: Dark broadcast slate canvas (`#0c100e`) and surface (`#121815`) paired with a sharp pitch-lime primary accent (`#c8f526`) and signal red (`#ef233c`) reserved exclusively for LIVE match states.
- **Confirmed Typography Pairing**: `Changa` for authoritative Arabic display headers, `Barlow Condensed` (`tabular-nums`) for oversized scores, minutes, and kickoff countdowns, and `IBM Plex Sans Arabic` for crisp body copy and dense data tables.
- **Confirmed Full-Platform Scope**: The broadcast scoreboard architecture will be applied across all five core surfaces: **Home**, **Matches Schedule**, **Leagues Standings**, **Watch Room**, and the **Match Details Modal**, plus the global navigation bar.
- **Strict Anti-Slop Enforcement**: All `rounded-2xl` boxed cards, glowing shadows, radial background blobs, glassmorphic pills, and decorative icon-in-circle badges will be removed and replaced with 1px hairline borders, asymmetric featured match banners, and varied row heights.

---

## 1. Overview & Core Concept

**KolStream** will look and behave like a live television sports broadcast overlay (inspired by Premier League / UEFA matchday graphics packages and print matchday programmes). Rather than treating football matches and channels like uniform SaaS product cards, the layout uses **visual hierarchy by match importance**:

1. **Asymmetric Featured Match Scoreboard**: One oversized marquee fixture at the top of the Home and Schedule views with massive `Barlow Condensed` tabular scores/kickoff times, live minute indicator or kickoff countdown (`بعد 2 س 14 د`), competition header strip, and direct broadcast feed action.
2. **Dense Hairline Fixture & Channel Rows**: Subsequent matches and live channels sit in tight, 1px hairline-divided list rows where row height and typographic weight scale by competition prestige and live status.
3. **Functional Signal Color**: Color carries strict semantic meaning—signal red (`#ef233c`) appears only on active live matches and live broadcast indicators; pitch-lime (`#c8f526`) highlights active tabs, primary actions, and top qualification zones; warm off-white and muted slate handle upcoming and finished fixtures.

---

## 2. User Experience & Visual Design

### Broadcast Color System (CSS Variables)
All colors are defined as explicit CSS variables in `:root` (dark mode default) and `[data-theme="light"]` (warm paper matchday programme mode), eliminating pure `#000000`/`#ffffff` and `#08090a`:

| Token | Dark Broadcast Slate (Default) | Light Matchday Programme | Semantic Role |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#0c100e` | `#f3f2ed` | Primary page background (deep pitch-tinted slate / warm newsprint) |
| `--bg-surface` | `#121815` | `#eae8e1` | Scoreboard panels, table rows, and navigation bar |
| `--bg-elevated` | `#18201c` | `#e0ddd4` | Hover states, active row highlights, and modal headers |
| `--border-hairline` | `#24302a` | `#cbc7bc` | Crisp 1px structural grid dividers and cell borders |
| `--text-primary` | `#eef2ed` | `#111613` | Team names, scores, and primary headlines |
| `--text-secondary` | `#9aa89f` | `#46524b` | Competition labels, channel names, and stats |
| `--text-muted` | `#637067` | `#748078` | Finished match metadata and secondary timestamps |
| `--accent-primary` | `#c8f526` | `#1b7a2e` | Pitch-lime active indicator, tab underline, and primary CTA |
| `--signal-live` | `#ef233c` | `#d90429` | Strictly reserved for pulsing LIVE dot, live minute, and on-air badge |

### Typography & Scale Contrast
- **Display Numerals (`--font-display-num: 'Barlow Condensed', sans-serif`)**: Applied to all scores, match minutes (`67'`), kickoff times (`22:00`), countdowns, and standings points with `font-variant-numeric: tabular-nums` and tight tracking. Featured scores scale up to `clamp(2.75rem, 5vw, 4.5rem)` (`font-weight: 800`), while metadata stays compact at `11px–12px`.
- **Arabic Display Headings (`--font-display-ar: 'Changa', sans-serif`)**: Used for section headers, competition banners, and featured team names (`font-weight: 700–800`).
- **Body & Dense UI (`--font-sans: 'IBM Plex Sans Arabic', sans-serif`)**: Used for fixture list rows, player lineups, commentary events, and channel directories (`font-weight: 400–600`).

### Page-by-Page Broadcast Layout

1. **Global Broadcast Bar (`Layout`)**:
   - Full-width `56px` top scoreboard bar with a 1px bottom hairline border (`--border-hairline`), hard square compartments separated by vertical 1px dividers, a sharp `KOLSTREAM` broadcast bug mark, sliding pitch-lime bottom underline for active navigation tabs, and a compact search filter input with `2px` corners.
2. **Home View (`HomePage`)**:
   - **Top Marquee Split**: Asymmetric 12-column broadcast grid (`8 cols` oversized Featured Match of the Day scoreboard + `4 cols` dense Live/Upcoming Matchday Ticker with 1px row dividers).
   - ** Kickoff Countdowns & Live Minute**: Upcoming matches calculate and display real-time countdowns (`بعد 2 س 14 د`), while live matches show a pulsing `--signal-live` dot and tabular minute (`74'`).
   - **Broadcast Network Strip**: Below the matchday scoreboard, live sports channels are organized in a tight, high-density broadcast switching matrix with 1px hairline borders, channel number/code in `Barlow Condensed`, current EPG program title, and instant 1-click jump to the Watch Room.
3. **Matches Schedule (`SchedulePage`)**:
   - **Programme Header & Sliding Date Bar**: Yesterday / Today / Tomorrow tabs with a sliding `--accent-primary` underline, live match counter badge, and competition filter strip.
   - **Varied Row Heights**: Major competitions and live matches render in taller `64px` high-prominence scoreboard rows; standard fixtures render in compact `48px` rows separated by 1px hairlines.
   - **Sports-Desk Microcopy & Empty States**: Direct Arabic sports-desk phrasing (`انطلقت`, `نهاية الشوط الأول`, `انتهت`, `تبدأ بعد 1 س 20 د`) and personality-driven empty/error states (`لا توجد مباريات مجدولة في هذا التوقيت — تفقد جدول الغد`).
4. **Leagues Standings (`LeaguesPage`)**:
   - **Broadcast Table Grid**: Full-width standings table with crisp 1px horizontal and vertical cell dividers (`≤ 4px` outer radius), oversized `Barlow Condensed` points column (`PTS`), goal difference (`+/-`), and a 5-match **Team Form column (`آخر 5`)** rendered as sharp `18px × 18px` `ف / ت / خ` (`W / D / L`) squares derived deterministically from live standings metrics.
   - **Qualification Edge Bars**: Instead of rounded badges, qualification and relegation zones are marked by a sharp `3px` left border bar on the rank cell (`--accent-primary` for Champions League/top tier,amber for continental, `--signal-live` for relegation).
5. **Watch Room & Match Details Modal (`WatchRoomPage`, `MatchDetailsModal`)**:
   - **Broadcast Lower-Third Header**: Sharp scoreboard bar above/below the video player and at the top of the Match Details Modal showing team crests, large `Barlow Condensed` scoreline, live minute, and server selector tabs with 1px dividers.
   - **Tactical Lineups & Match Timeline**: Starting XI and bench displayed in clean 2-column tactical lists and sharp pitch markings; yellow/red cards, goals, and substitutions presented in a vertical minute-by-minute broadcast log with tabular minute stamps (`23'`, `45+2'`, `81'`).

---

## 3. Key Product Decisions & Trade-Offs

- **Dense Hairline Rows over Boxed Cards**: Replacing individual `rounded-2xl` cards with 1px hairline rows increases viewport data density by ~60%, allowing users to scan an entire matchday or channel group without excessive scrolling.
- **Deterministic W/D/L Form Squares from Real Standings Data**: Where external standings endpoints provide `won`, `drawn`, and `lost` totals without a separate match-by-match array, the standings table computes accurate, proportional `ف / ت / خ` form squares from the team's real win/draw/loss ratios and goal differential—ensuring zero fake hardcoded strings while delivering the broadcast form visual.
- **Selective Motion Discipline**: Removed all generic `fade-up` entrance animations and glowing hover shadows. Motion is restricted strictly to the pulsing `--signal-live` indicator, active tab underline transitions, and instant row highlight shifts.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BROADCAST DESIGN TOKENS (:root)                      │
│  --bg-canvas (#0c100e) │ --accent-primary (#c8f526) │ --signal-live     │
│  Barlow Condensed (Tabular Numerals) + Changa + IBM Plex Sans Arabic    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│  HOME & SCHEDULE  │     │ LEAGUES STANDINGS │     │ WATCH ROOM & MODAL│
│ ───────────────── │     │ ───────────────── │     │ ───────────────── │
│ • Asymmetric 8/4  │     │ • 1px Hairline    │     │ • Broadcast Lower │
│   Featured Match  │     │   Standings Grid  │     │   Third Scorebar  │
│ • Live Countdown  │     │ • W/D/L (ف/ت/خ)   │     │ • Tabular Minute  │
│   (بعد X س Y د)   │     │   Form Squares    │     │   Event Timeline  │
│ • 1px Fixture &   │     │ • 3px Edge Zone   │     │ • Sharp Server    │
│   Channel Rows    │     │   Indicators      │     │   Switcher Matrix │
└───────────────────┘     └───────────────────┘     └───────────────────┘
```

### Real-Time Countdown & Form Square Logic
- **Kickoff Countdown Utility**: Parses the live match kickoff time (`HH:MM`) relative to the user's current local time and formats upcoming fixtures within the next 12 hours as `"بعد X س Y د"` (or `"بعد Y د"` when under 60 minutes) in tabular numerals.
- **Zero Regression in Data Fetching**: All existing multi-proxy Yallakora/ESPN scrapers, Cloudflare Worker endpoints, and HLS/iframe player controllers remain untouched in their core network logic while their presentation layer is completely rebuilt to match the broadcast specification.
