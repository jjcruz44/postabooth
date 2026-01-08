import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LimitReachedCardProps {
  title: string;
  description: string;
  onUpgrade: () => void;
}

export const LimitReachedCard = ({
  title,
  description,
  onUpgrade,
}: LimitReachedCardProps) => {
  return (
    <div className="border border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/20">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        {description}
      </p>
      <Button onClick={onUpgrade} className="gap-2">
        <Crown className="h-4 w-4" />
        Fazer Upgrade
      </Button>
    </div>
  );
};
