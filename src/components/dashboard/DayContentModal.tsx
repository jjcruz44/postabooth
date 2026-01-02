import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Loader2, Copy, Check, Lock, Sparkles, 
  RefreshCw, Save, Crown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CalendarDay } from "@/hooks/useCalendarPlanner";

interface DayContent {
  id: string;
  title: string;
  legenda: string | null;
  roteiro: string | null;
  cta: string | null;
  hashtags: string[] | null;
}

interface DayContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: CalendarDay | null;
  isPremium: boolean;
}

const FREE_DAYS_LIMIT = 3;

export function DayContentModal({ open, onOpenChange, day, isPremium }: DayContentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<DayContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isLocked = !isPremium && day && day.day > FREE_DAYS_LIMIT;

  // Load existing content when modal opens
  useEffect(() => {
    if (!open || !day || !user || isLocked) {
      setContent(null);
      return;
    }

    loadContent();
  }, [open, day, user, isLocked]);

  const loadContent = async () => {
    if (!day || !user) return;

    setLoading(true);
    try {
      // Check if content already exists for this day
      const { data, error } = await supabase
        .from("contents")
        .select("id, title, legenda, roteiro, cta, hashtags")
        .eq("user_id", user.id)
        .eq("scheduled_date", getDateForDay(day.day))
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setContent(data as DayContent);
      } else {
        // No content exists, generate it
        await generateContent();
      }
    } catch (err) {
      console.error("Error loading content:", err);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o conteúdo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    if (!day || !user) return;

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão expirada");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            contentType: "reels",
            eventType: day.category,
            objective: day.objective,
            mainIdea: day.idea,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar conteúdo");
      }

      // Save to database
      const scheduledDate = getDateForDay(day.day);
      const { data: savedContent, error: saveError } = await supabase
        .from("contents")
        .insert([{
          user_id: user.id,
          title: data.titulo || day.idea,
          type: "reels",
          event_type: day.category,
          objective: day.objective,
          legenda: data.legenda,
          roteiro: typeof data.roteiro === 'string' ? data.roteiro : JSON.stringify(data.roteiro),
          cta: data.cta,
          hashtags: data.hashtags || [],
          scheduled_date: scheduledDate,
          status: "ideia",
        }])
        .select("id, title, legenda, roteiro, cta, hashtags")
        .single();

      if (saveError) throw saveError;

      setContent(savedContent as DayContent);
      toast({
        title: "Conteúdo gerado!",
        description: "O conteúdo foi criado e salvo automaticamente.",
      });
    } catch (err) {
      console.error("Error generating content:", err);
      toast({
        title: "Erro ao gerar",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getDateForDay = (dayNum: number): string => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), dayNum);
    return date.toISOString().split('T')[0];
  };

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

  const handleRegenerate = async () => {
    if (content) {
      // Delete existing content first
      await supabase.from("contents").delete().eq("id", content.id);
      setContent(null);
    }
    await generateContent();
  };

  if (!day) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold">
              {day.day}
            </div>
            <div>
              <span className="text-lg">{day.idea}</span>
              <p className="text-sm text-muted-foreground font-normal">
                {day.category} • {day.objective}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {isLocked ? (
              <motion.div
                key="paywall"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-4">
                  <Lock className="w-10 h-10 text-warning" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Conteúdo Premium
                </h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  No plano gratuito, você tem acesso aos primeiros 3 dias do calendário. 
                  Faça upgrade para desbloquear todos os 30 dias.
                </p>
                <Button className="gap-2">
                  <Crown className="w-4 h-4" />
                  Fazer upgrade
                </Button>
              </motion.div>
            ) : loading || generating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">
                  {generating ? "Gerando conteúdo com IA..." : "Carregando..."}
                </p>
              </motion.div>
            ) : content ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 py-2"
              >
                {/* Legenda */}
                <ContentSection
                  title="Legenda"
                  content={content.legenda || ""}
                  onCopy={() => copyToClipboard(content.legenda || "", "legenda")}
                  copied={copiedField === "legenda"}
                />

                {/* Roteiro */}
                {content.roteiro && (
                  <ContentSection
                    title="Roteiro"
                    content={content.roteiro}
                    onCopy={() => copyToClipboard(content.roteiro || "", "roteiro")}
                    copied={copiedField === "roteiro"}
                    variant="muted"
                  />
                )}

                {/* CTA */}
                {content.cta && (
                  <ContentSection
                    title="CTA"
                    content={content.cta}
                    onCopy={() => copyToClipboard(content.cta || "", "cta")}
                    copied={copiedField === "cta"}
                    variant="highlight"
                  />
                )}

                {/* Hashtags */}
                {content.hashtags && content.hashtags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground">Hashtags</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(content.hashtags?.join(" ") || "", "hashtags")}
                        className="h-7 gap-1.5"
                      >
                        {copiedField === "hashtags" ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copiar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {content.hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                        >
                          #{tag.replace(/^#/, "")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={generating}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                    Regenerar
                  </Button>
                </div>
              </motion.div>
            ) : null}
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
    <div className={`p-4 rounded-lg border border-border ${bgClass}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
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
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
    </div>
  );
}
