import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Download } from "lucide-react";

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
  const { settings } = useSettings();
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
    // Fetch bids with auction item titles
    const { data: bidsData, error: bidsError } = await supabase
      .from("bids")
      .select(`
        id,
        amount,
        created_at,
        bidder_id,
        auction_items (title)
      `)
      .order("created_at", { ascending: false });

    if (bidsError || !bidsData) {
      setIsLoading(false);
      return;
    }

    // Fetch profiles for all unique bidder_ids
    const bidderIds = [...new Set(bidsData.map((b) => b.bidder_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, email")
      .in("user_id", bidderIds);

    const profileMap = new Map(
      (profilesData ?? []).map((p) => [p.user_id, p.email])
    );

    const merged: BidWithDetails[] = bidsData.map((b) => ({
      id: b.id,
      amount: b.amount,
      created_at: b.created_at,
      auction_items: b.auction_items as { title: string } | null,
      profiles: profileMap.has(b.bidder_id)
        ? { email: profileMap.get(b.bidder_id)! }
        : null,
    }));

    setBids(merged);
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

  const buildRows = (data: BidWithDetails[]) =>
    data.map((bid) => ({
      item: bid.auction_items?.title ?? "Unknown Item",
      email: bid.profiles?.email ?? "Unknown Bidder",
      amount: bid.amount,
      time: bid.created_at,
    }));

  const exportCSV = () => {
    const rows = buildRows(filteredBids);
    const header = "Item Name,Bidder Email,Amount,Time of Bid";
    const csv = [header, ...rows.map((r) =>
      `"${r.item}","${r.email}",${r.amount},"${formatDate(r.time)}"`
    )].join("\n");
    downloadFile(csv, "bids.csv", "text/csv");
  };

  const exportExcel = () => {
    const rows = buildRows(filteredBids);
    const header = "<tr><th>Item Name</th><th>Bidder Email</th><th>Amount</th><th>Time of Bid</th></tr>";
    const body = rows.map((r) =>
      `<tr><td>${r.item}</td><td>${r.email}</td><td>${r.amount}</td><td>${formatDate(r.time)}</td></tr>`
    ).join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:spreadsheet"><head><meta charset="UTF-8"></head><body><table>${header}${body}</table></body></html>`;
    downloadFile(html, "bids.xls", "application/vnd.ms-excel");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
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
        {filteredBids.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportCSV}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={exportExcel}>Export as Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
                    {formatCurrency(bid.amount, settings.currency)}
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
