import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type AuctionItem = {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_highest_bid: number | null;
  image_url: string | null;
  start_time: string;
  end_time: string;
  original_end_time: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Bid = {
  id: string;
  auction_item_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
};
