import { useEffect, useState } from "react";
import { isSelfHosted, api } from "@/lib/api";
import { Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Status = "checking" | "connected" | "disconnected";

export function ConnectionStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    if (!isSelfHosted) return;

    const check = async () => {
      const ok = await api.health.check();
      setStatus(ok ? "connected" : "disconnected");
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!isSelfHosted) return null;

  const config: Record<Status, { icon: typeof Wifi; label: string; color: string; pulse: boolean }> = {
    checking: { icon: Wifi, label: "Checking backend…", color: "text-muted-foreground", pulse: true },
    connected: { icon: Wifi, label: "Backend connected", color: "text-emerald-500", pulse: false },
    disconnected: { icon: WifiOff, label: "Backend unreachable", color: "text-destructive", pulse: false },
  };

  const { icon: Icon, label, color, pulse } = config[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${color} transition-colors`}>
          <span className="relative flex h-2 w-2">
            {pulse && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${
              status === "connected" ? "bg-emerald-500" : status === "disconnected" ? "bg-destructive" : "bg-muted-foreground"
            }`} />
          </span>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
        {status === "disconnected" && (
          <p className="text-xs text-muted-foreground mt-1">
            Start your Express server on {import.meta.env.VITE_API_URL}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
