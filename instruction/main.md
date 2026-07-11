# Instagram AI DM Auto-Reply Agent — Full Implementation Plan

> **Goal:** Build a Next.js application that automatically replies to Instagram Direct Messages using AI (Gemini / OpenAI), with a dashboard to manage settings, view conversations, and monitor performance.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & Account Setup](#2-prerequisites--account-setup)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Phase 1 — Project Scaffolding](#5-phase-1--project-scaffolding)
6. [Phase 2 — Meta Webhook Integration](#6-phase-2--meta-webhook-integration)
7. [Phase 3 — Database & Conversation History](#7-phase-3--database--conversation-history)
8. [Phase 4 — AI Response Engine](#8-phase-4--ai-response-engine)
9. [Phase 5 — Send Reply via Instagram API](#9-phase-5--send-reply-via-instagram-api)
10. [Phase 6 — Admin Dashboard](#10-phase-6--admin-dashboard)
11. [Phase 7 — Security & Production Hardening](#11-phase-7--security--production-hardening)
12. [Phase 8 — Token Management](#12-phase-8--token-management)
13. [Phase 9 — Deployment](#13-phase-9--deployment)
14. [Phase 10 — Meta App Review](#14-phase-10--meta-app-review)
15. [Environment Variables](#15-environment-variables)
16. [Development Workflow](#16-development-workflow)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        INSTAGRAM USER                           │
│                   sends a DM to your account                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     META / INSTAGRAM SERVERS                    │
│         Pushes webhook event to your Callback URL               │
└────────────────────────────┬────────────────────────────────────┘
                             │  POST /api/webhook
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                         │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │  Webhook API  │──▶│  Message     │──▶│  AI Engine         │  │
│  │  /api/webhook │   │  Processor   │   │  (Gemini / OpenAI) │  │
│  └──────────────┘   └──────┬───────┘   └────────┬───────────┘  │
│                            │                     │              │
│                            ▼                     ▼              │
│                   ┌──────────────┐     ┌──────────────────┐    │
│                   │  Database    │     │  Send Reply API  │    │
│                   │  (Postgres)  │     │  POST /me/msgs   │    │
│                   └──────────────┘     └──────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ADMIN DASHBOARD (React UI)                   │  │
│  │   • View conversations   • Configure AI persona          │  │
│  │   • Toggle auto-reply    • Analytics & logs               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow Summary

1. **User sends DM** → Meta pushes a webhook `POST` to `/api/webhook`
2. **Webhook handler** verifies the `X-Hub-Signature-256` header, extracts `senderId` + `messageText`
3. **Message Processor** saves the incoming message to the database, fetches the last N messages for context
4. **AI Engine** receives the conversation history + system prompt → generates a reply
5. **Send Reply** calls Instagram Graph API `POST /me/messages` with the AI-generated text
6. **Reply is saved** to the database with `isFromAutomation: true`

---

## 2. Prerequisites & Account Setup

### Instagram & Meta

| Step | Action | Details |
|------|--------|---------|
| 1 | **Instagram Account** | Must be a **Business** or **Creator** account (not Personal) |
| 2 | **Facebook Page** | Link your Instagram account to a Facebook Page |
| 3 | **Meta Developer Account** | Register at [developers.facebook.com](https://developers.facebook.com/) |
| 4 | **Create Meta App** | Type: **Business** → Add **Instagram** product |
| 5 | **Permissions** | Request: `instagram_manage_messages`, `instagram_basic`, `pages_manage_metadata`, `pages_show_list` |
| 6 | **Test Users** | Add up to 25 test users for development (no App Review needed) |

### AI Provider

| Provider | How to get API Key |
|----------|-------------------|
| **OpenRouter** | Get your API key from [openrouter.ai/keys](https://openrouter.ai/keys) — one key gives access to Gemini, OpenAI, Claude, Llama, and 200+ models |

### Local Development

| Tool | Purpose |
|------|---------|
| **Node.js 20+** | Runtime |
| **ngrok** | Expose `localhost:3000` to receive webhooks during development |
| **Neon** | Serverless Postgres — free tier at [neon.tech](https://neon.tech) (no local install needed) |

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 15 (App Router) | API routes + React dashboard in one project |
| **Language** | TypeScript | Type safety across webhook payloads and API calls |
| **AI SDK** | Vercel AI SDK (`ai` + `@ai-sdk/openai`) | Unified abstraction, streaming, easy model switching |
| **LLM** | OpenRouter (access to Gemini, GPT-4o, Claude, Llama, etc.) | One API key, 200+ models, easy switching via dashboard |
| **Database** | PostgreSQL via Neon (serverless) | Serverless-friendly, free tier available |
| **ORM** | Prisma | Type-safe queries, migrations, schema-as-code |
| **Auth** | NextAuth.js v5 | Dashboard login (optional, for multi-user) |
| **Deployment** | Vercel | Zero-config Next.js hosting, edge functions |
| **Tunneling** | ngrok | Local webhook testing |

---

## 4. Project Structure

```
insta-ai-agent/
├── instruction/
│   └── main.md                    # This plan
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Dashboard home
│   │   ├── globals.css            # Global styles
│   │   ├── api/
│   │   │   ├── webhook/
│   │   │   │   └── route.ts       # Instagram webhook handler (GET + POST)
│   │   │   ├── chat/
│   │   │   │   └── route.ts       # AI chat endpoint (for dashboard testing)
│   │   │   ├── conversations/
│   │   │   │   └── route.ts       # GET conversations list
│   │   │   ├── messages/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # GET messages for a conversation
│   │   │   └── settings/
│   │   │       └── route.ts       # GET/PUT bot settings
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Conversations list
│   │   │   ├── conversations/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Single conversation view
│   │   │   └── settings/
│   │   │       └── page.tsx       # Bot config (persona, toggle)
│   │   └── login/
│   │       └── page.tsx           # Admin login (optional)
│   ├── lib/
│   │   ├── instagram.ts           # Instagram API helpers (send message, verify signature)
│   │   ├── ai.ts                  # AI engine (generate reply with context)
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── webhook-utils.ts       # Payload parsing, deduplication
│   │   └── constants.ts           # Shared constants
│   ├── components/
│   │   ├── ConversationList.tsx    # Sidebar conversation list
│   │   ├── MessageThread.tsx      # Chat-style message display
│   │   ├── SettingsForm.tsx       # Bot persona editor
│   │   └── StatusBadge.tsx        # Online/offline indicator
│   └── types/
│       ├── instagram.ts           # Instagram webhook payload types
│       └── index.ts               # Shared types
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Auto-generated migrations
├── .env.local                     # Environment variables (git-ignored)
├── .env.example                   # Template for env vars
├── next.config.ts                 # Next.js config
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Phase 1 — Project Scaffolding

### Steps

1. **Initialize Next.js project** with TypeScript + App Router:
   ```bash
   npx -y create-next-app@latest ./ --typescript --app --eslint --tailwind --src-dir --import-alias "@/*"
   ```
   > Note: We use Tailwind here only if preferred — otherwise vanilla CSS is fine.

2. **Install dependencies**:
   ```bash
   # AI (OpenRouter is OpenAI-compatible, so we use @ai-sdk/openai)
   npm install ai @ai-sdk/openai

   # Database
   npm install prisma @prisma/client
   npx prisma init

   # Utilities
   npm install zod          # Schema validation
   ```

3. **Create `.env.example`** with all required variables (see [Section 15](#15-environment-variables)).

4. **Set up Prisma** with the database schema (see [Section 7](#7-phase-3--database--conversation-history)).

---

## 6. Phase 2 — Meta Webhook Integration

### 6.1 Webhook Verification (GET)

Meta sends a `GET` request to verify your endpoint during setup. You must return the `hub.challenge` value.

**File:** `src/app/api/webhook/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}
```

### 6.2 Webhook Event Handler (POST)

Receives incoming DM events from Instagram.

```typescript
import { NextResponse } from 'next/server';
import { verifySignature } from '@/lib/instagram';
import { processIncomingMessage } from '@/lib/webhook-utils';

export async function POST(req: Request) {
  // 1. Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256') || '';

  // 2. Verify the request is from Meta
  if (!verifySignature(rawBody, signature)) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  // 3. Parse and process
  const body = JSON.parse(rawBody);

  if (body.object === 'instagram') {
    // Process asynchronously to return 200 quickly
    // Meta requires a fast response
    body.entry?.forEach((entry: any) => {
      entry.messaging?.forEach((event: any) => {
        // Fire-and-forget: process in background
        processIncomingMessage(event).catch(console.error);
      });
    });

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  return new NextResponse('Not Found', { status: 404 });
}
```

### 6.3 Signature Verification

**File:** `src/lib/instagram.ts`

```typescript
import crypto from 'crypto';

export function verifySignature(rawBody: string, signature: string): boolean {
  if (!signature) return false;

  const appSecret = process.env.META_APP_SECRET!;
  const expectedSignature =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

  const expected = Buffer.from(expectedSignature, 'utf8');
  const received = Buffer.from(signature, 'utf8');

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}
```

### 6.4 Meta Dashboard Configuration

1. Go to **Meta App Dashboard** → **Webhooks** → **Add Subscription**
2. Select **Instagram**
3. **Callback URL:** `https://<your-ngrok-url>/api/webhook` (dev) or `https://<your-domain>/api/webhook` (prod)
4. **Verify Token:** Same value as `WEBHOOK_VERIFY_TOKEN` in your `.env`
5. **Subscribe to fields:** `messages`

### 6.5 Enable Page Subscriptions

After webhook setup, programmatically subscribe your app to the page:

```bash
curl -X POST "https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps" \
  -d "subscribed_fields=messages" \
  -d "access_token={PAGE_ACCESS_TOKEN}"
```

---

## 7. Phase 3 — Database & Conversation History

### 7.1 Prisma Schema

**File:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Conversation {
  id               String    @id @default(uuid())
  participantId    String    @unique   // Instagram-scoped user ID (IGSID)
  participantName  String?             // Cached display name (if available)
  isAutoReplyOn    Boolean   @default(true)
  messages         Message[]
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([participantId])
}

model Message {
  id               String       @id @default(uuid())
  igMessageId      String       @unique   // Instagram message ID (for dedup)
  conversationId   String
  conversation     Conversation @relation(fields: [conversationId], references: [id])
  senderId         String                 // Who sent it (user IGSID or "bot")
  text             String
  isFromBot        Boolean      @default(false)
  timestamp        DateTime
  createdAt        DateTime     @default(now())

  @@index([conversationId, timestamp])
}

model BotSettings {
  id               String   @id @default("default")
  systemPrompt     String   @default("You are a helpful assistant responding to Instagram DMs. Be friendly, concise, and helpful.")
  isGloballyActive Boolean  @default(true)
  maxHistoryLength Int      @default(15)   // Number of past messages to include as context
  model            String   @default("google/gemini-2.0-flash-001")
  updatedAt        DateTime @updatedAt
}
```

### 7.2 Prisma Client Singleton

**File:** `src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 7.3 Run Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## 8. Phase 4 — AI Response Engine

### 8.1 AI Module

**File:** `src/lib/ai.ts`

```typescript
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { prisma } from './db';

// Configure OpenRouter as an OpenAI-compatible provider
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Instagram AI Agent',
  },
});

interface GenerateReplyOptions {
  conversationId: string;
  userMessage: string;
}

export async function generateAIReply({ conversationId, userMessage }: GenerateReplyOptions): Promise<string> {
  // 1. Fetch bot settings
  const settings = await prisma.botSettings.findFirst({
    where: { id: 'default' },
  });

  const systemPrompt = settings?.systemPrompt || 'You are a helpful Instagram DM assistant.';
  const maxHistory = settings?.maxHistoryLength || 15;
  const modelId = settings?.model || 'google/gemini-2.0-flash-001';

  // 2. Fetch conversation history for context
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { timestamp: 'desc' },
    take: maxHistory,
  });

  // Reverse to chronological order
  const messages = history.reverse().map((msg) => ({
    role: msg.isFromBot ? ('assistant' as const) : ('user' as const),
    content: msg.text,
  }));

  // Add the new user message
  messages.push({ role: 'user', content: userMessage });

  // 3. Generate reply via OpenRouter
  //    Change the model string to use any model on OpenRouter:
  //    e.g. 'google/gemini-2.0-flash-001', 'openai/gpt-4o-mini',
  //         'anthropic/claude-sonnet-4', 'meta-llama/llama-3-70b'
  const result = await generateText({
    model: openrouter(modelId),
    system: systemPrompt,
    messages,
  });

  return result.text;
}
```

### 8.2 System Prompt Best Practices

Store the system prompt in the database (`BotSettings.systemPrompt`) so it can be edited via the dashboard. Example:

```
You are [Brand Name]'s friendly Instagram assistant.

Rules:
- Be concise (under 300 characters when possible)
- Be warm and professional
- If you don't know something, say "Let me connect you with our team" instead of guessing
- Never share pricing unless explicitly asked
- Never discuss competitors
- If someone seems upset, empathize first, then offer help
- Do NOT use markdown formatting — Instagram DMs don't render it
```

---

## 9. Phase 5 — Send Reply via Instagram API

### 9.1 Send Message Helper

**File:** `src/lib/instagram.ts` (add to existing file)

```typescript
const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export async function sendInstagramMessage(
  recipientId: string,
  messageText: string
): Promise<boolean> {
  const accessToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN!;

  // Instagram has a ~1000 char limit per message
  // Split long messages into chunks
  const chunks = splitMessage(messageText, 950);

  for (let i = 0; i < chunks.length; i++) {
    const response = await fetch(`${GRAPH_API_BASE}/me/messages?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: chunks[i] },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send message:', error);
      return false;
    }

    // Add delay between chunks to simulate typing
    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return true;
}

function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a sentence or word boundary
    let splitIndex = remaining.lastIndexOf('. ', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.substring(0, splitIndex + 1).trim());
    remaining = remaining.substring(splitIndex + 1).trim();
  }

  return chunks;
}
```

### 9.2 Message Processor (Full Pipeline)

**File:** `src/lib/webhook-utils.ts`

```typescript
import { prisma } from './db';
import { generateAIReply } from './ai';
import { sendInstagramMessage } from './instagram';

interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text: string;
  };
}

export async function processIncomingMessage(event: MessagingEvent) {
  // Ignore non-text messages (stickers, images, etc.) for now
  if (!event.message?.text) return;

  const senderId = event.sender.id;
  const messageText = event.message.text;
  const messageId = event.message.mid;

  // 1. Deduplication — check if we've already processed this message
  const existing = await prisma.message.findUnique({
    where: { igMessageId: messageId },
  });
  if (existing) return;

  // 2. Find or create conversation
  let conversation = await prisma.conversation.findUnique({
    where: { participantId: senderId },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { participantId: senderId },
    });
  }

  // 3. Save incoming message
  await prisma.message.create({
    data: {
      igMessageId: messageId,
      conversationId: conversation.id,
      senderId,
      text: messageText,
      isFromBot: false,
      timestamp: new Date(event.timestamp),
    },
  });

  // 4. Check if auto-reply is enabled
  const settings = await prisma.botSettings.findFirst({ where: { id: 'default' } });
  if (!settings?.isGloballyActive || !conversation.isAutoReplyOn) return;

  // 5. Generate AI reply
  const aiReply = await generateAIReply({
    conversationId: conversation.id,
    userMessage: messageText,
  });

  // 6. Send reply via Instagram API
  const sent = await sendInstagramMessage(senderId, aiReply);

  // 7. Save bot reply to database
  if (sent) {
    await prisma.message.create({
      data: {
        igMessageId: `bot_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        conversationId: conversation.id,
        senderId: 'bot',
        text: aiReply,
        isFromBot: true,
        timestamp: new Date(),
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
  }
}
```

---

## 10. Phase 6 — Admin Dashboard

### 10.1 Pages

| Route | Purpose |
|-------|---------|
| `/dashboard` | Overview: total conversations, messages today, active/inactive status |
| `/dashboard/conversations` | List of all conversations with latest message preview |
| `/dashboard/conversations/[id]` | Full message thread (chat-style UI) |
| `/dashboard/settings` | Edit system prompt, toggle auto-reply, select AI model |

### 10.2 Key API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversations` | GET | List all conversations (paginated) |
| `/api/messages/[conversationId]` | GET | Get messages for a conversation |
| `/api/settings` | GET | Get current bot settings |
| `/api/settings` | PUT | Update bot settings |
| `/api/conversations/[id]/toggle` | PATCH | Toggle auto-reply for a specific conversation |

### 10.3 Dashboard Design Goals

- **OLED Dark Theme**: Pure black primary canvas (`#000000`) and stark white secondary accents/text as specified in [design.md](file:///c:/Users/XAN/Documents/insta-ai-agent/instruction/design.md).
- **Glassmorphism**: Cards with subtle background transparency, blur filters, and micro-borders.
- **Real-time feel**: Auto-refresh conversations every 10 seconds.
- **Chat-style UI**: Message threads with bubbles (black background + white border for user, grey background for agent).
- **Status indicators**: Pulsing white dot for active states, dark gray dot for inactive states.
- **Settings panel**: High-contrast controls with clean typography (Inter/Outfit).

---

## 11. Phase 7 — Security & Production Hardening

### 11.1 Webhook Security

- ✅ Verify `X-Hub-Signature-256` on every POST (implemented in Phase 2)
- ✅ Use `crypto.timingSafeEqual` to prevent timing attacks
- ✅ Never log full access tokens

### 11.2 Rate Limiting

Add rate limiting to your API routes to prevent abuse:

```typescript
// Consider using: npm install @upstash/ratelimit @upstash/redis
// Or a simple in-memory rate limiter for smaller scale
```

### 11.3 Error Handling

- Wrap all webhook processing in try/catch
- Always return `200 OK` to Meta quickly (they retry on failure with exponential backoff)
- Log errors to a service (Sentry, or a database `ErrorLog` table)

### 11.4 Message Deduplication

- Always check `igMessageId` before processing (implemented in Phase 5)
- Meta may retry delivery, so your handler must be idempotent

### 11.5 The 24-Hour Window

> **Critical Rule:** Instagram only allows you to send free-form messages within **24 hours** of the user's last interaction. After that, you cannot message them.

- Your bot should only reply to incoming messages (reactive), never proactively message users
- Store the `lastMessageAt` timestamp and check it before sending

### 11.6 Human Handoff

- Add a mechanism for the AI to detect when it can't help:
  - e.g., if the user says "talk to a human" or the AI is unsure
- The AI should respond with a fallback like "Let me connect you with our team — someone will reply shortly!"
- Disable auto-reply for that conversation via `isAutoReplyOn: false`

---

## 12. Phase 8 — Token Management

### 12.1 Token Types

| Token | Lifespan | Refresh? |
|-------|----------|----------|
| **Short-lived User Token** | ~1 hour | Exchange for long-lived |
| **Long-lived User Token** | 60 days | Yes, via `GET /refresh_access_token` |
| **Page Access Token** | Never expires (if derived from long-lived user token) | No |

### 12.2 Token Flow

1. **OAuth Login** → Get short-lived user token
2. **Exchange** → `GET /oauth/access_token?grant_type=fb_exchange_token&...` → Long-lived user token (60 days)
3. **Get Page Token** → `GET /{user-id}/accounts` → Returns non-expiring page access token
4. **Store** the page access token securely in environment variables or encrypted in the database

### 12.3 Automated Refresh (if using user-level tokens)

Set up a cron job to refresh tokens every 50 days:

```typescript
// src/app/api/cron/refresh-token/route.ts
// Triggered by Vercel Cron or external scheduler

export async function GET() {
  const currentToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;

  const response = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`
  );

  const data = await response.json();
  // Store new token securely
  // ...

  return new Response('Token refreshed', { status: 200 });
}
```

---

## 13. Phase 9 — Deployment

### 13.1 Vercel Deployment

1. Push code to GitHub
2. Connect repo to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

### 13.2 Database (Neon)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the **pooled connection string** from the Neon dashboard
3. Format: `postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Paste it as `DATABASE_URL` in your Vercel env vars

### 13.3 Post-Deployment

1. Update the **Meta webhook Callback URL** to your production Vercel URL:
   `https://your-app.vercel.app/api/webhook`
2. Re-verify the webhook in Meta Dashboard
3. Subscribe your page to the app:
   ```bash
   curl -X POST "https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps" \
     -d "subscribed_fields=messages" \
     -d "access_token={PAGE_ACCESS_TOKEN}"
   ```

---

## 14. Phase 10 — Meta App Review

> **Required for production use beyond 25 test users.**

### 14.1 What to Prepare

| Item | Details |
|------|---------|
| **Privacy Policy URL** | Must be publicly accessible (host on your site or Notion) |
| **Data Deletion URL** | Callback endpoint or instructions page for GDPR compliance |
| **Screencast Video** | Record a demo showing: login → receive DM → AI auto-replies |
| **Use Case Description** | Clear explanation of what your app does with messaging permissions |

### 14.2 Submission Steps

1. Go to **App Dashboard** → **App Review** → **Permissions and Features**
2. Request **Advanced Access** for `instagram_manage_messages`
3. Provide screencast + use case description
4. Submit for review (typically 2–5 business days)

### 14.3 Common Rejection Reasons

- ❌ Screencast doesn't show actual DMs being sent/received
- ❌ Missing privacy policy
- ❌ Over-requesting permissions not actually used
- ❌ App not fully functional during review

---

## 15. Environment Variables

**File:** `.env.local`

```env
# ── Meta / Instagram ──────────────────────────────────
WEBHOOK_VERIFY_TOKEN=your_random_verify_string_here
META_APP_SECRET=your_meta_app_secret
INSTAGRAM_PAGE_ACCESS_TOKEN=your_page_access_token
META_APP_ID=your_meta_app_id

# ── AI Provider (OpenRouter) ──────────────────────────
OPENROUTER_API_KEY=your_openrouter_api_key

# ── Database (Neon) ───────────────────────────────────
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# ── App ───────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 16. Development Workflow

### Local Development

```bash
# 1. Start the app
npm run dev

# 2. In a separate terminal, start ngrok
ngrok http 3000

# 3. Copy the ngrok HTTPS URL
# 4. Paste it as the Callback URL in Meta Dashboard → Webhooks
# 5. Verify the webhook
# 6. Send a test DM to your Instagram Business account
# 7. Watch the logs in your terminal!
```

### Testing Checklist

- [ ] Webhook verification (`GET`) returns `hub.challenge`
- [ ] Webhook handler (`POST`) verifies `X-Hub-Signature-256`
- [ ] Incoming messages are saved to the database
- [ ] AI generates contextual replies using conversation history
- [ ] Replies are sent back via Instagram API
- [ ] Duplicate messages are ignored (idempotent)
- [ ] Long messages are split into chunks
- [ ] Dashboard shows conversations and messages
- [ ] Settings can be updated (system prompt, toggle, model)
- [ ] Auto-reply can be toggled per conversation

---

## Implementation Order (Recommended)

| Priority | Phase | Description | Estimated Effort |
|----------|-------|-------------|-----------------|
| 🔴 P0 | Phase 1 | Project scaffolding + dependencies | 30 min |
| 🔴 P0 | Phase 2 | Webhook handler (GET + POST) | 1 hour |
| 🔴 P0 | Phase 3 | Database schema + Prisma setup | 45 min |
| 🔴 P0 | Phase 4 | AI response engine | 1 hour |
| 🔴 P0 | Phase 5 | Send reply + full pipeline | 1.5 hours |
| 🟡 P1 | Phase 6 | Admin dashboard | 3–4 hours |
| 🟡 P1 | Phase 7 | Security hardening | 1 hour |
| 🟢 P2 | Phase 8 | Token management | 1 hour |
| 🟢 P2 | Phase 9 | Deployment | 30 min |
| 🟢 P2 | Phase 10 | Meta App Review | 1–2 days (review wait) |

**Total estimated development time: ~10–12 hours** (excluding App Review wait time)

---

> **Next Step:** Once you approve this plan, we will start with Phase 1 (project scaffolding) and work through each phase sequentially.
