import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Video, Image, MessageSquare, Loader2, Copy, Check, X, Hash, Lightbulb, Save, CalendarIcon, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContentType } from "@/hooks/useContentsDB";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface StorySlide {
  conteudo: string;
  elemento_interativo_sugerido?: string;
}

interface CarouselSlide {
  numero?: number;
  titulo?: string;
  conteudo?: string;
  sugestao_visual?: string;
}

type RoteiroType = string | StorySlide[] | CarouselSlide[];

interface GeneratedContent {
  titulo: string;
  ideia: string;
  roteiro: RoteiroType;
  legenda: string;
  cta: string;
  hashtags: string[];
}

function formatRoteiro(roteiro: RoteiroType): string {
  if (typeof roteiro === "string") {
    return roteiro;
  }
  
  if (Array.isArray(roteiro)) {
    return roteiro
      .map((item, index) => {
        // Handle string items in array
        if (typeof item === "string") {
          return item;
        }
        
        // Ensure item is an object before using 'in' operator
        if (item && typeof item === "object") {
          if ("conteudo" in item) {
            // Stories format
            const storyItem = item as StorySlide;
            let text = `Story ${index + 1}: ${storyItem.conteudo}`;
            if (storyItem.elemento_interativo_sugerido) {
              text += `\n  → Interativo: ${storyItem.elemento_interativo_sugerido}`;
            }
            return text;
          } else if ("titulo" in item || "numero" in item) {
            // Carousel format
            const carouselItem = item as CarouselSlide;
            let text = `Slide ${carouselItem.numero || index + 1}`;
            if (carouselItem.titulo) text += `: ${carouselItem.titulo}`;
            if (carouselItem.conteudo) text += `\n  ${carouselItem.conteudo}`;
            if (carouselItem.sugestao_visual) text += `\n  → Visual: ${carouselItem.sugestao_visual}`;
            return text;
          }
        }
        
        return typeof item === "object" ? JSON.stringify(item) : String(item);
      })
      .join("\n\n");
  }
  
  return String(roteiro);
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
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("reels");
  const [selectedEventType, setSelectedEventType] = useState("Casamento");
  const [selectedObjective, setSelectedObjective] = useState("Autoridade");
  const [mainIdea, setMainIdea] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Check if session is ready for API calls
  const isSessionReady = !authLoading && session !== null && !!session.access_token;

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

  const handleSave = () => {
    if (!generatedContent) return;

    onSaveContent({
      title: generatedContent.titulo,
      type: selectedContentType,
      objective: selectedObjective,
      eventType: selectedEventType,
      roteiro: formatRoteiro(generatedContent.roteiro),
      legenda: generatedContent.legenda,
      cta: generatedContent.cta,
      hashtags: generatedContent.hashtags,
      date: selectedDate ? selectedDate.toISOString().split("T")[0] : undefined,
    });

    toast({
      title: "Conteúdo salvo!",
      description: selectedDate 
        ? `Agendado para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}.`
        : "Salvo em Posts Avulsos.",
    });

    setGeneratedContent(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Gerador de Conteúdo com IA
        </h2>
        <p className="text-muted-foreground">
          Crie roteiros, legendas e hashtags em segundos
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Tipo de conteúdo
            </label>
            <div className="grid grid-cols-3 gap-3">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedContentType(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedContentType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <type.icon
                    className={`w-6 h-6 mx-auto mb-2 ${
                      selectedContentType === type.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
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
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary"
            >
              {eventTypes.map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Objetivo do post
            </label>
            <div className="grid grid-cols-2 gap-3">
              {objectives.map((obj) => (
                <button
                  key={obj}
                  onClick={() => setSelectedObjective(obj)}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
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
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary resize-none min-h-[100px]"
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
              className="bg-card rounded-xl p-6 border border-border flex items-center justify-center min-h-[400px]"
            >
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Gerando conteúdo com IA...</p>
                <p className="text-sm text-muted-foreground mt-1">
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
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Conteúdo Gerado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSave} className="gap-1">
                    <Save className="w-4 h-4" />
                    Salvar
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
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {/* Title */}
                <ContentSection
                  label="Título"
                  content={generatedContent.titulo}
                  onCopy={() => copyToClipboard(generatedContent.titulo, "Título")}
                  copied={copiedField === "Título"}
                />

                {/* Idea */}
                <ContentSection
                  label="Ideia"
                  content={generatedContent.ideia}
                  onCopy={() => copyToClipboard(generatedContent.ideia, "Ideia")}
                  copied={copiedField === "Ideia"}
                  muted
                />

                {/* Script */}
                <ContentSection
                  label="Roteiro"
                  content={formatRoteiro(generatedContent.roteiro)}
                  onCopy={() => copyToClipboard(formatRoteiro(generatedContent.roteiro), "Roteiro")}
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
                />

                {/* CTA */}
                <ContentSection
                  label="CTA"
                  content={generatedContent.cta}
                  onCopy={() => copyToClipboard(generatedContent.cta, "CTA")}
                  copied={copiedField === "CTA"}
                  highlight
                />

                {/* Hashtags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary uppercase tracking-wide flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Hashtags
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          generatedContent.hashtags.map((h) => `#${h}`).join(" "),
                          "Hashtags"
                        )
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
                    {generatedContent.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-muted/30 rounded-xl p-6 border border-dashed border-border flex items-center justify-center min-h-[400px]"
            >
              <div className="text-center">
                <Lightbulb className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Selecione as opções e clique em gerar
                </p>
                <p className="text-sm text-muted-foreground mt-1">
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
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
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
