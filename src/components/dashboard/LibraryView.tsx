import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Video, Image, MessageSquare, Copy, Check, Trash2, Eye, Calendar, Sparkles, Lightbulb, RefreshCw, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ContentItem, ContentType } from "@/hooks/useContentsDB";
import { useContentSuggestions, ContentSuggestion } from "@/hooks/useContentSuggestions";

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
  onUseSuggestion?: (suggestion: ContentSuggestion) => void;
}

export function LibraryView({ contents, onSelectContent, onDeleteContent, onUseSuggestion }: LibraryViewProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContentType | "all">("all");
  const { suggestions, loading: suggestionsLoading, fetchSuggestions, refreshSuggestions } = useContentSuggestions();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

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

  const handleUseSuggestion = (suggestion: ContentSuggestion) => {
    if (onUseSuggestion) {
      onUseSuggestion(suggestion);
    }
    toast({
      title: "Sugestão selecionada!",
      description: "Vá para o Gerador para criar este conteúdo.",
    });
  };

  return (
    <div className="space-y-8">
      {/* AI Suggestions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Sugestões da IA</h3>
              <p className="text-xs text-muted-foreground">Ideias personalizadas para sua marca</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSuggestions}
            disabled={suggestionsLoading}
            className="gap-1"
          >
            {suggestionsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Novas ideias
          </Button>
        </div>

        {suggestionsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-full mb-1" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {suggestions.map((suggestion, index) => {
              const Icon = typeIcons[suggestion.type];
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
                  onClick={() => handleUseSuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="font-medium text-foreground text-sm mb-1 line-clamp-2">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                      {suggestion.type}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                      {suggestion.objective}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-xl p-6 border border-dashed border-border text-center">
            <Lightbulb className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Clique em "Novas ideias" para gerar sugestões personalizadas
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Created Posts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Seus Conteúdos
            </h2>
            <p className="text-sm text-muted-foreground">
              {contents.length} conteúdo{contents.length !== 1 ? "s" : ""} criado{contents.length !== 1 ? "s" : ""}
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

        {contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum conteúdo criado ainda
            </h3>
            <p className="text-muted-foreground max-w-md">
              Use o Gerador para criar seu primeiro conteúdo ou clique em uma sugestão da IA acima!
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
