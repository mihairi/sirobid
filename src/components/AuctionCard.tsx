import { Link } from "react-router-dom";
import { Clock, TrendingUp } from "lucide-react";
import { AuctionItem } from "@/lib/supabase";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCurrency } from "@/lib/format";

type AuctionCardProps = {
  item: AuctionItem;
};

export function AuctionCard({ item }: AuctionCardProps) {
  const { timeLeft, isUrgent, isExpired } = useCountdown(item.end_time);
  const currentPrice = item.current_highest_bid ?? item.starting_price;

  return (
    <Link to={`/auction/${item.id}`} className="block">
      <article className="auction-card group">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <span className="font-display text-4xl text-muted-foreground/30">
                {item.title.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Timer Badge */}
          <div
            className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${
              isExpired
                ? "bg-muted/90 text-muted-foreground"
                : isUrgent
                ? "bg-destructive/90 text-destructive-foreground animate-pulse"
                : "bg-primary/90 text-primary-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {isExpired ? "Ended" : timeLeft}
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1 group-hover:text-gold transition-colors">
            {item.title}
          </h3>
          
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {item.current_highest_bid ? "Current Bid" : "Starting Price"}
              </p>
              <p className="font-display text-xl font-bold text-foreground">
                {formatCurrency(currentPrice)}
              </p>
            </div>

            {item.current_highest_bid && (
              <div className="flex items-center gap-1 text-gold">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Active</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
