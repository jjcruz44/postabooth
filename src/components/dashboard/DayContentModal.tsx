import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, Check, Lock, Crown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CalendarDay } from "@/hooks/useCalendarPlanner";

interface DayContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: CalendarDay | null;
}

export function DayContentModal({ open, onOpenChange, day }: DayContentModalProps) {
  const { isPremiumUser } = useAuth();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({ title: "Copiado!" });
    } catch (err) {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  if (!day) return null;

  // For non-premium users, show paywall
  if (!isPremiumUser) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-3 md:p-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm md:text-base shrink-0">
                {day.day}
              </div>
              <div className="min-w-0">
                <span className="text-base md:text-lg line-clamp-1">{day.title || day.idea}</span>
                <p className="text-xs md:text-sm text-muted-foreground font-normal line-clamp-1">
                  {day.weekday} • {day.category}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-3 md:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 md:py-12 text-center"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-warning/10 flex items-center justify-center mb-3 md:mb-4">
                <Lock className="w-8 h-8 md:w-10 md:h-10 text-warning" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                Conteúdo Premium
              </h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-sm mb-4 md:mb-6 px-4">
                Faça upgrade para acessar o conteúdo completo com roteiro e legenda prontos.
              </p>
              <Button className="gap-2 h-10 md:h-11">
                <Crown className="w-4 h-4" />
                Fazer upgrade
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-3 md:p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg gradient-primary flex flex-col items-center justify-center text-primary-foreground shrink-0">
              <span className="text-sm md:text-base font-bold leading-none">{day.day}</span>
              <span className="text-[8px] md:text-[10px] opacity-80">{day.weekday}</span>
            </div>
            <div className="min-w-0">
              <span className="text-base md:text-lg line-clamp-1">{day.title || day.idea}</span>
              <p className="text-xs md:text-sm text-muted-foreground font-normal line-clamp-1">
                {day.category} • {day.objective}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 md:space-y-4"
            >
              {/* Title */}
              <ContentSection
                title="Título"
                content={day.title || day.idea}
                onCopy={() => copyToClipboard(day.title || day.idea, "title")}
                copied={copiedField === "title"}
                variant="default"
              />

              {/* Main Idea */}
              <ContentSection
                title="Ideia Principal"
                content={day.idea}
                onCopy={() => copyToClipboard(day.idea, "idea")}
                copied={copiedField === "idea"}
                variant="default"
              />

              {/* Roteiro */}
              {day.roteiro && (
                <ContentSection
                  title="Roteiro"
                  content={day.roteiro}
                  onCopy={() => copyToClipboard(day.roteiro, "roteiro")}
                  copied={copiedField === "roteiro"}
                  variant="muted"
                />
              )}

              {/* Legenda */}
              {day.legenda && (
                <ContentSection
                  title="Legenda"
                  content={day.legenda}
                  onCopy={() => copyToClipboard(day.legenda, "legenda")}
                  copied={copiedField === "legenda"}
                  variant="highlight"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContentSection({ 
  title, 
  content, 
  onCopy, 
  copied, 
  variant = "default" 
}: { 
  title: string; 
  content: string; 
  onCopy: () => void; 
  copied: boolean;
  variant?: "default" | "muted" | "highlight";
}) {
  const bgClass = variant === "muted" 
    ? "bg-muted/50" 
    : variant === "highlight" 
    ? "bg-primary/5 border-primary/20" 
    : "bg-card";

  return (
    <div className={`p-3 md:p-4 rounded-lg border border-border ${bgClass}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs md:text-sm font-medium text-foreground">{title}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-7 gap-1.5"
        >
          {copied ? (
            <Check className="w-3 h-3 text-success" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          Copiar
        </Button>
      </div>
      <p className="text-xs md:text-sm text-muted-foreground whitespace-pre-wrap break-words">{content}</p>
    </div>
  );
}
