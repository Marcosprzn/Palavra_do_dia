# Palavra do Dia - WhatsApp Automator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir uma aplicação web completa (Node.js + Express + Socket.IO + Baileys + React/Tailwind) para envio diário automatizado e manual do "Versículo do Dia" com suporte a anexo de imagem, sincronização de contatos do WhatsApp, agendamento customizável (padrão 06:00 AM) e compatibilidade com Render.com e Supabase PostgreSQL / SQLite local.

**Architecture:** Monorepo simples com servidor Node.js/Express servindo a API REST, WebSocket (Socket.IO) para QR code/logs em tempo real, motor Baileys para conexão WhatsApp, camada de dados agnóstica (SQLite para desenvolvimento local rápido e PostgreSQL/Supabase para deploy no Render.com), agendador `node-cron` e frontend SPA moderno em React (Vite + Tailwind CSS + Lucide Icons) com build estático servido pelo backend em produção.

**Tech Stack:** Node.js, Express, Socket.IO, `@whiskeysockets/baileys`, `node-cron`, `multer`, `pg` / `better-sqlite3`, React 18, Vite, Tailwind CSS, `lucide-react`.

**Spec:** [docs/superpowers/specs/2026-10-11-palavra-do-dia-design.md](file:///c:/Users/Prozin/Desktop/Palavra%20do%20Dia/docs/superpowers/specs/2026-10-11-palavra-do-dia-design.md)

## Global Constraints

- Baileys WhatsApp integration using `@whiskeysockets/baileys` with QR code generation via Socket.IO.
- Default schedule time is 06:00 AM, customizable via dashboard and stored in the database.
- Verse generator pulls from a curated Brazilian Portuguese Bible collection, with automatic daily selection, random roll, and manual search.
- Image support: manual image attachment (JPG, PNG, WEBP) sent as WhatsApp image message with verse caption.
- Anti-ban delay: randomized 3-7s delay between messages sent to contacts.
- Production ready for Render.com (single web service running Express and serving Vite build) with Supabase (PostgreSQL `DATABASE_URL`) or SQLite fallback.

## Review Focus

- Baileys QR code generation and reconnection without crashing node server when disconnected or logged out.
- Image upload handling: verifying uploaded file existence and sending as WhatsApp media message with caption or pure text fallback.
- Database compatibility: switching smoothly between local SQLite and remote PostgreSQL (Supabase `DATABASE_URL`).
- Scheduler persistence: rescheduling cron immediately when user changes the time in the UI without restarting the server.
- Anti-ban safety: avoiding rapid-fire socket emissions to WhatsApp API by enforcing humanized intervals and graceful handling of blocked/invalid numbers.

---

### Task 1: Project Scaffolding, Environment & Dual Database Layer

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `server/config/database.js`
- Create: `tests/database.test.js`

**Interfaces:**
- Consumes: `process.env.DATABASE_URL` (optional)
- Produces: `getDb()`, `initDatabase()`, `getSettings()`, `updateSettings(key, value)`, `getRecipients()`, `saveRecipients(list)`, `logSend(entry)`, `getSendLogs(limit)`

- [ ] **Step 1: Write database test suite in `tests/database.test.js`**
Test initialization, default schedule setting (`06:00`), setting updates, recipients persistence, and send logs retrieval.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/database.test.js`
Expected: FAIL (modules missing)

- [ ] **Step 3: Implement dependencies and `server/config/database.js`**
Support SQLite via `better-sqlite3` when `DATABASE_URL` is absent, and PostgreSQL via `pg` when `DATABASE_URL` is provided. Create tables: `settings`, `recipients`, `send_logs`, `daily_verse_state`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/database.test.js`
Expected: PASS with database tables created and verified.

- [ ] **Step 5: Commit**
```bash
git add package.json .env.example server/config/database.js tests/database.test.js
git commit -m "feat: setup project scaffolding and dual database layer (SQLite/Supabase)"
```

---

### Task 2: Curated Bible Verse Engine & Service

**Files:**
- Create: `server/data/verses.json`
- Create: `server/services/verseService.js`
- Create: `tests/verseService.test.js`

**Interfaces:**
- Consumes: `getDb()` from `server/config/database.js`
- Produces: `getDailyVerse()`, `rollRandomVerse()`, `searchVerses(query)`, `setManualVerse(verseObj)`

- [ ] **Step 1: Write verse service test in `tests/verseService.test.js`**
Test getting daily verse, random roll, search by book/topic, and ensuring verse contains `{ text, reference, book, chapter, verse }`.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/verseService.test.js`
Expected: FAIL

- [ ] **Step 3: Create `server/data/verses.json` with curated Portuguese verses and implement `server/services/verseService.js`**
Add rich collection of verses (Salmos, Provérbios, Evangelhos, Romanos, Filipenses, etc.) with book, chapter, verse and inspirational text. Implement daily caching in `daily_verse_state` table so the verse remains constant throughout the day until rolled or changed.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/verseService.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/data/verses.json server/services/verseService.js tests/verseService.test.js
git commit -m "feat: add curated verses database and verse service"
```

---

### Task 3: WhatsApp Engine via Baileys & Session Management

**Files:**
- Create: `server/services/whatsappService.js`
- Create: `tests/whatsappService.test.js`

**Interfaces:**
- Consumes: Socket.IO server instance `io`
- Produces: `initWhatsApp(io)`, `getConnectionStatus()`, `logoutWhatsApp()`, `getContactsAndGroups()`, `sendMessage(jid, text, imagePath)`

- [ ] **Step 1: Write unit/mock test in `tests/whatsappService.test.js`**
Verify status state machine (`disconnected`, `connecting`, `qr_ready`, `connected`), phone number normalization, JID formatting (`@s.whatsapp.net` / `@g.us`), and message payload construction.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/whatsappService.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `server/services/whatsappService.js` using `@whiskeysockets/baileys`**
Initialize Baileys with `useMultiFileAuthState`, emit `qr` and `connection.update` to Socket.IO, handle reconnection on close, extract synced contacts and groups, and support sending text messages or media messages (`image: { url: imagePath }, caption: text`).

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/whatsappService.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/services/whatsappService.js tests/whatsappService.test.js
git commit -m "feat: implement Baileys WhatsApp engine with QR code and media messaging"
```

---

### Task 4: Scheduler & Dispatcher with Anti-Ban Protection

**Files:**
- Create: `server/services/schedulerService.js`
- Create: `tests/schedulerService.test.js`

**Interfaces:**
- Consumes: `whatsappService`, `verseService`, `database`
- Produces: `initScheduler(io)`, `updateScheduleTime(hour, minute)`, `triggerManualDispatch(options)`, `getSchedulerStatus()`

- [ ] **Step 1: Write scheduler test in `tests/schedulerService.test.js`**
Verify cron pattern generation from hour/minute (e.g. `06:00` -> `0 6 * * *`), queue execution with delay between items, and event emissions for progress.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/schedulerService.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `server/services/schedulerService.js`**
Implement dynamic `node-cron` task with hot-reloading when time changes. Implement `dispatchToRecipients()` queue that reads active recipients, gets current verse + optional attached image, iterates with 3-7s random sleep, updates live progress via Socket.IO, and logs each outcome to `send_logs`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/schedulerService.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/services/schedulerService.js tests/schedulerService.test.js
git commit -m "feat: implement scheduler with dynamic cron and anti-ban queue"
```

---

### Task 5: Express REST API & Upload Handling

**Files:**
- Create: `server/routes/api.js`
- Create: `server/index.js`
- Create: `tests/api.test.js`

**Interfaces:**
- Routes:
  - `GET /api/status`: Status of WhatsApp connection and scheduler
  - `GET /api/verse`: Current daily verse
  - `POST /api/verse/roll`: Roll a new random verse
  - `GET /api/verse/search?q=`: Search verses
  - `POST /api/verse/select`: Select a specific verse or custom text
  - `POST /api/upload`: Multer image upload route returning file url/path
  - `DELETE /api/upload`: Remove attached image
  - `GET /api/schedule`: Get scheduled time
  - `POST /api/schedule`: Update scheduled time
  - `GET /api/recipients`: Get contacts/groups with selection state
  - `POST /api/recipients`: Save selection of recipients
  - `POST /api/dispatch`: Trigger immediate test/manual dispatch
  - `GET /api/logs`: Get recent dispatch logs

- [ ] **Step 1: Write API integration tests in `tests/api.test.js`**
Test endpoints for status, verse retrieval, schedule updating, and file upload validation.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/api.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `server/routes/api.js` and `server/index.js`**
Setup Express app, CORS, JSON parser, Multer for `uploads/` directory with size and mime-type checks, Socket.IO HTTP server attachment, and static routes.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/api.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/routes/api.js server/index.js tests/api.test.js
git commit -m "feat: implement REST API and Socket.IO server"
```

---

### Task 6: Modern React UI / UX Dashboard

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/tailwind.config.js`
- Create: `client/src/index.css`
- Create: `client/src/App.jsx`
- Create: `client/src/components/WhatsAppCard.jsx`
- Create: `client/src/components/VerseViewer.jsx`
- Create: `client/src/components/ImageAttachment.jsx`
- Create: `client/src/components/ScheduleCard.jsx`
- Create: `client/src/components/RecipientPicker.jsx`
- Create: `client/src/components/LiveWhatsAppPreview.jsx`
- Create: `client/src/components/DispatchLogs.jsx`

**Interfaces:**
- Consumes: REST API (`/api/*`) and Socket.IO (`qr`, `connection_status`, `dispatch_progress`, `dispatch_complete`)
- Produces: Polished, responsive single-page web dashboard with WhatsApp preview, dark mode aesthetics, and micro-animations.

- [ ] **Step 1: Scaffold Vite + React + Tailwind + Lucide client application**
Install dependencies and configure Tailwind CSS tokens with modern dark color scheme (`slate-950`, emerald green WhatsApp accents, smooth rounded corners, glassmorphism cards).

- [ ] **Step 2: Build UI Components**
  - `WhatsAppCard`: QR Code modal/display, scan status, user profile banner and disconnect button.
  - `VerseViewer`: Displays today's verse, quick "Sortear Outro" button, search modal with autocomplete, and custom caption/greeting textarea.
  - `ImageAttachment`: Drag & drop / click upload area, thumbnail preview, image specs, and remove button.
  - `ScheduleCard`: Time picker (hour:minute, default 06:00), countdown to next dispatch, and instant "Disparar Agora" action button.
  - `LiveWhatsAppPreview`: Visual preview matching WhatsApp's actual chat bubble on mobile.
  - `RecipientPicker`: Searchable list of contacts and groups with badges, "Selecionar Todos", and counter of active recipients.
  - `DispatchLogs`: Real-time progress bar during active sends and table of recent delivery logs.

- [ ] **Step 3: Integrate components in `client/src/App.jsx` with real-time Socket.IO state**
Connect all state handlers so user interactions immediately reflect in UI and persist to the backend.

- [ ] **Step 4: Build client assets and verify no compilation errors**
Run: `npm --prefix client run build`
Expected: Successful build in `client/dist`.

- [ ] **Step 5: Commit**
```bash
git add client/
git commit -m "feat: create modern React UI/UX dashboard with live preview"
```

---

### Task 7: Production Build Integration & Render.com / Supabase Configuration

**Files:**
- Modify: `server/index.js` (serve `client/dist` in production)
- Create: `render.yaml`
- Modify: `package.json` (root build & start scripts)
- Create: `README.md` (detailed instructions for local run and Render.com + Supabase setup)

**Interfaces:**
- Consumes: Built assets in `client/dist`
- Produces: Unified `npm run build` and `npm start` executable on Render.com Web Service

- [ ] **Step 1: Add static frontend serving in `server/index.js` when `client/dist` exists**
Serve `client/dist` static files and fallback `*` to `client/dist/index.html` for single-port hosting.

- [ ] **Step 2: Add root orchestration scripts in `package.json`**
Scripts:
```json
"scripts": {
  "install:all": "npm install && npm install --prefix client",
  "build": "npm --prefix client run build",
  "start": "node server/index.js",
  "dev": "concurrently \"node server/index.js\" \"npm --prefix client run dev\"",
  "test": "node tests/database.test.js && node tests/verseService.test.js && node tests/whatsappService.test.js && node tests/schedulerService.test.js && node tests/api.test.js"
}
```

- [ ] **Step 3: Create `render.yaml` blueprint and comprehensive `README.md`**
Document Render Web Service settings, environment variables (`PORT`, `DATABASE_URL` for Supabase, `SESSION_DATA_PATH`), and step-by-step connection guide.

- [ ] **Step 4: Run end-to-end test suite and production build**
Run: `npm test && npm run build`
Expected: All tests pass and build succeeds cleanly.

- [ ] **Step 5: Commit**
```bash
git add server/index.js package.json render.yaml README.md
git commit -m "feat: complete production integration for Render.com and Supabase"
```
