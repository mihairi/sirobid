import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AuctionItem } from "@/lib/supabase";
import { AuctionCard } from "@/components/AuctionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
export default function Auctions() {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    fetchAuctions();

    // Subscribe to realtime changes
    const channel = supabase.channel("auction_items_changes").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "auction_items"
    }, () => {
      fetchAuctions();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const fetchAuctions = async () => {
    const {
      data,
      error
    } = await supabase.from("auction_items").select("*").eq("is_active", true).order("end_time", {
      ascending: true
    });
    if (!error && data) {
      setItems(data as AuctionItem[]);
    }
    setIsLoading(false);
  };
  const filteredItems = items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className="container py-8 lg:py-12 bg-[#083891]">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground lg:text-4xl">
            Active Auctions
          </h1>
          <p className="mt-1 text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"} available for bidding
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search auctions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 input-premium" />
        </div>
      </div>

      {isLoading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({
        length: 8
      }).map((_, i) => <div key={i} className="rounded-lg border border-border bg-card">
              <Skeleton className="aspect-[4/3] rounded-t-lg" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>)}
        </div> : filteredItems.length === 0 ? <div className="flex flex-col items-center justify-center py-20 text-center">
          <SlidersHorizontal className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
            No Auctions Found
          </h2>
          <p className="mt-2 text-muted-foreground">
            {searchQuery ? "Try adjusting your search terms" : "Check back soon for new listings"}
          </p>
        </div> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map(item => <AuctionCard key={item.id} item={item} />)}
        </div>}
    </div>;
}