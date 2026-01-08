import { Crown, AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccessPhase } from "@/hooks/useAccessPhase";

interface AccessPhaseBannerProps {
  onUpgrade?: () => void;
}

export const AccessPhaseBanner = ({ onUpgrade }: AccessPhaseBannerProps) => {
  const { phase, message, isPro } = useAccessPhase();
  const [dismissed, setDismissed] = useState(false);

  // Don't show for Pro users or if dismissed or if no message
  if (isPro || dismissed || !message) {
    return null;
  }

  const isWarning = phase === "warning";

  return (
    <div
      className={`relative px-4 py-3 rounded-lg mb-4 flex items-center justify-between gap-3 ${
        isWarning
          ? "bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300"
          : "bg-primary/10 border border-primary/30 text-primary"
      }`}
    >
      <div className="flex items-center gap-3">
        {isWarning ? (
          <AlertTriangle className="h-5 w-5 shrink-0" />
        ) : (
          <Crown className="h-5 w-5 shrink-0" />
        )}
        <p className="text-sm font-medium">{message}</p>
      </div>
      <div className="flex items-center gap-2">
        {isWarning && onUpgrade && (
          <Button
            size="sm"
            variant="default"
            onClick={onUpgrade}
            className="shrink-0"
          >
            Fazer Upgrade
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
