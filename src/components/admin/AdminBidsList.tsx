import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type BidWithDetails = {
  id: string;
  amount: number;
  created_at: string;
  auction_items: {
    title: string;
  } | null;
  profiles: {
    email: string;
  } | null;
};

export function AdminBidsList() {
  const [bids, setBids] = useState<BidWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBids();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("admin_bids")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
        },
        () => {
          fetchBids();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBids = async () => {
    const { data, error } = await supabase
      .from("bids")
      .select(`
        id,
        amount,
        created_at,
        auction_items (title),
        profiles:bidder_id (email)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBids(data as unknown as BidWithDetails[]);
    }
    setIsLoading(false);
  };

  const filteredBids = bids.filter((bid) => {
    const query = searchQuery.toLowerCase();
    return (
      bid.auction_items?.title.toLowerCase().includes(query) ||
      bid.profiles?.email.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading bids...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by item or bidder..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 input-premium"
        />
      </div>

      {filteredBids.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "No bids match your search" : "No bids placed yet"}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Bidder Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Time of Bid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell className="font-medium">
                    {bid.auction_items?.title ?? "Unknown Item"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {bid.profiles?.email ?? "Unknown Bidder"}
                  </TableCell>
                  <TableCell className="font-semibold text-gold">
                    {formatCurrency(bid.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(bid.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
