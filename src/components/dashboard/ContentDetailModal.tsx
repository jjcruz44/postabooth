import { motion, AnimatePresence } from "framer-motion";
import { X, Video, Image, MessageSquare, Target, Calendar, Copy, Check, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentItem, ContentStatus, ContentType } from "@/hooks/useContents";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const typeIcons: Record<ContentType, React.ElementType> = {
  reels: Video,
  carrossel: Image,
  stories: MessageSquare,
};

const statusColors: Record<ContentStatus, string> = {
  ideia: "bg-muted text-muted-foreground",
  producao: "bg-warning/10 text-warning",
  pronto: "bg-info/10 text-info",
  publicado: "bg-success/10 text-success",
};

const statusLabels: Record<ContentStatus, string> = {
  ideia: "Ideia",
  producao: "Em produção",
  pronto: "Pronto",
  publicado: "Publicado",
};

interface ContentDetailModalProps {
  content: ContentItem | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ContentStatus) => void;
}

export function ContentDetailModal({ content, onClose, onUpdateStatus }: ContentDetailModalProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!content) return null;

  const TypeIcon = typeIcons[content.type];

  const copyToClipboard = async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copiado!",
      description: `${fieldName} copiado para a área de transferência.`,
    });
  };

  const statuses: ContentStatus[] = ["ideia", "producao", "pronto", "publicado"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TypeIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-lg">{content.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span className="capitalize">{content.type}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {content.objective}
                  </span>
                  <span>•</span>
                  <span>{content.eventType}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Status selector */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => onUpdateStatus(content.id, status)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      content.status === status
                        ? statusColors[status]
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Data programada:</span>
              <span className="font-medium text-foreground">
                {new Date(content.date).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>

            {/* Roteiro */}
            {content.roteiro && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    Roteiro
                  </span>
                  <button
                    onClick={() => copyToClipboard(content.roteiro!, "Roteiro")}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    {copiedField === "Roteiro" ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
                  {content.roteiro}
                </div>
              </div>
            )}

            {/* Legenda */}
            {content.legenda && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    Legenda
                  </span>
                  <button
                    onClick={() => copyToClipboard(content.legenda!, "Legenda")}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    {copiedField === "Legenda" ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
                  {content.legenda}
                </div>
              </div>
            )}

            {/* CTA */}
            {content.cta && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    CTA
                  </span>
                  <button
                    onClick={() => copyToClipboard(content.cta!, "CTA")}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    {copiedField === "CTA" ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-sm font-medium text-primary">{content.cta}</p>
              </div>
            )}

            {/* Hashtags */}
            {content.hashtags && content.hashtags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    Hashtags
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(content.hashtags!.map((h) => `#${h}`).join(" "), "Hashtags")
                    }
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    {copiedField === "Hashtags" ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {content.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for content without details */}
            {!content.roteiro && !content.legenda && !content.cta && (
              <div className="bg-muted/30 rounded-xl p-6 text-center border border-dashed border-border">
                <p className="text-muted-foreground">
                  Este conteúdo ainda não tem roteiro, legenda ou CTA.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use o Gerador de Conteúdo para criar automaticamente.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
