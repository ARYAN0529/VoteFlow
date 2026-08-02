# Votify (VoteFlow)

A real-time polling application built with Next.js, featuring passkey (WebAuthn/FIDO2) authentication instead of passwords. Create polls, share them, vote once, and watch results update live.

**Live demo:** [vote-flow-two.vercel.app](https://vote-flow-two.vercel.app)

---

## Features

- **Passwordless authentication** — register and log in using device passkeys (fingerprint, face, or PIN) via WebAuthn/FIDO2, no passwords stored or transmitted
- **Create polls** — a question with multiple answer options
- **Vote once** — each user can vote a single time per poll; double-voting is prevented server-side
- **Live results** — results update in real time via Server-Sent Events (SSE), with animated result bars, no page refresh needed
- **Privacy-first results** — poll results are visible only to the poll's creator and to users who have voted, not to the general public
- **Poll management** — creators can close a poll to new votes, reset all votes back to zero, or delete their poll entirely
- **Admin controls** — designated admin accounts can delete any poll on the platform
- **Public poll feed** — a homepage listing every live and closed poll, updating live as new polls are created

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | MongoDB with Mongoose |
| Authentication | WebAuthn/FIDO2 via `@simplewebauthn/server` and `@simplewebauthn/browser` |
| Sessions | `iron-session` (encrypted, signed cookies) |
| Real-time updates | Server-Sent Events (SSE) |
| Validation | Zod |
| Styling | Tailwind CSS |
| State management | Zustand |
| Deployment | Vercel |

## How It Works

1. **Register**: a user provides their name and email, then their device generates a passkey (via Windows Hello, Touch ID, Face ID, or a security key) that's registered with the server.
2. **Log in**: instead of a password, the user's device signs a server-issued challenge with their passkey to prove identity.
3. **Create a poll**: a logged-in user submits a question and at least two options.
4. **Vote**: any logged-in user (other than the poll's creator) can vote once on a poll. Their choice is recorded and they can no longer vote again.
5. **Live results**: the poll's creator, or anyone who has voted, sees live vote counts and percentages that update automatically as new votes come in.
6. **Manage**: the creator can close, reset, or delete their poll from a dedicated management dashboard.

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- A browser/device that supports WebAuthn (most modern browsers do)

### Installation

```bash
git clone https://github.com/ARYAN0529/VoteFlow.git
cd VoteFlow
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```dotenv
MONGODB_URI=mongodb://localhost:27017/votify
SESSION_SECRET=<a long random string>
RP_ID=localhost
RP_NAME=Votify
ORIGIN=http://localhost:3000
```

- `MONGODB_URI` — your MongoDB connection string
- `SESSION_SECRET` — used by `iron-session` to encrypt session cookies; generate one with `openssl rand -hex 32` or similar
- `RP_ID` — the domain WebAuthn passkeys are bound to (must exactly match your app's host, without protocol or port)
- `ORIGIN` — the full origin your app runs on (must exactly match, including protocol)

> **Note:** `RP_ID` and `ORIGIN` are cryptographically tied to passkeys. If you deploy to a different domain, passkeys registered under one domain will not work under another — update these values to match your live domain when deploying, and redeploy.

### Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Deployment

This project is deployed on [Vercel](https://vercel.com). To deploy your own instance:

1. Set up a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and allow network access from anywhere (`0.0.0.0/0`)
2. Import this repository into Vercel
3. Set the same environment variables listed above in Vercel's project settings, using your Atlas connection string and your actual deployed domain for `RP_ID`/`ORIGIN`
4. Deploy

Since `RP_ID`/`ORIGIN` depend on knowing your final URL, you may need to deploy once, note the assigned `.vercel.app` domain, update those two environment variables, and redeploy.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # register & login (options/verify) + logout
│   │   └── polls/          # create, vote, close, reset, delete, live results (SSE)
│   ├── polls/
│   │   ├── new/             # poll creation page
│   │   ├── [id]/             # poll view & voting page
│   │   └── manage/          # creator's poll management dashboard
│   ├── login/, register/    # auth pages
│   └── page.tsx              # homepage / public poll feed
├── components/               # shared UI (AppShell, ProfileMenu, MeteorBackground, etc.)
├── lib/                       # database connection, session helper, validation schemas
└── models/                    # Mongoose schemas (User, Poll)
```

## Known Limitations

- Real-time updates use polling-based SSE (checked every 2 seconds), which may see brief reconnects on serverless hosting due to function execution time limits
- Passkeys are tied to the exact origin they were registered under — a passkey created on `localhost` will not work on a deployed domain, and vice versa
- The `voters` list currently only records *who* has voted, not *what* they voted for, so a user cannot yet see their own individual past choice after revisiting a poll

## License

This project was built as a learning/assignment project and is provided as-is.