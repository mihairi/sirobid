import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { AuctionItem } from "@/lib/supabase";
import { BidForm } from "@/components/BidForm";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, TrendingUp, AlertCircle } from "lucide-react";

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [item, setItem] = useState<AuctionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (!id) return;
    const { data, error: fetchError } = await supabase
      .from("auction_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      setError("Failed to load auction item");
    } else if (!data) {
      setError("Auction item not found");
    } else {
      setItem(data as AuctionItem);
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchItem();
    const channel = supabase
      .channel(`auction_item_${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "auction_items", filter: `id=eq.${id}` }, (payload) => {
        setItem(payload.new as AuctionItem);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, fetchItem]);

  const { timeLeft, isUrgent, isExpired } = useCountdown(item?.end_time ?? "");
  const currentPrice = item?.current_highest_bid ?? item?.starting_price ?? 0;
  const minimumBid = currentPrice + 1;

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-6 h-10 w-32" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
            {error || t("detail.itemNotFound")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("detail.notFoundDesc")}
          </p>
          <Link to="/auctions" className="mt-6 inline-block">
            <Button variant="gold">{t("detail.browseAll")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 lg:py-12">
      <Link to="/auctions" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t("detail.backToAuctions")}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative overflow-hidden rounded-xl bg-muted">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <span className="font-display text-8xl text-muted-foreground/30">{item.title.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="font-display text-3xl font-bold text-foreground lg:text-4xl">{item.title}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">{item.description}</p>

          <div className={`mt-6 flex items-center gap-3 rounded-lg border p-4 ${isExpired ? "border-muted bg-muted/50" : isUrgent ? "border-destructive/50 bg-destructive/10" : "border-gold/30 bg-gold/5"}`}>
            <Clock className={`h-5 w-5 ${isExpired ? "text-muted-foreground" : isUrgent ? "text-destructive animate-pulse" : "text-gold"}`} />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {isExpired ? t("detail.auctionEnded") : t("detail.timeRemaining")}
              </p>
              <p className={`font-display text-xl font-bold ${isExpired ? "text-muted-foreground" : isUrgent ? "text-destructive" : "text-foreground"}`}>
                {timeLeft}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {item.current_highest_bid ? t("detail.currentHighestBid") : t("auction.startingPrice")}
                </p>
                <p className="font-display text-3xl font-bold text-foreground">
                  {formatCurrency(currentPrice, settings.currency)}
                </p>
              </div>
              {item.current_highest_bid && (
                <div className="flex items-center gap-1.5 text-gold">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-medium">{t("detail.activeBidding")}</span>
                </div>
              )}
            </div>
            <div className="mt-6 border-t border-border pt-6">
              <BidForm auctionId={item.id} minimumBid={minimumBid} isExpired={isExpired} onBidPlaced={fetchItem} />
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>{t("detail.auctionStarted")}</span>
              <span className="font-medium text-foreground">{formatDate(item.start_time)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("detail.originalEndTime")}</span>
              <span className="font-medium text-foreground">{formatDate(item.original_end_time)}</span>
            </div>
            {item.end_time !== item.original_end_time && (
              <div className="flex justify-between">
                <span>{t("detail.extendedEndTime")}</span>
                <span className="font-medium text-gold">{formatDate(item.end_time)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
