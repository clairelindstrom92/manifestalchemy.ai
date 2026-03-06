# CLAUDE.md — Manifest Alchemy AI

Comprehensive guide for AI assistants working on this codebase.

---

## Project Overview

**Manifest Alchemy AI** is a full-stack Next.js application for AI-powered manifestation coaching. Users chat with an AI that extracts their goals, generates a structured manifestation plan, and creates vision board images. It features RAG (Retrieval-Augmented Generation) for personalized context across sessions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, Framer Motion 12 |
| Auth & DB | Supabase (PostgreSQL + pgvector) |
| AI (chat) | OpenAI `gpt-4o-mini` (default), Ollama, Replicate |
| AI (images) | OpenAI `gpt-image-1` (default), FLUX.1 LoRA on Replicate |
| Deployment | Vercel |

---

## Directory Structure

```
/
├── app/
│   ├── api/                      # Backend API routes (route.ts files)
│   │   ├── chat/route.ts         # Main streaming chat endpoint
│   │   ├── images/               # save, reference image endpoints
│   │   ├── journal/              # CRUD + embed + ask endpoints
│   │   ├── manifestations/       # analyze, image generation
│   │   ├── profile/              # avatar endpoints
│   │   └── debug/route.ts        # Shows env var config status
│   ├── auth/callback/            # Supabase OAuth callback
│   ├── dashboard/                # Protected pages (affirmations, feed, etc.)
│   ├── chat/page.tsx             # Chat UI page
│   ├── login/page.tsx            # Auth page
│   ├── layout.tsx                # Root layout (fonts, providers)
│   ├── page.tsx                  # Welcome/landing page
│   └── globals.css               # Global styles + custom animations
│
├── components/
│   ├── shared/                   # Reusable: GoldButton, MagicalBackground,
│   │   │                         #   MagicalButton, MagicalInput, Toast
│   ├── ChatInterface.tsx         # Full chat UI with streaming
│   ├── Dashboard.tsx             # Main dashboard wrapper
│   ├── AnimatedStarBackground.tsx
│   ├── GleamyWrapper.tsx         # Provider wrapper for Gleamy library
│   ├── JournalPanel.tsx
│   ├── ManifestationDetail.tsx
│   ├── ManifestationsGrid.tsx
│   └── Sidebar.tsx
│
├── hooks/
│   └── useSupabaseUser.ts        # Auth state hook
│
├── lib/
│   ├── ai/
│   │   ├── router.ts             # Chat + embedding provider abstraction
│   │   └── imageRouter.ts        # Image generation provider abstraction
│   ├── rag/
│   │   └── embed.ts              # pgvector upsert/query utilities
│   └── supabaseClient.ts         # Browser Supabase client
│
├── types/index.ts                # Shared TypeScript types
├── middleware.ts                 # Auth middleware (protects /dashboard)
├── supabase/migrations/          # SQL migration files
└── training/                     # LLM + image model fine-tuning scripts
```

---

## Development Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm start        # Run production server
npm run lint     # ESLint check
```

> No test suite exists currently. The `--legacy-peer-deps` flag is set in `.npmrc` to handle peer dependency conflicts.

---

## Environment Variables

### Required

```bash
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY         # Server-side only (API routes)
OPENAI_API_KEY                    # Required for chat, embeddings, images
```

### AI Provider Switching (optional)

```bash
AI_PROVIDER=openai                # 'openai' | 'ollama' | 'replicate'
IMAGE_PROVIDER=openai             # 'openai' | 'replicate'
```

### Local LLM (Ollama)

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=<fine-tuned-model-name>
```

### Production (Replicate)

```bash
REPLICATE_API_TOKEN
REPLICATE_LLM_MODEL_VERSION       # Model version hash
REPLICATE_IMAGE_MODEL_VERSION     # FLUX.1 LoRA version hash
```

### Optional

```bash
OPENAI_CHAT_MODEL=gpt-4o-mini     # Override chat model
NEXT_PUBLIC_SITE_URL              # For metadata base URL
```

---

## Key Architecture Patterns

### AI Provider Abstraction

All AI calls go through `lib/ai/router.ts` — never call OpenAI/HuggingFace/Replicate SDKs directly from components or API routes. Use these functions:

```ts
chatComplete(messages, systemPrompt?)    // Full response
chatStream(messages, systemPrompt?)      // Async generator (streaming)
embedText(text)                          // Always uses OpenAI
jsonComplete(messages, systemPrompt?)    // Returns parsed JSON object
```

Image generation uses `lib/ai/imageRouter.ts`:

```ts
generateImage({ prompt, referenceImageUrl?, referenceStrength? })
// Returns: { url?, base64? }
```

Switch providers by changing `AI_PROVIDER` or `IMAGE_PROVIDER` env vars — no code changes required.

### Chat Streaming Protocol

`POST /api/chat` returns newline-delimited JSON chunks:

```jsonc
{"t": "c", "v": "chunk text"}          // content chunk
{"t": "d", "intent": {...}, "notes_used": [...]}  // final data
{"t": "e", "error": "message"}         // error
```

The AI personality asks **exactly one question per response**, cycling through 7 types (SPECIFICITY, TIMELINE, WHY, OBSTACLE, VISUALIZATION, ACTION EVIDENCE, EMOTIONAL ANCHOR). After 6+ exchanges it generates a "✨ Manifestation Plan".

### RAG (Retrieval-Augmented Generation)

Uses Supabase pgvector. All user data (manifestations, journal entries, chat sessions) is embedded and stored for context retrieval.

```ts
import { upsertChunk, queryChunks, deleteChunk } from '@/lib/rag/embed'

// Store content
await upsertChunk({ id, content, source_type, source_id, user_id })

// Query (returns chunks above 0.65 similarity by default)
const chunks = await queryChunks({ text: userMessage, userId, limit: 5 })
```

Source types: `'manifestation' | 'journal' | 'chat'`

### Authentication

- `middleware.ts` protects all `/dashboard/*` routes
- Use `useSupabaseUser()` hook in client components for auth state
- API routes that need auth: use `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client

### Supabase Client Usage

```ts
// Client components / browser
import { supabase } from '@/lib/supabaseClient'

// Server/API routes — create inline with service role
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
```

---

## Database Schema

### Tables

**`profiles`** — User profile data
- `id` (UUID PK → auth.users), `display_name`, `avatar_url`, `updated_at`

**`manifestations`** — User manifestations
- Stores intent title, summary, micro-tasks, image prompts
- Auto-embedded into RAG on creation

**`journal_entries`** — Journal/log entries per manifestation
- Embedded into RAG via `POST /api/journal/embed`

**`saved_images`** — Saved/hearted generated images
- Links to `manifestations`, stores `source_url`, `prompt`, `is_training_data`

**`reference_images`** — User photos for FLUX IP-Adapter conditioning
- `storage_path`, `label`, `is_profile_picture`, `is_training_data`

**`chunks`** — pgvector RAG store
- `embedding` vector column, `content`, `source_type`, `source_id`, `user_id`

### Storage Buckets (all public)

- `manifestation-media` — Vision boards, AI-generated images
- `chat-images` — Images uploaded during chat
- `reference-images` — User reference photos for image conditioning
- `avatars` — Profile pictures

### RLS Policy Pattern

All tables use Row-Level Security. Users can only access their own rows. Server-side API routes bypass RLS using the service role key.

---

## Component & Code Conventions

### File Naming

- **Components:** PascalCase (`ChatInterface.tsx`)
- **Utilities/functions:** camelCase (`chatStream`)
- **API routes:** `app/api/<resource>/route.ts`
- **Pages:** `app/<path>/page.tsx`

### Client vs Server Components

- Add `'use client'` at the top for interactive components (hooks, event handlers, animations)
- Layouts and static pages default to server components
- API routes (`route.ts`) are always server-side

### Styling

- Primary: Tailwind CSS utility classes
- Brand color: `#E4B77D` (gold) — use inline `text-[#E4B77D]` or Tailwind config aliases
- Tailwind config custom colors: `gold.light` (#facc15), `gold.DEFAULT` (#fbbf24), `gold.deep` (#f59e0b)
- Animation: Framer Motion for entrances/transitions; custom `shimmer` keyframe in globals.css
- Fonts: Ballet (headings), Quicksand, Poppins (body) — loaded in `app/layout.tsx`

### API Route Pattern

```ts
// app/api/<resource>/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // ... logic
    return NextResponse.json({ result })
  } catch (err) {
    return NextResponse.json({ error: 'message' }, { status: 500 })
  }
}
```

### Error Handling

- API routes: `try/catch` returning `NextResponse.json({ error }, { status })`
- RAG operations: non-fatal, log and continue
- Missing env vars: handled gracefully in `lib/supabaseClient.ts` — won't throw at import time
- Check `/api/debug` to verify which API keys are configured

---

## Image Generation Notes

- **Trigger word:** `MANIFESTA` — include this in prompts when using the FLUX.1 LoRA model to activate the custom aesthetic
- **Reference image conditioning:** Pass `referenceImageUrl` + `referenceStrength` (0.0–1.0) to `generateImage()` for IP-Adapter face/style conditioning (Replicate only)
- **OpenAI provider** returns `base64` PNG; **Replicate** returns a URL

---

## Model Fine-Tuning (Reference)

See `training/README.md` for full instructions.

- **LLM:** Unsloth + Llama 3.1, RTX 3060, GGUF → Ollama → Replicate
- **Image:** kohya sd-scripts FLUX.1 LoRA, RunPod A100, safetensors → Replicate
- Training dataset for images: 619 images in `training/flux_dataset/`

---

## Deployment

Deployed on **Vercel**. No CI/CD automation — deploys trigger on push to `main`/`master`.

1. Set all required env vars in Vercel dashboard
2. Push to main branch
3. Vercel runs `npm install` (with `--legacy-peer-deps`) then `npm run build`
4. Use `/api/debug` after deploy to verify env var configuration

See `DEPLOYMENT.md` for step-by-step Vercel env var setup.
