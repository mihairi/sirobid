import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, currencyConfig } from "@/contexts/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Gavel, Loader2 } from "lucide-react";

type BidFormProps = {
  auctionId: string;
  minimumBid: number;
  isExpired: boolean;
  onBidPlaced: () => void;
};

export function BidForm({ auctionId, minimumBid, isExpired, onBidPlaced }: BidFormProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencySymbol = currencyConfig[settings.currency].symbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: t("bid.authRequired"),
        description: t("bid.authRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    const bidAmount = parseFloat(amount);

    if (isNaN(bidAmount) || bidAmount < minimumBid) {
      toast({
        title: t("bid.invalidBid"),
        description: `${t("bid.minimumBid")}: ${formatCurrency(minimumBid, settings.currency)}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("bids").insert({
        auction_item_id: auctionId,
        bidder_id: user.id,
        amount: bidAmount,
      });

      if (error) throw error;

      toast({
        title: t("bid.bidSuccess"),
        description: `${formatCurrency(bidAmount, settings.currency)}`,
      });

      setAmount("");
      onBidPlaced();
    } catch (error: any) {
      toast({
        title: t("bid.bidFailed"),
        description: error.message || "Failed to place bid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isExpired) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="font-medium text-muted-foreground">{t("bid.auctionEnded")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="font-medium text-muted-foreground">{t("bid.signInRequired")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bid-amount" className="text-sm font-medium">
          {t("bid.yourBidAmount")}
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {currencySymbol}
          </span>
          <Input
            id="bid-amount"
            type="number"
            step="0.01"
            min={minimumBid}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={minimumBid.toFixed(2)}
            className="pl-7 input-premium"
            disabled={isSubmitting}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("bid.minimumBid")}: {formatCurrency(minimumBid, settings.currency)}
        </p>
      </div>

      <Button type="submit" variant="gold" size="xl" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t("bid.placingBid")}
          </>
        ) : (
          <>
            <Gavel className="mr-2 h-5 w-5" />
            {t("bid.placeBid")}
          </>
        )}
      </Button>
    </form>
  );
}
