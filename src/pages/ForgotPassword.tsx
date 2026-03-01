import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Gavel, Loader2, ArrowLeft, Mail } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { isSelfHosted, api } from "@/lib/api";

const emailSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      const fieldErrors: { email?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (isSelfHosted) {
        await api.auth.forgotPassword(email);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      }

      setIsSent(true);
      toast({
        title: t("forgot.emailSent"),
        description: t("forgot.checkInbox"),
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("common.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Gavel className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground">
            {t("forgot.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("forgot.description")}
          </p>
        </div>

        {isSent ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
              <Mail className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{t("forgot.emailSent")}</h2>
              <p className="mt-2 text-muted-foreground">{t("forgot.checkInbox")}</p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("forgot.backToLogin")}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.emailAddress")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-premium"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gold"
              size="xl"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("forgot.sending")}
                </>
              ) : (
                t("forgot.sendResetLink")
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-gold hover:underline">
                <ArrowLeft className="mr-1 inline h-3 w-3" />
                {t("forgot.backToLogin")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
