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

## Frontend Migration

After cloning, update the frontend to point at this backend:

1. Replace `VITE_SUPABASE_URL` with `VITE_API_URL=http://localhost:3001`
2. Replace `supabase.from("table")` calls with `fetch("/auctions")` etc.
3. Replace `supabase.auth` with JWT-based auth calls to `/auth/*`
4. Replace `supabase.storage` uploads with `multipart/form-data` POST to a `/upload` endpoint

## Making a User Admin

```sql
UPDATE user_roles SET role = 'admin' WHERE user_id = '<user-uuid>';
```
