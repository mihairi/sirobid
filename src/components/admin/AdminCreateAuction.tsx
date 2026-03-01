import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { createAuction, uploadAuctionImage } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ImageIcon, Plus, X } from "lucide-react";
import { z } from "zod";

const auctionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  description: z.string().trim().min(1, "Description is required").max(1000),
  startingPrice: z.number().min(0.01, "Price must be greater than 0"),
  startTime: z.string().min(1, "Start date is required"),
  endTime: z.string().min(1, "End date is required"),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: "End date must be after start date",
  path: ["endTime"],
});

type AdminCreateAuctionProps = {
  onSuccess: () => void;
};

export function AdminCreateAuction({ onSuccess }: AdminCreateAuctionProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);
  const [extraImagePreviews, setExtraImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setMainImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleExtraImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setExtraImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setExtraImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-added
    e.target.value = "";
  };

  const removeExtraImage = (index: number) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
    setExtraImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = auctionSchema.safeParse({
      title,
      description,
      startingPrice: parseFloat(startingPrice),
      startTime,
      endTime,
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
      if (mainImage) {
        imageUrl = await uploadAuctionImage(mainImage);
      }

      const extraImageUrls: string[] = [];
      for (const file of extraImages) {
        const url = await uploadAuctionImage(file);
        extraImageUrls.push(url);
      }

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      await createAuction({
        title,
        description,
        starting_price: parseFloat(startingPrice),
        image_url: imageUrl,
        extra_images: extraImageUrls,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        original_end_time: endDate.toISOString(),
        is_active: true,
        created_by: user?.id,
      });

      toast({
        title: t("admin.auctionCreated"),
        description: t("admin.auctionLive"),
      });

      // Reset form
      setTitle("");
      setDescription("");
      setStartingPrice("");
      setStartTime("");
      setEndTime("");
      setMainImage(null);
      setMainImagePreview(null);
      setExtraImages([]);
      setExtraImagePreviews([]);

      onSuccess();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || "Failed to create auction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = settings.currency;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-xl font-semibold text-foreground mb-6">
          {t("admin.createNewAuction")}
        </h2>

        <div className="space-y-6">
          {/* Main Image Upload */}
          <div className="space-y-2">
            <Label>{t("admin.mainImage")}</Label>
            <div
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                mainImagePreview
                  ? "border-gold bg-gold/5"
                  : "border-border hover:border-gold/50"
              }`}
            >
              {mainImagePreview ? (
                <div className="relative">
                  <img
                    src={mainImagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -right-2 -top-2"
                    onClick={() => {
                      setMainImage(null);
                      setMainImagePreview(null);
                    }}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("admin.uploadMainImage")}
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
          </div>

          {/* Extra Images */}
          <div className="space-y-2">
            <Label>{t("admin.additionalImages")}</Label>
            <div className="flex flex-wrap gap-3">
              {extraImagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Extra ${index + 1}`}
                    className="h-20 w-20 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeExtraImage(index)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-gold/50 transition-colors">
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">
                  {t("admin.add")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleExtraImagesChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t("admin.title")}</Label>
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
            <Label htmlFor="description">{t("admin.description")}</Label>
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

          {/* Starting Price */}
          <div className="space-y-2">
            <Label htmlFor="startingPrice">{t("auction.startingPrice")} ({currencySymbol})</Label>
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

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startTime">{t("admin.startDateTime")}</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-premium"
                disabled={isSubmitting}
              />
              {errors.startTime && (
                <p className="text-sm text-destructive">{errors.startTime}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endTime">{t("admin.endDateTime")}</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input-premium"
                disabled={isSubmitting}
              />
              {errors.endTime && (
                <p className="text-sm text-destructive">{errors.endTime}</p>
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
                {t("admin.creatingAuction")}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                {t("admin.createAuction")}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
