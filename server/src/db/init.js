import pool from "./pool.js";

const schema = `
-- Roles enum
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add reset columns if table already exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auction items
CREATE TABLE IF NOT EXISTS auction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  starting_price NUMERIC NOT NULL,
  current_highest_bid NUMERIC,
  image_url TEXT,
  extra_images TEXT[] DEFAULT '{}',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  original_end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bids
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_item_id UUID NOT NULL REFERENCES auction_items(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_auction_items_updated_at ON auction_items;
CREATE TRIGGER update_auction_items_updated_at
  BEFORE UPDATE ON auction_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: bid extension (anti-snipe) + update highest bid
CREATE OR REPLACE FUNCTION handle_bid_extension()
RETURNS TRIGGER AS $$
DECLARE
  auction_end TIMESTAMPTZ;
  time_remaining INTERVAL;
BEGIN
  SELECT end_time INTO auction_end FROM auction_items WHERE id = NEW.auction_item_id;
  time_remaining := auction_end - NOW();

  IF time_remaining <= INTERVAL '2 minutes' AND time_remaining > INTERVAL '0 seconds' THEN
    UPDATE auction_items SET end_time = end_time + INTERVAL '2 minutes', updated_at = NOW()
    WHERE id = NEW.auction_item_id;
  END IF;

  UPDATE auction_items SET current_highest_bid = NEW.amount, updated_at = NOW()
  WHERE id = NEW.auction_item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_bid_placed ON bids;
CREATE TRIGGER on_bid_placed
  AFTER INSERT ON bids
  FOR EACH ROW EXECUTE FUNCTION handle_bid_extension();

-- Helper function
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role);
$$ LANGUAGE sql STABLE;
`;

async function init() {
  try {
    await pool.query(schema);
    console.log("✅ Database initialized successfully");
  } catch (err) {
    console.error("❌ Database initialization failed:", err.message);
  } finally {
    await pool.end();
  }
}

init();
