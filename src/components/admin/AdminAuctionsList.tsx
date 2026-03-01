import { useEffect, useState } from "react";
import { fetchAllAuctions, deleteAuction } from "@/lib/data";
import type { AuctionItem } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
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
  const { t } = useTranslation();

  useEffect(() => { loadAuctions(); }, []);

  const loadAuctions = async () => {
    try {
      const data = await fetchAllAuctions();
      setItems(data);
    } catch {}
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.deleteConfirm"))) return;
    try {
      await deleteAuction(id);
      toast({ title: t("admin.auctionDeleted") });
      loadAuctions();
    } catch {
      toast({ title: t("common.error"), description: t("admin.deleteError"), variant: "destructive" });
    }
  };

  const handleEdit = (item: AuctionItem) => { setEditingAuction(item); setEditOpen(true); };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">{t("admin.loadingAuctions")}</div>;
  if (items.length === 0) return <div className="text-center py-12 text-muted-foreground">{t("admin.noAuctions")}</div>;

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.item")}</TableHead>
              <TableHead>{t("auction.startingPrice")}</TableHead>
              <TableHead>{t("admin.currentBid")}</TableHead>
              <TableHead>{t("admin.status")}</TableHead>
              <TableHead>{t("admin.endTime")}</TableHead>
              <TableHead className="text-right">{t("admin.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <AuctionRow key={item.id} item={item} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </TableBody>
        </Table>
      </div>
      <AdminEditAuction auction={editingAuction} open={editOpen} onOpenChange={setEditOpen} onSuccess={loadAuctions} />
    </>
  );
}

function AuctionRow({ item, onDelete, onEdit }: { item: AuctionItem; onDelete: (id: string) => void; onEdit: (item: AuctionItem) => void }) {
  const { isExpired } = useCountdown(item.end_time);
  const { settings } = useSettings();
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">{item.title.charAt(0)}</span>
            </div>
          )}
          <span className="font-medium">{item.title}</span>
        </div>
      </TableCell>
      <TableCell>{formatCurrency(item.starting_price, settings.currency)}</TableCell>
      <TableCell>{item.current_highest_bid ? formatCurrency(item.current_highest_bid, settings.currency) : "-"}</TableCell>
      <TableCell>
        <Badge variant={isExpired ? "secondary" : item.is_active ? "default" : "outline"}>
          {isExpired ? t("auction.ended") : item.is_active ? t("auction.active") : t("admin.inactive")}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatDate(item.end_time)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
          <Link to={`/auction/${item.id}`}><Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button></Link>
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
