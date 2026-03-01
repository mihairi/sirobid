import { useEffect, useState } from "react";
import { fetchAllBids, subscribeToBids, type BidWithDetails } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Download } from "lucide-react";

export function AdminBidsList() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [bids, setBids] = useState<BidWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadBids = async () => {
    const data = await fetchAllBids();
    setBids(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadBids();
    const unsubscribe = subscribeToBids(loadBids);
    return unsubscribe;
  }, []);

  const filteredBids = bids.filter((bid) => {
    const query = searchQuery.toLowerCase();
    return bid.auction_items?.title.toLowerCase().includes(query) || bid.profiles?.email.toLowerCase().includes(query);
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">{t("admin.loadingBids")}</div>;

  const buildRows = (data: BidWithDetails[]) =>
    data.map((bid) => ({
      item: bid.auction_items?.title ?? t("admin.unknownItem"),
      email: bid.profiles?.email ?? t("admin.unknownBidder"),
      amount: bid.amount,
      highestBid: bid.auction_items?.current_highest_bid ?? 0,
      time: bid.created_at,
    }));

  const exportCSV = () => {
    const rows = buildRows(filteredBids);
    const header = "Item Name,Bidder Email,Amount,Highest Bid,Time of Bid";
    const csv = [header, ...rows.map((r) => `"${r.item}","${r.email}",${r.amount},${r.highestBid},"${formatDate(r.time)}"`)].join("\n");
    downloadFile(csv, "bids.csv", "text/csv");
  };

  const exportExcel = () => {
    const rows = buildRows(filteredBids);
    const header = "<tr><th>Item Name</th><th>Bidder Email</th><th>Amount</th><th>Highest Bid</th><th>Time of Bid</th></tr>";
    const body = rows.map((r) => `<tr><td>${r.item}</td><td>${r.email}</td><td>${r.amount}</td><td>${r.highestBid}</td><td>${formatDate(r.time)}</td></tr>`).join("");
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
          <Input type="search" placeholder={t("admin.searchBids")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 input-premium" />
        </div>
        {filteredBids.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                {t("admin.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportCSV}>{t("admin.exportCSV")}</DropdownMenuItem>
              <DropdownMenuItem onClick={exportExcel}>{t("admin.exportExcel")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {filteredBids.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? t("admin.noBidsMatch") : t("admin.noBidsYet")}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.itemName")}</TableHead>
                <TableHead>{t("admin.bidderEmail")}</TableHead>
                <TableHead>{t("admin.amount")}</TableHead>
                <TableHead>{t("admin.highestBid")}</TableHead>
                <TableHead>{t("admin.timeOfBid")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell className="font-medium">{bid.auction_items?.title ?? t("admin.unknownItem")}</TableCell>
                  <TableCell className="text-muted-foreground">{bid.profiles?.email ?? t("admin.unknownBidder")}</TableCell>
                  <TableCell className="font-semibold text-gold">{formatCurrency(bid.amount, settings.currency)}</TableCell>
                  <TableCell className="font-semibold">{bid.auction_items?.current_highest_bid ? formatCurrency(bid.auction_items.current_highest_bid, settings.currency) : "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(bid.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
