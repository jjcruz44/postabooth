import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, LogOut, ChevronLeft, ChevronRight, Search, 
  Sparkles, Loader2, CalendarDays, Calendar,
  Menu, X, Users, ClipboardList
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import clickarLogo from "@/assets/postabooth-logo.png";
import { useContentsDB, ContentItem } from "@/hooks/useContentsDB";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { GeneratorView } from "@/components/dashboard/GeneratorView";
import { PlannerView } from "@/components/dashboard/PlannerView";
import { MyCalendarView } from "@/components/dashboard/MyCalendarView";
import { LeadsView } from "@/components/dashboard/LeadsView";
import { ChecklistsView } from "@/components/dashboard/ChecklistsView";
import { ContentDetailModal } from "@/components/dashboard/ContentDetailModal";
import { useToast } from "@/hooks/use-toast";
import { ContentSuggestion } from "@/hooks/useContentSuggestions";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShareButton } from "@/components/dashboard/ShareButton";

type ViewType = "planejamento" | "gerador" | "meu-calendario" | "leads" | "checklists";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<ViewType>("planejamento");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ContentSuggestion | null>(null);
  
  const { contents, loading, addContent, updateStatus, deleteContent, stats } = useContentsDB();

  const navItems = [
    { id: "planejamento" as const, label: "Planejamento", icon: CalendarDays, premium: true },
    { id: "gerador" as const, label: "Gerador de Posts", icon: Sparkles, premium: false },
    { id: "meu-calendario" as const, label: "Meu Calendário", icon: Calendar, premium: false },
    { id: "leads" as const, label: "Meus Leads", icon: Users, premium: false },
    { id: "checklists" as const, label: "Checklists", icon: ClipboardList, premium: false },
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

  const handleNavClick = (viewId: ViewType) => {
    setActiveView(viewId);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
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

  // Sidebar content component for reuse
  const SidebarContent = ({ isSheet = false }: { isSheet?: boolean }) => (
    <>
      <Link 
        to="/" 
        className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border hover:bg-sidebar-accent/30 transition-colors"
        onClick={() => isSheet && setMobileMenuOpen(false)}
      >
        <img 
          src={clickarLogo} 
          alt="CLICKAR" 
          className="w-9 h-9 rounded-xl object-contain shrink-0"
        />
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-lg text-sidebar-foreground">
          CLICKAR
        </motion.span>
      </Link>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-all ${
              activeView === item.id
                ? "bg-sidebar-accent text-sidebar-primary font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-sm">{item.label}</span>
            {item.premium && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-semibold">
                Premium
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button 
          onClick={() => {
            navigate("/settings");
            if (isSheet) setMobileMenuOpen(false);
          }}
          className="w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="text-sm">Configurações</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-sm">Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile Sidebar (Drawer) */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-r border-sidebar-border">
            <div className="flex flex-col h-full">
              <SidebarContent isSheet />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 240 : 72 }}
          className="bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 relative"
        >
          <Link to="/" className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border hover:bg-sidebar-accent/30 transition-colors">
            <img 
              src={clickarLogo} 
              alt="CLICKAR" 
              className="w-9 h-9 rounded-xl object-contain shrink-0"
            />
            {sidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-lg text-sidebar-foreground">
                CLICKAR
              </motion.span>
            )}
          </Link>

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
                {sidebarOpen && item.premium && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-semibold">
                    Premium
                  </span>
                )}
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
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="h-14 md:h-16 border-b border-border bg-card flex items-center justify-between px-3 md:px-6 gap-3">
          {/* Mobile menu button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="shrink-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          <h1 className="text-base md:text-xl font-semibold text-foreground truncate">
            {navItems.find(n => n.id === activeView)?.label}
          </h1>
          
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Share button */}
            <ShareButton variant="ghost" size="sm" className="hidden sm:flex" />
            <Button variant="ghost" size="sm" className="sm:hidden w-8 h-8 p-0" onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "CLICKAR",
                  text: "Conheci o CLICKAR: ferramenta de organização e controle para empresas de foto, cabine e totem em eventos.",
                  url: "https://clickar.lovable.app/",
                });
              }
            }}>
              <span className="sr-only">Compartilhar</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
            </Button>
            
            {/* Search - hide on mobile */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar conteúdos..."
                className="pl-9 pr-4 py-2 w-64 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            {profile?.logoUrl ? (
              <img 
                src={profile.logoUrl} 
                alt="Logo da empresa" 
                className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs md:text-sm">
                {userInitials}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {activeView === "planejamento" && (
            <PlannerView />
          )}
          {activeView === "meu-calendario" && (
            <MyCalendarView />
          )}
          {activeView === "gerador" && (
            <GeneratorView 
              onSaveContent={handleSaveContent} 
              initialSuggestion={selectedSuggestion}
              onSuggestionUsed={() => setSelectedSuggestion(null)}
            />
          )}
          {activeView === "leads" && (
            <LeadsView />
          )}
          {activeView === "checklists" && (
            <ChecklistsView />
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
