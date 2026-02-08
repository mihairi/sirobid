import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, AppBranding } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Gavel, User, LogOut, Shield, Settings, Crown, Diamond, Star, Hammer } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const iconComponents: Record<AppBranding["icon"], React.ElementType> = {
  gavel: Gavel,
  crown: Crown,
  diamond: Diamond,
  star: Star,
  hammer: Hammer
};
export function Header() {
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  const {
    settings
  } = useSettings();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  const BrandIcon = iconComponents[settings.branding.icon];
  return <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#083891]">
            <BrandIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">
            {settings.branding.name || "EliteAuctions"}
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? <>
              <Link to="/auctions">
                <Button variant="ghost" className="font-medium">
                  Browse Auctions
                </Button>
              </Link>
              
              {isAdmin && <Link to="/admin">
                  <Button variant="outline-gold" size="sm" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {isAdmin ? "Administrator" : "Member"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex cursor-pointer items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </> : <>
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button variant="gold">Join Now</Button>
              </Link>
            </>}
        </nav>
      </div>
    </header>;
}