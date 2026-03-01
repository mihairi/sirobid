# SiroBid — Self-Hosted Backend

Express.js backend with PostgreSQL for running SiroBid independently.

## Quick Start

```bash
cd server
cp .env.example .env        # Edit with your PostgreSQL credentials
npm install
npm run db:init              # Creates tables, triggers, functions
npm run dev                  # Starts server on :3001
```

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14

Create the database first:
```sql
CREATE DATABASE sirobid;
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `sirobid` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | — | Database password |
| `JWT_SECRET` | — | Secret key for signing JWTs (change this!) |
| `JWT_EXPIRES_IN` | `7d` | Token expiration duration |
| `PORT` | `3001` | Server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend origin for CORS |
| `UPLOAD_DIR` | `./uploads` | Directory for uploaded images |

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | — | Register `{ email, password }` |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | Bearer | Current user + roles |

### Auctions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auctions` | — | List all auctions |
| GET | `/auctions/:id` | — | Single auction |
| POST | `/auctions` | Admin | Create auction |
| PUT | `/auctions/:id` | Admin | Update auction |
| DELETE | `/auctions/:id` | Admin | Delete auction |

### Bids
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/bids` | Bearer | Place bid `{ auction_item_id, amount }` |
| GET | `/bids/auction/:id` | Bearer | Bids for auction (own or all if admin) |
| GET | `/bids/admin` | Admin | All bids |

### File Upload
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload` | Bearer | Upload image (multipart, field: `file`) |

The upload endpoint accepts JPEG, PNG, GIF, WebP, and SVG files up to 10 MB. It returns `{ url: "http://host/uploads/filename.ext" }`. Uploaded files are served statically from the `/uploads` path.

## Frontend Setup for Self-Hosting

### 1. Set the API URL

Add this to your frontend `.env` file (next to `package.json`, **not** inside `server/`):

```env
VITE_API_URL=http://localhost:3001
```

When `VITE_API_URL` is set, the frontend automatically switches from Lovable Cloud to your Express backend for all auth, data, and file upload operations.

### 2. Start both servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:3001`.

### 3. How it works

The frontend has a data service layer (`src/lib/data.ts`) and auth context (`src/contexts/AuthContext.tsx`) that detect `VITE_API_URL` and route requests accordingly:

| Feature | Lovable Cloud | Self-Hosted |
|---------|--------------|-------------|
| Authentication | Supabase Auth | JWT via `/auth/*` |
| Data fetching | Supabase client | REST API via `/auctions`, `/bids` |
| Image uploads | Supabase Storage | `POST /upload` (multipart) |
| Realtime updates | Supabase Realtime | 10-second polling fallback |

No code changes are needed — just set the environment variable.

## Making a User Admin

```sql
UPDATE user_roles SET role = 'admin' WHERE user_id = '<user-uuid>';
```

## Production Deployment

1. Set `NODE_ENV=production` and a strong `JWT_SECRET`
2. Set `CORS_ORIGIN` to your frontend's production URL
3. Use a persistent `UPLOAD_DIR` path (or migrate to S3/cloud storage)
4. Set `VITE_API_URL` to your backend's public URL when building the frontend
5. Run `npm start` (or use PM2/Docker for process management)
