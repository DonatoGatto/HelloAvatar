# HelloAvatar — B2B SaaS AI Avatar Platform

HeyGen-like platform for businesses: talking avatar video generation, real-time live chat widgets, and embeddable on any website.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS + PostgreSQL + Prisma |
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Avatar API | HeyGen API v2 |
| Voice | ElevenLabs API |
| Auth | JWT |
| Billing | Stripe |
| Storage | AWS S3 |

---

## Quick start

### 1. Prerequisites
- Node.js 20+
- PostgreSQL (or Docker)
- API keys: HeyGen, ElevenLabs, Stripe, AWS

### 2. Backend setup

```bash
cd backend
cp .env.example .env        # fill in all API keys
npm install
npx prisma migrate dev      # creates tables
npm run start:dev           # → http://localhost:4000
# Swagger docs: http://localhost:4000/api/docs
```

### 3. Frontend setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # → http://localhost:3000
```

### 4. Docker (all-in-one)

```bash
cp .env.example .env         # root .env
docker compose up --build
```

---

## Environment variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT tokens |
| `HEYGEN_API_KEY` | HeyGen API key |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret |
| `AWS_REGION` | S3 region (default: us-east-1) |
| `AWS_S3_BUCKET` | S3 bucket name |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER` | Stripe price ID for Starter plan |
| `STRIPE_PRICE_PRO` | Stripe price ID for Pro plan |

### Frontend (`.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_APP_URL` | Frontend URL |

---

## Architecture

```
HelloAvatar/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/               # JWT login/register
│   │   ├── workspaces/         # Multi-tenant workspace management
│   │   ├── avatars/            # Avatar CRUD + HeyGen integration
│   │   ├── videos/             # Video generation + status polling
│   │   ├── streaming/          # Real-time avatar sessions + widget configs
│   │   ├── billing/            # Stripe subscriptions + webhooks
│   │   ├── api-keys/           # External API key management
│   │   ├── widget/             # Embeddable widget.js serving
│   │   ├── heygen/             # HeyGen API wrapper service
│   │   ├── elevenlabs/         # ElevenLabs API wrapper service
│   │   └── s3/                 # AWS S3 service
│   └── prisma/
│       └── schema.prisma       # Database schema
│
├── frontend/                   # Next.js 14 Dashboard
│   └── src/app/
│       ├── page.tsx            # Landing page
│       ├── login/              # Login
│       ├── register/           # Register
│       └── dashboard/
│           ├── page.tsx        # Overview with stats
│           ├── avatars/        # Avatar library + custom creation
│           ├── videos/         # Video generator + library
│           ├── live-chat/      # Widget configs + embed code
│           ├── billing/        # Plans + invoices + Stripe checkout
│           └── settings/       # Workspace + team + API keys
│
└── docker-compose.yml
```

---

## Embed widget usage

Add to any website:

```html
<script
  src="https://yourplatform.com/api/widget/widget.js"
  data-widget-id="your-widget-config-id"
  data-color="#6366f1"
  data-position="bottom-right"
  data-title="AI Assistant"
></script>
```

---

## API

All backend endpoints are documented via Swagger at `/api/docs`.

Authentication: Bearer JWT (dashboard) or `x-api-key` header (external API).

### Key endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account + workspace |
| POST | `/api/auth/login` | Login |
| GET | `/api/avatars/stock` | List HeyGen stock avatars |
| POST | `/api/avatars/custom` | Create custom avatar |
| POST | `/api/videos/generate` | Generate video |
| GET | `/api/videos/:id/status` | Poll video status |
| POST | `/api/streaming/widgets` | Create widget config |
| POST | `/api/public/streaming/start` | Start avatar session (widget) |
| POST | `/api/billing/checkout` | Stripe checkout session |

---

## Stripe Setup

1. Create products in Stripe Dashboard
2. Copy price IDs to `.env` (`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`)
3. Set up webhook: `stripe listen --forward-to localhost:4000/api/billing/webhook`
4. Events to handle: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

---

## Credits system

- 1 credit = 1 minute of video generation
- 1 credit = 1 minute of live chat session
- Free plan: 20 credits
- Starter: 100 credits/month
- Pro: 500 credits/month
- Credits are deducted after successful generation/session completion
