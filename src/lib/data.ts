/**
 * Data service layer that switches between Supabase and Express backend.
 * All data operations should go through this module.
 */

import { supabase } from "@/lib/supabase";
import { isSelfHostedFn, api } from "@/lib/api";
import type { AuctionItem, Bid } from "@/lib/supabase";

// ── Auctions ──

export async function fetchActiveAuctions(): Promise<AuctionItem[]> {
  if (isSelfHostedFn()) {
    const data = await api.auctions.list();
    return (data as AuctionItem[]).filter((a) => a.is_active).sort(
      (a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
    );
  }

  const { data, error } = await supabase
    .from("auction_items")
    .select("*")
    .eq("is_active", true)
    .order("end_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AuctionItem[];
}

export async function fetchAllAuctions(): Promise<AuctionItem[]> {
  if (isSelfHostedFn()) {
    const data = await api.auctions.list();
    return (data as AuctionItem[]).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const { data, error } = await supabase
    .from("auction_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AuctionItem[];
}

export async function fetchAuctionById(id: string): Promise<AuctionItem | null> {
  if (isSelfHostedFn()) {
    try {
      return (await api.auctions.get(id)) as AuctionItem;
    } catch {
      return null;
    }
  }

  const { data, error } = await supabase
    .from("auction_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as AuctionItem | null;
}

export async function createAuction(auction: {
  title: string;
  description: string;
  starting_price: number;
  image_url: string | null;
  extra_images: string[];
  start_time: string;
  end_time: string;
  original_end_time: string;
  is_active: boolean;
  created_by: string | undefined;
}): Promise<void> {
  if (isSelfHostedFn()) {
    await api.auctions.create(auction);
    return;
  }

  const { error } = await supabase.from("auction_items").insert(auction);
  if (error) throw error;
}

export async function updateAuction(
  id: string,
  fields: Partial<AuctionItem>
): Promise<void> {
  if (isSelfHostedFn()) {
    await api.auctions.update(id, fields);
    return;
  }

  const { error } = await supabase.from("auction_items").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteAuction(id: string): Promise<void> {
  if (isSelfHostedFn()) {
    await api.auctions.delete(id);
    return;
  }

  const { error } = await supabase.from("auction_items").delete().eq("id", id);
  if (error) throw error;
}

// ── Bids ──

export async function placeBid(auctionId: string, bidderId: string, amount: number): Promise<void> {
  if (isSelfHostedFn()) {
    await api.bids.place(auctionId, amount);
    return;
  }

  const { error } = await supabase.from("bids").insert({
    auction_item_id: auctionId,
    bidder_id: bidderId,
    amount,
  });
  if (error) throw error;
}

export type BidWithDetails = {
  id: string;
  amount: number;
  created_at: string;
  auction_items: { title: string; current_highest_bid: number | null } | null;
  profiles: { email: string } | null;
};

export async function fetchAllBids(): Promise<BidWithDetails[]> {
  if (isSelfHostedFn()) {
    const bids = await api.bids.listAll();
    return bids.map((b: any) => ({
      id: b.id,
      amount: b.amount,
      created_at: b.created_at,
      auction_items: b.auction_title
        ? { title: b.auction_title, current_highest_bid: b.current_highest_bid ?? null }
        : null,
      profiles: b.bidder_email ? { email: b.bidder_email } : null,
    }));
  }

  const { data: bidsData, error } = await supabase
    .from("bids")
    .select(`id, amount, created_at, bidder_id, auction_items (title, current_highest_bid)`)
    .order("created_at", { ascending: false });

  if (error || !bidsData) return [];

  const bidderIds = [...new Set(bidsData.map((b) => b.bidder_id))];
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("user_id, email")
    .in("user_id", bidderIds);
  const profileMap = new Map((profilesData ?? []).map((p) => [p.user_id, p.email]));

  return bidsData.map((b) => ({
    id: b.id,
    amount: b.amount,
    created_at: b.created_at,
    auction_items: b.auction_items as { title: string; current_highest_bid: number | null } | null,
    profiles: profileMap.has(b.bidder_id) ? { email: profileMap.get(b.bidder_id)! } : null,
  }));
}

// ── Image uploads ──

export async function uploadAuctionImage(file: File): Promise<string> {
  if (isSelfHostedFn()) {
    const API_URL = import.meta.env.VITE_API_URL as string;
    const token = localStorage.getItem("auth_token");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `auction-items/${fileName}`;

  const { error } = await supabase.storage.from("auction-images").upload(filePath, file);
  if (error) throw error;

  const { data } = supabase.storage.from("auction-images").getPublicUrl(filePath);
  return data.publicUrl;
}

// ── Realtime subscriptions (Supabase only, polling for self-hosted) ──

export function subscribeToAuctions(callback: () => void) {
  if (isSelfHostedFn()) {
    const interval = setInterval(callback, 10000);
    return () => clearInterval(interval);
  }

  const channel = supabase
    .channel("auction_items_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "auction_items" }, () => callback())
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export function subscribeToAuction(id: string, callback: (updated: AuctionItem) => void) {
  if (isSelfHostedFn()) {
    const interval = setInterval(async () => {
      const item = await fetchAuctionById(id);
      if (item) callback(item);
    }, 10000);
    return () => clearInterval(interval);
  }

  const channel = supabase
    .channel(`auction_item_${id}`)
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "auction_items",
      filter: `id=eq.${id}`,
    }, (payload) => callback(payload.new as AuctionItem))
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export function subscribeToBids(callback: () => void) {
  if (isSelfHostedFn()) {
    const interval = setInterval(callback, 10000);
    return () => clearInterval(interval);
  }

  const channel = supabase
    .channel("admin_bids")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "bids" }, () => callback())
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
