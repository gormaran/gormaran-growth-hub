# Nexus — Project Memory

## What this project is
General social network — mix of Instagram, BeReal, Snapchat, TikTok, Facebook, WhatsApp, Reddit, Pinterest.
App name: **Nexus**. Working dir: `/Users/gabiorma/Nexus-RRSS/`.
NOT AI-focused anymore (changed in session 2).

## Architecture
npm monorepo with workspaces:
- `apps/web` — Next.js 14 (App Router), TailwindCSS, next-auth, react-query
- `apps/api` — NestJS 10, Prisma 5, PostgreSQL, Socket.io, Cloudinary
- `packages/shared` — shared constants, types, socket event names

## Key files
- Frontend entry: `apps/web/src/app/layout.tsx`
- Global styles: `apps/web/src/app/globals.css`  (dark, brand = purple/rose gradient)
- API client: `apps/web/src/lib/api.ts`
- Auth: `apps/web/src/lib/auth.ts` (next-auth)
- Backend entry: `apps/api/src/main.ts` (port 4000, prefix `/api`)
- DB schema: `apps/api/prisma/schema.prisma`

## DB tables (general social network)
users, accounts, posts (PostType: text|photo|reel|moment|link|poll),
media, stories, story_views, comments, likes, reactions, saves, reposts,
follows, communities, community_members, boards, pins, events, event_attendees,
conversations, conversation_participants, messages, notifications

## Frontend screens
/feed (stories bar + posts), /explore, /reels (TikTok-style),
/communities (Reddit-style), /events (Facebook-style),
/boards (Pinterest-style), /notifications, /messages, /profile/[username], /create

## Design system
- Dark theme, brand gradient: purple (#c026d3) → rose (#e11d48) → orange (#f97316)
- Story ring: `bg-gradient-story` — same gradient, 45deg
- Tailwind utilities: `.btn-primary`, `.btn-secondary`, `.card`, `.input`, `.badge`, `.story-ring`

## API routes
POST /auth/register, POST /auth/login, GET /auth/me
GET/PATCH /users/:username, follow/unfollow, search, suggestions
POST /posts, GET /posts/:id, DELETE, like/unlike, comments
GET /feed?type=for-you|following|trending
GET/POST /conversations + messages via WebSocket
GET /notifications, mark read

## Fixed bugs (session 2)
- `FeedModule` was missing `exports: [FeedService]` → fixed
- `PostsModule` was missing imports of `LikesModule` and `CommentsModule` → fixed
- `noImplicitAny: true` removed from `apps/api/tsconfig.json`
- Root `package.json` scripts changed from `--workspace=` to `cd apps/X &&` (npm compatibility)

## Run order
1. `docker run --name nexus-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nexus_db -p 5432:5432 -d postgres`
2. `cd apps/api && npx prisma generate && npx prisma migrate dev --name init`
3. Terminal 1: `cd apps/web && npm run dev`  → :3000
4. Terminal 2: `cd apps/api && npm run dev`  → :4000/api
