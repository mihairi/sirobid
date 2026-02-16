import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AuctionItem } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSettings } from "@/contexts/SettingsContext";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminEditAuction } from "./AdminEditAuction";

export function AdminAuctionsList() {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAuction, setEditingAuction] = useState<AuctionItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    const { data, error } = await supabase
      .from("auction_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data as AuctionItem[]);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this auction?")) return;

    const { error } = await supabase.from("auction_items").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete auction",
        variant: "destructive",
      });
    } else {
      toast({ title: "Auction deleted successfully" });
      fetchAuctions();
    }
  };

  const handleEdit = (item: AuctionItem) => {
    setEditingAuction(item);
    setEditOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading auctions...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No auctions created yet. Create your first auction to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Starting Price</TableHead>
              <TableHead>Current Bid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <AuctionRow key={item.id} item={item} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </TableBody>
        </Table>
      </div>

      <AdminEditAuction
        auction={editingAuction}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={fetchAuctions}
      />
    </>
  );
}

function AuctionRow({
  item,
  onDelete,
  onEdit,
}: {
  item: AuctionItem;
  onDelete: (id: string) => void;
  onEdit: (item: AuctionItem) => void;
}) {
  const { isExpired } = useCountdown(item.end_time);
  const { settings } = useSettings();

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                {item.title.charAt(0)}
              </span>
            </div>
          )}
          <span className="font-medium">{item.title}</span>
        </div>
      </TableCell>
      <TableCell>{formatCurrency(item.starting_price, settings.currency)}</TableCell>
      <TableCell>
        {item.current_highest_bid
          ? formatCurrency(item.current_highest_bid, settings.currency)
          : "-"}
      </TableCell>
      <TableCell>
        <Badge variant={isExpired ? "secondary" : item.is_active ? "default" : "outline"}>
          {isExpired ? "Ended" : item.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(item.end_time)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Link to={`/auction/${item.id}`}>
            <Button variant="ghost" size="icon">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
