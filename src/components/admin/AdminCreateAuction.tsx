import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ImageIcon } from "lucide-react";
import { z } from "zod";

const auctionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  description: z.string().trim().min(1, "Description is required").max(1000),
  startingPrice: z.number().min(0.01, "Price must be greater than 0"),
  durationHours: z.number().min(1, "Duration must be at least 1 hour").max(720),
});

type AdminCreateAuctionProps = {
  onSuccess: () => void;
};

export function AdminCreateAuction({ onSuccess }: AdminCreateAuctionProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `auction-items/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("auction-images")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("auction-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = auctionSchema.safeParse({
      title,
      description,
      startingPrice: parseFloat(startingPrice),
      durationHours: parseInt(durationHours),
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + parseInt(durationHours) * 60 * 60 * 1000);

      const { error } = await supabase.from("auction_items").insert({
        title,
        description,
        starting_price: parseFloat(startingPrice),
        image_url: imageUrl,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        original_end_time: endTime.toISOString(),
        is_active: true,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Auction Created!",
        description: "Your auction is now live and accepting bids.",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setStartingPrice("");
      setDurationHours("24");
      setImageFile(null);
      setImagePreview(null);

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create auction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-xl font-semibold text-foreground mb-6">
          Create New Auction
        </h2>

        <div className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Item Image</Label>
            <div
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                imagePreview
                  ? "border-gold bg-gold/5"
                  : "border-border hover:border-gold/50"
              }`}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -right-2 -top-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click or drag to upload an image
                  </p>
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vintage Watch Collection"
              className="input-premium"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item in detail..."
              rows={4}
              className="input-premium resize-none"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Starting Price */}
            <div className="space-y-2">
              <Label htmlFor="startingPrice">Starting Price ($)</Label>
              <Input
                id="startingPrice"
                type="number"
                step="0.01"
                min="0.01"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                placeholder="100.00"
                className="input-premium"
                disabled={isSubmitting}
              />
              {errors.startingPrice && (
                <p className="text-sm text-destructive">{errors.startingPrice}</p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="durationHours">Duration (hours)</Label>
              <Input
                id="durationHours"
                type="number"
                min="1"
                max="720"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="24"
                className="input-premium"
                disabled={isSubmitting}
              />
              {errors.durationHours && (
                <p className="text-sm text-destructive">{errors.durationHours}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            size="xl"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Auction...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Create Auction
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
