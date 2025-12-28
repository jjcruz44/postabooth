import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Calendar, Lightbulb, FolderOpen, LayoutGrid, Settings, LogOut,
  Plus, ChevronLeft, ChevronRight, Search, Bell, MoreHorizontal,
  Video, Image, MessageSquare, Target, Sparkles, Loader2, Copy, Check, X, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ContentStatus = "ideia" | "producao" | "pronto" | "publicado";
type ContentType = "reels" | "carrossel" | "stories";

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  objective: string;
  date: string;
  eventType: string;
}

interface GeneratedContent {
  titulo: string;
  ideia: string;
  roteiro: string;
  legenda: string;
  cta: string;
  hashtags: string[];
}

const sampleContent: ContentItem[] = [
  {
    id: "1",
    title: "3 motivos para ter cabine no casamento",
    type: "reels",
    status: "pronto",
    objective: "Autoridade",
    date: "2024-01-15",
    eventType: "Casamento"
  },
  {
    id: "2",
    title: "Bastidores: montagem do espelho mágico",
    type: "stories",
    status: "producao",
    objective: "Prova Social",
    date: "2024-01-16",
    eventType: "Corporativo"
  },
  {
    id: "3",
    title: "Antes vs Depois: fotos com e sem cabine",
    type: "carrossel",
    status: "ideia",
    objective: "Atração",
    date: "2024-01-18",
    eventType: "15 Anos"
  },
  {
    id: "4",
    title: "Depoimento de noiva emocionada",
    type: "reels",
    status: "publicado",
    objective: "Prova Social",
    date: "2024-01-12",
    eventType: "Casamento"
  },
  {
    id: "5",
    title: "5 perguntas que todo contratante faz",
    type: "carrossel",
    status: "ideia",
    objective: "Venda",
    date: "2024-01-20",
    eventType: "Geral"
  },
];

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

const typeIcons: Record<ContentType, React.ElementType> = {
  reels: Video,
  carrossel: Image,
  stories: MessageSquare,
};

const contentTypes = [
  { id: "reels" as const, label: "Reels", icon: Video },
  { id: "carrossel" as const, label: "Carrossel", icon: Image },
  { id: "stories" as const, label: "Stories", icon: MessageSquare },
];

const eventTypes = ["Casamento", "Corporativo", "15 Anos", "Infantil", "Formatura"];
const objectives = ["Atração", "Autoridade", "Prova Social", "Venda"];

const Dashboard = () => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"calendario" | "conteudos" | "biblioteca" | "gerador">("calendario");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Generator state
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("reels");
  const [selectedEventType, setSelectedEventType] = useState("Casamento");
  const [selectedObjective, setSelectedObjective] = useState("Autoridade");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const navItems = [
    { id: "calendario" as const, label: "Calendário", icon: Calendar },
    { id: "conteudos" as const, label: "Conteúdos", icon: LayoutGrid },
    { id: "gerador" as const, label: "Gerador", icon: Sparkles },
    { id: "biblioteca" as const, label: "Biblioteca", icon: FolderOpen },
  ];

  const stats = [
    { label: "Ideias", value: 2, color: "text-muted-foreground" },
    { label: "Em produção", value: 1, color: "text-warning" },
    { label: "Prontos", value: 1, color: "text-info" },
    { label: "Publicados", value: 1, color: "text-success" },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          contentType: selectedContentType,
          eventType: selectedEventType,
          objective: selectedObjective,
        }
      });

      if (error) throw error;

      setGeneratedContent(data);
      toast({
        title: "Conteúdo gerado!",
        description: "Seu conteúdo foi criado com sucesso.",
      });
    } catch (error: unknown) {
      console.error('Error generating content:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao gerar conteúdo. Tente novamente.";
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

  const clearGeneratedContent = () => {
    setGeneratedContent(null);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 72 }}
        className="bg-sidebar border-r border-sidebar-border flex flex-col shrink-0"
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg text-sidebar-foreground"
            >
              PostaBooth
            </motion.span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                activeView === item.id
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all">
            <Settings className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm">Configurações</span>}
          </button>
          <Link 
            to="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm">Sair</span>}
          </Link>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          style={{ left: sidebarOpen ? 234 : 66 }}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground">
              {navItems.find(n => n.id === activeView)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar conteúdos..."
                className="pl-9 pr-4 py-2 w-64 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              CM
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeView === "calendario" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-card rounded-xl p-4 border border-border">
                    <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Calendar header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">Janeiro 2024</h2>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <Button className="gap-2" onClick={() => setActiveView("gerador")}>
                  <Plus className="w-4 h-4" />
                  Novo conteúdo
                </Button>
              </div>

              {/* Calendar grid */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Week days */}
                <div className="grid grid-cols-7 border-b border-border">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                    <div key={day} className="px-3 py-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 0;
                    const isCurrentMonth = day >= 1 && day <= 31;
                    const content = sampleContent.find(c => {
                      const contentDay = parseInt(c.date.split("-")[2]);
                      return contentDay === day;
                    });

                    return (
                      <div
                        key={i}
                        className={`min-h-24 p-2 border-b border-r border-border last:border-r-0 ${
                          !isCurrentMonth ? "bg-muted/30" : ""
                        }`}
                      >
                        {isCurrentMonth && (
                          <>
                            <div className={`text-sm mb-1 ${day === 15 ? "w-6 h-6 rounded-full gradient-primary text-primary-foreground flex items-center justify-center" : "text-muted-foreground"}`}>
                              {day}
                            </div>
                            {content && (
                              <div className="bg-primary/10 rounded-md p-1.5 text-xs">
                                <div className="flex items-center gap-1 text-primary font-medium truncate">
                                  {(() => {
                                    const Icon = typeIcons[content.type];
                                    return <Icon className="w-3 h-3 shrink-0" />;
                                  })()}
                                  <span className="truncate">{content.title}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeView === "conteudos" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center gap-3">
                <select className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary">
                  <option>Todos os status</option>
                  <option>Ideia</option>
                  <option>Em produção</option>
                  <option>Pronto</option>
                  <option>Publicado</option>
                </select>
                <select className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary">
                  <option>Todos os tipos</option>
                  <option>Reels</option>
                  <option>Carrossel</option>
                  <option>Stories</option>
                </select>
                <div className="flex-1" />
                <Button className="gap-2" onClick={() => setActiveView("gerador")}>
                  <Plus className="w-4 h-4" />
                  Novo conteúdo
                </Button>
              </div>

              {/* Content list */}
              <div className="grid gap-4">
                {sampleContent.map((content) => {
                  const TypeIcon = typeIcons[content.type];
                  return (
                    <motion.div
                      key={content.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card rounded-xl p-4 border border-border hover:border-primary/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <TypeIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-medium text-foreground">{content.title}</h3>
                            <button className="p-1 rounded hover:bg-muted">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[content.status]}`}>
                              {statusLabels[content.status]}
                            </span>
                            <span className="text-muted-foreground">{content.type}</span>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {content.objective}
                            </span>
                            <span className="text-muted-foreground">{content.eventType}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeView === "gerador" && (
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
                          <type.icon className={`w-6 h-6 mx-auto mb-2 ${selectedContentType === type.id ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-sm font-medium ${selectedContentType === type.id ? "text-primary" : "text-foreground"}`}>{type.label}</span>
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
                      {eventTypes.map(event => (
                        <option key={event} value={event}>{event}</option>
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

                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full gap-2"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Gerando...
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
                        <p className="text-sm text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
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
                        <button 
                          onClick={clearGeneratedContent}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                        {/* Title */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">Título</span>
                            <button 
                              onClick={() => copyToClipboard(generatedContent.titulo, "Título")}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              {copiedField === "Título" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          </div>
                          <p className="font-semibold text-foreground">{generatedContent.titulo}</p>
                        </div>

                        {/* Idea */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">Ideia</span>
                            <button 
                              onClick={() => copyToClipboard(generatedContent.ideia, "Ideia")}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              {copiedField === "Ideia" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground">{generatedContent.ideia}</p>
                        </div>

                        {/* Script */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">Roteiro</span>
                            <button 
                              onClick={() => copyToClipboard(generatedContent.roteiro, "Roteiro")}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              {copiedField === "Roteiro" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
                            {generatedContent.roteiro}
                          </div>
                        </div>

                        {/* Caption */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">Legenda</span>
                            <button 
                              onClick={() => copyToClipboard(generatedContent.legenda, "Legenda")}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              {copiedField === "Legenda" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
                            {generatedContent.legenda}
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">CTA</span>
                            <button 
                              onClick={() => copyToClipboard(generatedContent.cta, "CTA")}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              {copiedField === "CTA" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          </div>
                          <p className="text-sm font-medium text-primary">{generatedContent.cta}</p>
                        </div>

                        {/* Hashtags */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-primary uppercase tracking-wide flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              Hashtags
                            </span>
                            <button 
                              onClick={() => copyToClipboard(generatedContent.hashtags.map(h => `#${h}`).join(" "), "Hashtags")}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              {copiedField === "Hashtags" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {generatedContent.hashtags.map((tag, i) => (
                              <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
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
                        <p className="text-muted-foreground">Selecione as opções e clique em gerar</p>
                        <p className="text-sm text-muted-foreground mt-1">O conteúdo aparecerá aqui</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeView === "biblioteca" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Conteúdo sem evento", count: 12, color: "from-primary to-secondary" },
                  { title: "Autoridade", count: 8, color: "from-blue-500 to-blue-600" },
                  { title: "Prova social", count: 15, color: "from-emerald-500 to-emerald-600" },
                  { title: "Educativo", count: 6, color: "from-purple-500 to-purple-600" },
                  { title: "Emocional", count: 10, color: "from-pink-500 to-pink-600" },
                  { title: "Fechamento", count: 5, color: "from-amber-500 to-amber-600" },
                ].map((category) => (
                  <motion.div
                    key={category.title}
                    whileHover={{ scale: 1.02 }}
                    className="bg-card rounded-xl p-5 border border-border cursor-pointer hover:shadow-soft transition-all"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} ideias</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
