import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, AppBranding } from "@/contexts/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Gavel, User, LogOut, Shield, Settings, Crown, Diamond, Star, Hammer } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConnectionStatus } from "@/components/ConnectionStatus";
const iconComponents: Record<AppBranding["icon"], React.ElementType> = {
  gavel: Gavel,
  crown: Crown,
  diamond: Diamond,
  star: Star,
  hammer: Hammer
};

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const BrandIcon = iconComponents[settings.branding.icon];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#083891]">
            <BrandIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">
            {settings.branding.name || "EliteAuctions"}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ConnectionStatus />
          {user ? (
            <>
              {isAdmin && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin" className="flex items-center gap-1.5">
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">{t("header.admin")}</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/settings" className="flex items-center gap-1.5">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">{t("header.settings")}</span>
                    </Link>
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex items-center gap-1.5">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("header.signOut")}</span>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/login">{t("header.browseAuctions")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );

}