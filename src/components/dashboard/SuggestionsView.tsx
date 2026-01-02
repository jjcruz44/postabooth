import { useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Image, MessageSquare, RefreshCw, ArrowRight, Loader2, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ContentType } from "@/hooks/useContentsDB";
import { useContentSuggestions, ContentSuggestion } from "@/hooks/useContentSuggestions";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Sugestões da IA</h2>
            <p className="text-sm text-muted-foreground">
              Ideias personalizadas para o seu negócio
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={refreshSuggestions}
          disabled={loading}
          className="gap-2"
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-muted rounded-lg" />
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {suggestions.map((suggestion, index) => {
            const Icon = typeIcons[suggestion.type];
            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleUseSuggestion(suggestion)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {suggestion.title}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {suggestion.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                    {suggestion.type}
                  </span>
                  <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                    {suggestion.objective}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-muted/30 rounded-xl p-12 border border-dashed border-border text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Gere ideias com a IA
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
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
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Dica:</strong> Clique em uma sugestão para ir direto ao Gerador de Posts com a ideia preenchida
          </p>
        </div>
      )}
    </div>
  );
}
