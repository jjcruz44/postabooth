import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Camera, Calendar, FolderOpen, LayoutGrid, Settings, LogOut,
  ChevronLeft, ChevronRight, Search, Bell, Sparkles, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContentsDB, ContentItem } from "@/hooks/useContentsDB";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { ContentsView } from "@/components/dashboard/ContentsView";
import { GeneratorView } from "@/components/dashboard/GeneratorView";
import { LibraryView } from "@/components/dashboard/LibraryView";
import { ContentDetailModal } from "@/components/dashboard/ContentDetailModal";
import { useToast } from "@/hooks/use-toast";
import { ContentSuggestion } from "@/hooks/useContentSuggestions";

type ViewType = "calendario" | "conteudos" | "biblioteca" | "gerador";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<ViewType>("calendario");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ContentSuggestion | null>(null);
  
  const { contents, loading, addContent, updateStatus, deleteContent, stats } = useContentsDB();

  const navItems = [
    { id: "calendario" as const, label: "Calendário", icon: Calendar },
    { id: "conteudos" as const, label: "Conteúdos", icon: LayoutGrid },
    { id: "gerador" as const, label: "Gerador", icon: Sparkles },
    { id: "biblioteca" as const, label: "Biblioteca", icon: FolderOpen },
  ];

  const handleSaveContent = async (content: {
    title: string;
    type: "reels" | "carrossel" | "stories";
    objective: string;
    eventType: string;
    roteiro: string;
    legenda: string;
    cta: string;
    hashtags: string[];
    date: string;
  }) => {
    await addContent({
      title: content.title,
      type: content.type,
      status: "ideia",
      objective: content.objective,
      date: content.date,
      eventType: content.eventType,
      roteiro: content.roteiro,
      legenda: content.legenda,
      cta: content.cta,
      hashtags: content.hashtags,
    });
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Até logo!",
      description: "Você saiu da sua conta.",
    });
    navigate("/");
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando seus conteúdos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 72 }}
        className="bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 relative"
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-lg text-sidebar-foreground">
              PostaBooth
            </motion.span>
          )}
        </div>

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
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button 
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
          >
            <Settings className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm">Configurações</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm">Sair</span>}
          </button>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">
            {navItems.find(n => n.id === activeView)?.label}
          </h1>
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
              {userInitials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {activeView === "calendario" && (
            <CalendarView
              contents={contents}
              stats={stats}
              onNewContent={() => setActiveView("gerador")}
              onSelectContent={setSelectedContent}
            />
          )}
          {activeView === "conteudos" && (
            <ContentsView
              contents={contents}
              onUpdateStatus={updateStatus}
              onDelete={deleteContent}
              onNewContent={() => setActiveView("gerador")}
              onSelectContent={setSelectedContent}
            />
          )}
          {activeView === "gerador" && (
            <GeneratorView 
              onSaveContent={handleSaveContent} 
              initialSuggestion={selectedSuggestion}
              onSuggestionUsed={() => setSelectedSuggestion(null)}
            />
          )}
          {activeView === "biblioteca" && (
            <LibraryView 
              contents={contents} 
              onSelectContent={setSelectedContent}
              onDeleteContent={deleteContent}
              onUseSuggestion={(suggestion) => {
                setSelectedSuggestion(suggestion);
                setActiveView("gerador");
              }}
            />
          )}
        </main>
      </div>

      <ContentDetailModal
        content={selectedContent}
        onClose={() => setSelectedContent(null)}
        onUpdateStatus={(id, status) => {
          updateStatus(id, status);
          setSelectedContent((prev) => prev ? { ...prev, status } : null);
        }}
      />
    </div>
  );
};

export default Dashboard;
