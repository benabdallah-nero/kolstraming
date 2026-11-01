# Infinite Scroll Channel Catalog, Subtle Multi-Screen & All-in-One Football Scores / Leagues Hub

Upgrade **kolstream** into an all-in-one live sports streaming and football data platform (inspired by Kooora, Yalla Shoot, and ESPN) while keeping the UI clean, natural, and free of self-promotional feature bragging.

---

### 1. Core Features & User Decisions

1. **Infinite Scroll ("Load More While Scrolling") + Sorting on Channel Catalog (`/home`)**:
   - Replace numbered page buttons on the Home Channel Catalog with an automatic **`IntersectionObserver` infinite scroll** that smoothly loads 12 more channels at a time as the user scrolls down (with a manual "تحميل المزيد" fallback button).
   - Restore clean **Channel Sorting** (`الافتراضي`, `يبث مباريات الآن أولاً`, `حسب رقم القناة`, `الترتيب الأبجدي`) alongside network category filters and search.
2. **Subtle Multi-Screen Inside Watch Room Only (`/watchroom/:channelId`)**:
   - Re-enable the 2-to-4 screen **Multi-Screen (شاشة متعددة)** grid inside `WatchRoomPage.tsx`, triggered strictly via a single, unobtrusive **"شاشة متعددة"** button in the Watch Room player controls bar.
   - Do **not** add Multi-Screen buttons or badges to channel cards, match cards, or the top navbar.
3. **Upgraded Matches & Live Scores Page (`/schedual`)**:
   - **Yesterday / Today / Tomorrow Date Tabs**: Switch seamlessly between **مباريات الأمس** (`yesterday`), **مباريات اليوم** (`today`), and **مباريات الغد** (`tomorrow`) with live scores, match minute, and broadcasting channels.
   - **Interactive Match Details Modal**: Clicking any match card opens a rich **Match Center Modal** with 3 tabs:
     - **أحداث المباراة (Events & Summary)**: Goals, yellow/red cards, substitutions, stadium, referee, and direct link to the broadcasting channel.
     - **التشكيلة (Lineups)**: Starting XI and formations for both teams.
     - **الإحصائيات والمواجهات (Stats & H2H)**: Possession, shots on target, corners, fouls, and recent head-to-head results.
4. **Dedicated Leagues & Standings Page (`/leagues`)**:
   - New dedicated page accessible from the top navbar (**البطولات والترتيب**).
   - Covers major Arab & European competitions:
     - **الدوري الإنجليزي الممتاز (Premier League)**
     - **الدوري الإسباني (La Liga)**
     - **الدوري الإيطالي (Serie A)**
     - **الدوري الألماني (Bundesliga)**
     - **دوري أبطال أوروبا (UEFA Champions League)**
     - **دوري روشن السعودي (Saudi Pro League)**
     - **الدوري المصري الممتاز (Egyptian Premier League)**
     - **البطولة المغربية الاحترافية (Botola Pro)**
   - Displays full **League Standings Table** (Rank, Team Logo & Name, Played, Won, Drawn, Lost, Goal Difference, Points, Recent Form) + upcoming/recent fixtures for that league.

---

### 2. Technical Architecture & Open-Source Football Data Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             KOLSTREAM PLATFORM                                  │
├──────────────────┬──────────────────┬───────────────────────┬───────────────────┤
│      /home       │    /schedual     │       /leagues        │ /watchroom/:id    │
│ • Featured Match │ • Yesterday /    │ • Arab & Euro Leagues │ • Clean HLS Video │
│ • Channel Sort   │   Today / Tmrw   │ • Live Standings      │ • Server 1–4      │
│ • Infinite Scroll│ • Match Details  │   Tables (Pts, GD,    │ • Subtle Multi-   │
│   (Auto-load)    │   Modal (Lineups,│   Form) & Fixtures    │   Screen Toggle   │
│                  │   Stats, Events) │                       │   in Player Bar   │
└──────────────────┴──────────────────┴───────────────────────┴───────────────────┘
```

- **Backend Open Football Feeds (`/api/index.ts` & `/worker.ts`)**:
  - `GET /api/live-matches?date=yesterday|today|tomorrow`: Aggregates live scores, fixtures, and results for the requested date from open football scoreboard endpoints (ESPN public scoreboard API + Kooora/Yalla-mapped Arabic tournament & team localization + broadcaster channel mapping).
  - `GET /api/match-details/:matchId`: Fetches real-time match summary, lineups, key events (goals/cards), and team statistics.
  - `GET /api/standings?league=epl|laliga|seriea|bundesliga|ucl|saudi|egypt|morocco`: Fetches live league standings tables with Arabic team names, logos, played, W/D/L, goals, and points.
- **Frontend Components & Pages**:
  - `/src/pages/HomePage.tsx`: Infinite scroll via `IntersectionObserver` + sorting dropdown (`live_first`, `id_asc`, `name_asc`, `default`).
  - `/src/pages/SchedulePage.tsx`: Date selector tabs (`الأمس` | `اليوم` | `الغد`), league filter, live score cards, and click-to-open `MatchDetailsModal`.
  - `/src/components/MatchDetailsModal.tsx`: Modal displaying match scoreboard, broadcast channel tune-in button, Events timeline, Lineups, and Match Stats.
  - `/src/pages/LeaguesPage.tsx`: League selector bar + full standings table (`جدول الترتيب`) with qualification zone indicators.
  - `/src/pages/WatchRoomPage.tsx`: Adds the subtle `شاشة متعددة` toggle button inside the player controls bar to switch into the 2–4 channel split screen when desired.
