import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Video, Image, MessageSquare, Copy, Check, Trash2, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ContentItem, ContentType } from "@/hooks/useContentsDB";

const typeIcons: Record<ContentType, React.ElementType> = {
  reels: Video,
  carrossel: Image,
  stories: MessageSquare,
};

const statusColors: Record<string, string> = {
  ideia: "bg-amber-500/10 text-amber-500",
  producao: "bg-blue-500/10 text-blue-500",
  pronto: "bg-emerald-500/10 text-emerald-500",
  publicado: "bg-primary/10 text-primary",
};

const statusLabels: Record<string, string> = {
  ideia: "Ideia",
  producao: "Produção",
  pronto: "Pronto",
  publicado: "Publicado",
};

interface LibraryViewProps {
  contents: ContentItem[];
  onSelectContent: (content: ContentItem) => void;
  onDeleteContent: (id: string) => void;
}

export function LibraryView({ contents, onSelectContent, onDeleteContent }: LibraryViewProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContentType | "all">("all");

  const filteredContents = filter === "all" 
    ? contents 
    : contents.filter(c => c.type === filter);

  const copyContent = (content: ContentItem) => {
    const text = `📌 ${content.title}\n\n${content.roteiro || ""}\n\n📝 Legenda:\n${content.legenda || ""}\n\n👉 CTA: ${content.cta || ""}\n\n${(content.hashtags || []).map(h => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopiedId(content.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência.",
    });
  };

  if (contents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Biblioteca vazia
        </h3>
        <p className="text-muted-foreground max-w-md">
          Os conteúdos gerados pela IA aparecerão aqui. Use o Gerador para criar seu primeiro conteúdo!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Biblioteca de Conteúdos
          </h2>
          <p className="text-sm text-muted-foreground">
            {contents.length} conteúdo{contents.length !== 1 ? "s" : ""} gerado{contents.length !== 1 ? "s" : ""} pela IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
          {(["reels", "carrossel", "stories"] as ContentType[]).map((type) => {
            const Icon = typeIcons[type];
            return (
              <Button
                key={type}
                variant={filter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(type)}
                className="gap-1"
              >
                <Icon className="w-4 h-4" />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="grid gap-4">
          {filteredContents.map((content, index) => {
            const Icon = typeIcons[content.type];
            return (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl p-5 border border-border hover:shadow-soft transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1 truncate">
                        {content.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                        <span className={`px-2 py-0.5 rounded-full ${statusColors[content.status]}`}>
                          {statusLabels[content.status]}
                        </span>
                        {content.eventType && (
                          <span className="text-muted-foreground">{content.eventType}</span>
                        )}
                        {content.date && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(content.date).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                      {content.legenda && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {content.legenda}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectContent(content)}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyContent(content)}
                    >
                      {copiedId === content.id ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteContent(content.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}
