import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { AuctionItem } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AdminEditAuctionProps = {
  auction: AuctionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function AdminEditAuction({ auction, open, onOpenChange, onSuccess }: AdminEditAuctionProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (auction) {
      setTitle(auction.title);
      setDescription(auction.description);
      setStartingPrice(String(auction.starting_price));
      setEndTime(new Date(auction.end_time).toISOString().slice(0, 16));
      setIsActive(auction.is_active);
      setImagePreview(auction.image_url);
      setImageFile(null);
    }
  }, [auction]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `auction-items/${fileName}`;

    const { error } = await supabase.storage
      .from("auction-images")
      .upload(filePath, file);
    if (error) throw error;

    const { data } = supabase.storage.from("auction-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction) return;

    if (!title.trim() || !description.trim()) {
      toast({ title: "Title and description are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = auction.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from("auction_items")
        .update({
          title: title.trim(),
          description: description.trim(),
          starting_price: parseFloat(startingPrice),
          end_time: new Date(endTime).toISOString(),
          is_active: isActive,
          image_url: imageUrl,
        })
        .eq("id", auction.id);

      if (error) throw error;

      toast({ title: "Auction updated successfully" });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update auction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Auction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image */}
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-4 hover:border-primary/50 transition-colors">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -right-2 -top-2 h-6 w-6 p-0"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">Click to upload</p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className="input-premium" disabled={isSubmitting} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-premium resize-none" disabled={isSubmitting} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Starting Price</Label>
              <Input id="edit-price" type="number" step="0.01" min="0.01" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} className="input-premium" disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">End Time</Label>
              <Input id="edit-end" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-premium" disabled={isSubmitting} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="edit-active">Active</Label>
          </div>

          <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />Save Changes</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
