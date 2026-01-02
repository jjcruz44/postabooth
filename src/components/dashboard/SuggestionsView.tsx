import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video, Image, MessageSquare, RefreshCw, ArrowRight, Loader2, Lightbulb, Sparkles, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ContentType } from "@/hooks/useContentsDB";
import { useContentSuggestions, ContentSuggestion } from "@/hooks/useContentSuggestions";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { ShareButton } from "./ShareButton";

const typeIcons: Record<ContentType, React.ElementType> = {
  reels: Video,
  carrossel: Image,
  stories: MessageSquare,
};

interface SuggestionsViewProps {
  onUseSuggestion: (suggestion: ContentSuggestion) => void;
}

export function SuggestionsView({ onUseSuggestion }: SuggestionsViewProps) {
  const { toast } = useToast();
  const { suggestions, loading, fetchSuggestions, refreshSuggestions } = useContentSuggestions();
  const { savePost } = useSavedPosts();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleUseSuggestion = (suggestion: ContentSuggestion) => {
    onUseSuggestion(suggestion);
    toast({
      title: "Sugestão selecionada!",
      description: "Redirecionando para o Gerador de Posts.",
    });
  };

  const handleSaveSuggestion = async (e: React.MouseEvent, suggestion: ContentSuggestion) => {
    e.stopPropagation();
    setSavingId(suggestion.id);

    const result = await savePost({
      source: "sugestoes_ia",
      title: suggestion.title,
      short_caption: suggestion.description,
    });

    if (result) {
      setSavedIds((prev) => new Set([...prev, suggestion.id]));
      toast({
        title: "Sugestão salva!",
        description: "Salva em Posts Avulsos.",
      });
    }

    setSavingId(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-foreground">Sugestões da IA</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Ideias personalizadas para o seu negócio
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={refreshSuggestions}
          disabled={loading}
          className="gap-2 w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Novas ideias
        </Button>
      </div>

      {/* Suggestions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl p-4 md:p-5 border border-border animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {suggestions.map((suggestion, index) => {
            const Icon = typeIcons[suggestion.type];
            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 md:p-5 border border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleUseSuggestion(suggestion)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="font-semibold text-foreground text-sm md:text-base mb-2 line-clamp-2">
                  {suggestion.title}
                </h4>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-3 mb-3">
                  {suggestion.description}
                </p>
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 md:py-1 bg-primary/10 text-primary rounded-full font-medium">
                    {suggestion.type}
                  </span>
                  <span className="text-xs px-2 py-0.5 md:py-1 bg-muted text-muted-foreground rounded-full">
                    {suggestion.objective}
                  </span>
                </div>
                {/* Actions - stack on mobile */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-3 pt-3 border-t border-primary/10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 h-9"
                    onClick={(e) => handleSaveSuggestion(e, suggestion)}
                    disabled={savingId === suggestion.id || savedIds.has(suggestion.id)}
                  >
                    {savingId === suggestion.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : savedIds.has(suggestion.id) ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    {savedIds.has(suggestion.id) ? "Salvo" : "Salvar"}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-1 h-9"
                    onClick={() => handleUseSuggestion(suggestion)}
                  >
                    <Sparkles className="w-3 h-3" />
                    Usar
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-muted/30 rounded-xl p-8 md:p-12 border border-dashed border-border text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-primary" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
            Gere ideias com a IA
          </h3>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-4">
            Clique em "Novas ideias" para gerar sugestões de posts personalizadas para o seu negócio
          </p>
          <Button onClick={refreshSuggestions} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Gerar sugestões
          </Button>
        </div>
      )}

      {/* Usage Tip */}
      {suggestions.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 md:p-4 border border-border">
          <p className="text-xs md:text-sm text-muted-foreground text-center">
            💡 <strong>Dica:</strong> Use "Salvar" para guardar em Posts Avulsos ou "Usar" para ir ao Gerador
          </p>
        </div>
      )}

      {/* Share Button */}
      <div className="flex justify-center pt-2">
        <ShareButton variant="outline" className="gap-2" />
      </div>
    </div>
  );
}
