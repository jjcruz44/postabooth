import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Video, Image, MessageSquare, Loader2, Copy, Check, X, Lightbulb, Save, CalendarIcon, AlertCircle, RefreshCw, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContentType } from "@/hooks/useContentsDB";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useContentSuggestions, ContentSuggestion } from "@/hooks/useContentSuggestions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface GeneratedContent {
  titulo: string;
  ideia: string;
  roteiro: string;
  legenda: string;
}

const contentTypes = [
  { id: "reels" as const, label: "Reels", icon: Video },
  { id: "carrossel" as const, label: "Carrossel", icon: Image },
  { id: "stories" as const, label: "Stories", icon: MessageSquare },
];

const eventTypes = ["Casamento", "Corporativo", "15 Anos", "Infantil", "Formatura"];
const objectives = ["Atração", "Autoridade", "Prova Social", "Venda"];

interface GeneratorViewProps {
  onSaveContent: (content: {
    title: string;
    type: ContentType;
    objective: string;
    eventType: string;
    roteiro: string;
    legenda: string;
    cta: string;
    hashtags: string[];
    date: string;
  }) => void;
  initialSuggestion?: {
    title: string;
    description: string;
    type: ContentType;
    eventType: string;
    objective: string;
  } | null;
  onSuggestionUsed?: () => void;
}

export function GeneratorView({ onSaveContent, initialSuggestion, onSuggestionUsed }: GeneratorViewProps) {
  const { toast } = useToast();
  const { session, loading: authLoading } = useAuth();
  const { savePost } = useSavedPosts();
  const { suggestions, loading: suggestionsLoading, fetchSuggestions, refreshSuggestions } = useContentSuggestions();
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("reels");
  const [selectedEventType, setSelectedEventType] = useState("Casamento");
  const [selectedObjective, setSelectedObjective] = useState("Autoridade");
  const [mainIdea, setMainIdea] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [savedSuggestionIds, setSavedSuggestionIds] = useState<Set<string>>(new Set());
  const [savingSuggestionId, setSavingSuggestionId] = useState<string | null>(null);

  // Check if session is ready for API calls
  const isSessionReady = !authLoading && session !== null && !!session.access_token;

  // Fetch suggestions on mount
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Apply suggestion when it changes
  useEffect(() => {
    if (initialSuggestion) {
      setSelectedContentType(initialSuggestion.type || "reels");
      setSelectedEventType(initialSuggestion.eventType || "Casamento");
      setSelectedObjective(initialSuggestion.objective || "Autoridade");
      setMainIdea(initialSuggestion.description || "");
      onSuggestionUsed?.();
    }
  }, [initialSuggestion, onSuggestionUsed]);

  const handleUseSuggestion = (suggestion: ContentSuggestion) => {
    setSelectedContentType(suggestion.type || "reels");
    setSelectedEventType(suggestion.eventType || "Casamento");
    setSelectedObjective(suggestion.objective || "Autoridade");
    setMainIdea(suggestion.description || "");
    toast({
      title: "Sugestão aplicada!",
      description: "Os campos foram preenchidos com a ideia selecionada.",
    });
  };

  const handleSaveSuggestion = async (e: React.MouseEvent, suggestion: ContentSuggestion) => {
    e.stopPropagation();
    setSavingSuggestionId(suggestion.id);

    const result = await savePost({
      source: "sugestoes_ia",
      title: suggestion.title,
      short_caption: suggestion.description,
    });

    if (result) {
      setSavedSuggestionIds((prev) => new Set([...prev, suggestion.id]));
      toast({
        title: "Sugestão salva!",
        description: "Salva em Posts Avulsos.",
      });
    }

    setSavingSuggestionId(null);
  };

  const handleGenerate = async () => {
    // Guard: Block if session is not ready
    if (!isSessionReady || !session) {
      toast({
        title: "Aguarde",
        description: "Verificando sua sessão. Tente novamente em alguns segundos.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      // Use the session from AuthContext (already verified)
      const accessToken = session.access_token;

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          contentType: selectedContentType,
          eventType: selectedEventType,
          objective: selectedObjective,
          mainIdea: mainIdea.trim() || undefined,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        // Handle specific auth errors
        if (error.message?.includes("401") || error.message?.includes("JWT") || error.message?.includes("Unauthorized")) {
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            toast({
              title: "Sessão expirada",
              description: "Por favor, faça login novamente.",
              variant: "destructive",
            });
            return;
          }
          
          // Retry with new token
          const { data: retryData, error: retryError } = await supabase.functions.invoke("generate-content", {
            body: {
              contentType: selectedContentType,
              eventType: selectedEventType,
              objective: selectedObjective,
              mainIdea: mainIdea.trim() || undefined,
            },
            headers: {
              Authorization: `Bearer ${refreshData.session.access_token}`,
            },
          });
          
          if (retryError) throw retryError;
          setGeneratedContent(retryData);
          toast({
            title: "Conteúdo gerado!",
            description: "Seu conteúdo foi criado com sucesso.",
          });
          return;
        }
        throw error;
      }

      setGeneratedContent(data);
      toast({
        title: "Conteúdo gerado!",
        description: "Seu conteúdo foi criado com sucesso.",
      });
    } catch (error: unknown) {
      console.error("Error generating content:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao gerar conteúdo. Tente novamente.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copiado!",
      description: `${fieldName} copiado para a área de transferência.`,
    });
  };

  const handleSave = async () => {
    if (!generatedContent) return;

    // Save to saved_posts table
    const savedPost = await savePost({
      source: "gerador",
      title: generatedContent.titulo,
      short_caption: generatedContent.legenda,
      expanded_text: generatedContent.roteiro,
    });

    if (savedPost) {
      // Also save to contents if date is selected (for calendar view)
      if (selectedDate) {
        onSaveContent({
          title: generatedContent.titulo,
          type: selectedContentType,
          objective: selectedObjective,
          eventType: selectedEventType,
          roteiro: generatedContent.roteiro,
          legenda: generatedContent.legenda,
          cta: "",
          hashtags: [],
          date: selectedDate.toISOString().split("T")[0],
        });
      }

      toast({
        title: "Conteúdo salvo!",
        description: "Salvo em Posts Avulsos.",
      });

      setGeneratedContent(null);
    }
  };

  const typeIcons: Record<ContentType, React.ElementType> = {
    reels: Video,
    carrossel: Image,
    stories: MessageSquare,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Quick Suggestions Section */}
      <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-foreground">Sugestões rápidas da IA</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Ideias prontas para você usar
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSuggestions}
            disabled={suggestionsLoading}
            className="gap-2 w-full sm:w-auto"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-muted rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.slice(0, 6).map((suggestion, index) => {
              const Icon = typeIcons[suggestion.type];
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => handleUseSuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1.5 line-clamp-2">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                      {suggestion.type}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                      {suggestion.objective}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 h-7 text-xs"
                      onClick={(e) => handleSaveSuggestion(e, suggestion)}
                      disabled={savingSuggestionId === suggestion.id || savedSuggestionIds.has(suggestion.id)}
                    >
                      {savingSuggestionId === suggestion.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : savedSuggestionIds.has(suggestion.id) ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      {savedSuggestionIds.has(suggestion.id) ? "Salvo" : "Salvar"}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 gap-1 h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseSuggestion(suggestion);
                      }}
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
          <div className="bg-muted/30 rounded-lg p-6 border border-dashed border-border text-center">
            <Sparkles className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Clique em "Novas ideias" para gerar sugestões
            </p>
            <Button variant="outline" size="sm" onClick={refreshSuggestions} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Gerar sugestões
            </Button>
          </div>
        )}
      </div>

      {/* Generator Section */}
      <div className="text-center">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 md:mb-4">
          <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          Criar post agora
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Gere roteiros e legendas prontos para usar
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Form */}
        <div className="bg-card rounded-xl p-4 md:p-6 border border-border space-y-5 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 md:mb-3">
              Tipo de conteúdo
            </label>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedContentType(type.id)}
                  className={`p-3 md:p-4 rounded-xl border-2 transition-all text-center ${
                    selectedContentType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <type.icon
                    className={`w-5 h-5 md:w-6 md:h-6 mx-auto mb-1.5 md:mb-2 ${
                      selectedContentType === type.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-xs md:text-sm font-medium ${
                      selectedContentType === type.id
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo de evento
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-border bg-background text-foreground text-sm md:text-base focus:outline-none focus:border-primary"
            >
              {eventTypes.map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 md:mb-3">
              Objetivo do post
            </label>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {objectives.map((obj) => (
                <button
                  key={obj}
                  onClick={() => setSelectedObjective(obj)}
                  className={`p-2.5 md:p-3 rounded-xl border-2 transition-all text-xs md:text-sm font-medium ${
                    selectedObjective === obj
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/30 text-foreground"
                  }`}
                >
                  {obj}
                </button>
              ))}
            </div>
          </div>

          {/* Main Idea */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ideia Principal
            </label>
            <textarea
              value={mainIdea}
              onChange={(e) => setMainIdea(e.target.value)}
              placeholder="Descreva a ideia central ou mensagem que você quer comunicar nesse post..."
              className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-border bg-background text-foreground text-sm md:text-base focus:outline-none focus:border-primary resize-none min-h-[80px] md:min-h-[100px]"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Opcional: a IA usará essa ideia como base principal para gerar o conteúdo
            </p>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Data para publicação
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Auth status indicator */}
          {authLoading && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando sessão...
            </div>
          )}
          
          {!authLoading && !isSessionReady && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              Sessão inválida. Por favor, faça login novamente.
            </div>
          )}

          <Button
            variant="hero"
            size="lg"
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={isGenerating || !isSessionReady}
          >
            {authLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verificando...
              </>
            ) : isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando...
              </>
            ) : !isSessionReady ? (
              <>
                <AlertCircle className="w-5 h-5" />
                Login necessário
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar conteúdo
              </>
            )}
          </Button>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card rounded-xl p-4 md:p-6 border border-border flex items-center justify-center min-h-[300px] md:min-h-[400px]"
            >
              <div className="text-center">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-primary animate-spin mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">Gerando conteúdo com IA...</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Isso pode levar alguns segundos
                </p>
              </div>
            </motion.div>
          ) : generatedContent ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              {/* Header */}
              <div className="p-3 md:p-4 border-b border-border flex items-center justify-between bg-muted/30 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                  <span className="font-semibold text-foreground text-sm md:text-base truncate">Conteúdo Gerado</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={handleSave} className="gap-1 h-8 md:h-9 text-xs md:text-sm">
                    <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Salvar</span>
                  </Button>
                  <button
                    onClick={() => setGeneratedContent(null)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 md:p-4 space-y-3 md:space-y-4 max-h-[400px] md:max-h-[500px] overflow-y-auto">
                {/* Title */}
                <ContentSection
                  label="Título"
                  content={generatedContent.titulo}
                  onCopy={() => copyToClipboard(generatedContent.titulo, "Título")}
                  copied={copiedField === "Título"}
                />

                {/* Idea */}
                <ContentSection
                  label="Ideia Principal"
                  content={generatedContent.ideia}
                  onCopy={() => copyToClipboard(generatedContent.ideia, "Ideia")}
                  copied={copiedField === "Ideia"}
                  muted
                />

                {/* Script */}
                <ContentSection
                  label="Roteiro"
                  content={generatedContent.roteiro}
                  onCopy={() => copyToClipboard(generatedContent.roteiro, "Roteiro")}
                  copied={copiedField === "Roteiro"}
                  block
                />

                {/* Caption */}
                <ContentSection
                  label="Legenda"
                  content={generatedContent.legenda}
                  onCopy={() => copyToClipboard(generatedContent.legenda, "Legenda")}
                  copied={copiedField === "Legenda"}
                  block
                  highlight
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-muted/30 rounded-xl p-4 md:p-6 border border-dashed border-border flex items-center justify-center min-h-[250px] md:min-h-[400px]"
            >
              <div className="text-center">
                <Lightbulb className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">
                  Selecione as opções e clique em gerar
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  O conteúdo aparecerá aqui
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ContentSection({
  label,
  content,
  onCopy,
  copied,
  block,
  muted,
  highlight,
}: {
  label: string;
  content: string;
  onCopy: () => void;
  copied: boolean;
  block?: boolean;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-primary uppercase tracking-wide">
          {label}
        </span>
        <button onClick={onCopy} className="p-1 rounded hover:bg-muted transition-colors">
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
      {block ? (
        <div className={`rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap ${highlight ? "bg-primary/5 border border-primary/20" : "bg-muted/50"}`}>
          {content}
        </div>
      ) : (
        <p
          className={`${
            muted ? "text-sm text-muted-foreground" : ""
          } ${highlight ? "text-sm font-medium text-primary" : ""} ${
            !muted && !highlight ? "font-semibold text-foreground" : ""
          }`}
        >
          {content}
        </p>
      )}
    </div>
  );
}
