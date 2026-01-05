import { motion, AnimatePresence } from "framer-motion";
import { X, Video, Image, MessageSquare, Target, Calendar, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentItem, ContentStatus, ContentType } from "@/hooks/useContentsDB";
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
  nao_publicado: "bg-muted text-muted-foreground",
  ignorado: "bg-muted/50 text-muted-foreground opacity-60",
};

const statusLabels: Record<ContentStatus, string> = {
  ideia: "Ideia",
  producao: "Em produção",
  pronto: "Pronto",
  publicado: "Publicado",
  nao_publicado: "Não Publicado",
  ignorado: "Ignorado",
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
        className="fixed inset-0 bg-foreground/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag indicator */}
          <div className="sm:hidden flex justify-center py-2">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="p-3 md:p-4 border-b border-border flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <TypeIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground text-base md:text-lg line-clamp-2">{content.title}</h2>
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground mt-1 flex-wrap">
                  <span className="capitalize">{content.type}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {content.objective}
                  </span>
                  {content.eventType && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{content.eventType}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 md:p-4 space-y-4 md:space-y-6 flex-1 overflow-y-auto">
            {/* Status selector */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 md:mb-3 block">
                Status
              </label>
              <div className="flex gap-1.5 md:gap-2 flex-wrap">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => onUpdateStatus(content.id, status)}
                    className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
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
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Data programada:</span>
              <span className="font-medium text-foreground">
                {new Date(content.date).toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
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
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                  >
                    {copiedField === "Roteiro" ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 md:p-3 text-xs md:text-sm text-foreground whitespace-pre-wrap break-words">
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
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                  >
                    {copiedField === "Legenda" ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 md:p-3 text-xs md:text-sm text-foreground whitespace-pre-wrap break-words">
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
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                  >
                    {copiedField === "CTA" ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-xs md:text-sm font-medium text-primary break-words">{content.cta}</p>
              </div>
            )}

            {/* Empty state for content without details */}
            {!content.roteiro && !content.legenda && !content.cta && (
              <div className="bg-muted/30 rounded-xl p-4 md:p-6 text-center border border-dashed border-border">
                <p className="text-sm text-muted-foreground">
                  Este conteúdo ainda não tem roteiro, legenda ou CTA.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use o Gerador de Conteúdo para criar automaticamente.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 md:p-4 border-t border-border">
            <Button variant="outline" className="w-full h-10 md:h-11" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
