import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Sparkles, Users, CalendarDays, ArrowRight } from "lucide-react";

const features = [
  {
    id: "planner",
    title: "Planejamento Mensal",
    description: "Planeje seu conteúdo de forma organizada com calendário estratégico e objetivos mensais.",
    icon: Calendar,
    tab: "planner",
    gradient: "from-purple-500/20 to-purple-600/10",
  },
  {
    id: "generator",
    title: "Gerador de Posts",
    description: "Criação de conteúdos otimizados para redes sociais com legendas, hashtags e roteiros.",
    icon: Sparkles,
    tab: "generator",
    gradient: "from-amber-500/20 to-amber-600/10",
  },
  {
    id: "leads",
    title: "Meus Leads",
    description: "Gerenciamento de contatos e oportunidades comerciais com classificação por temperatura.",
    icon: Users,
    tab: "leads",
    gradient: "from-emerald-500/20 to-emerald-600/10",
  },
  {
    id: "events",
    title: "Meus Eventos",
    description: "Gerenciamento completo de eventos com datas, status, checklists e contratos.",
    icon: CalendarDays,
    tab: "events",
    gradient: "from-blue-500/20 to-blue-600/10",
  },
];

export default function WelcomeTour() {
  const navigate = useNavigate();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleNavigate = (tab: string) => {
    if (dontShowAgain) {
      localStorage.setItem("hideTour", "true");
    }
    navigate(`/dashboard?tab=${tab}`);
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem("hideTour", "true");
    }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Bem-vindo ao PostaBooth! 🎉
            </h1>
            <p className="text-muted-foreground text-lg">
              Conheça as principais funcionalidades para impulsionar seu negócio de eventos.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Feature Cards */}
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className={`h-full bg-gradient-to-br ${feature.gradient} border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                    <Button
                      onClick={() => handleNavigate(feature.tab)}
                      variant="outline"
                      className="w-full group"
                    >
                      Explorar
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 md:p-8 border-t border-border/50 bg-muted/20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="dontShow"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label
              htmlFor="dontShow"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Não mostrar novamente
            </label>
          </div>
          <Button onClick={handleSkip} size="lg" className="min-w-[200px]">
            Ir para o Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
