import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, Calendar, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  const scrollToHowItWorks = () => {
    const element = document.getElementById("how-it-works");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
      
      {/* Floating icons */}
      <motion.div
        className="absolute top-32 right-[15%] hidden lg:block"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="bg-card p-4 rounded-2xl shadow-elevated">
          <Camera className="w-8 h-8 text-primary" />
        </div>
      </motion.div>
      
      <motion.div
        className="absolute bottom-40 left-[12%] hidden lg:block"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <div className="bg-card p-4 rounded-2xl shadow-elevated">
          <Calendar className="w-8 h-8 text-secondary" />
        </div>
      </motion.div>
      
      <motion.div
        className="absolute top-48 left-[20%] hidden lg:block"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="bg-card p-4 rounded-2xl shadow-elevated">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
      </motion.div>

      <div className="container mx-auto px-4 pt-20 pb-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>Marketing inteligente para seu negócio de fotos</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
          >
            Nunca mais fique sem saber{" "}
            <span className="text-gradient">o que postar</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Calendário editorial, roteiros prontos e ideias estratégicas criadas 
            especialmente para quem trabalha com cabines fotográficas, espelho mágico e totens.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button variant="hero" size="xl" className="group" onClick={() => navigate("/login?tab=signup")}>
              Começar gratuitamente
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" onClick={scrollToHowItWorks}>
              Ver como funciona
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background flex items-center justify-center text-primary-foreground text-xs font-bold"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>
              <strong className="text-foreground">+200 profissionais</strong> já organizaram seu marketing
            </span>
          </motion.div>
        </div>

        {/* Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="bg-card rounded-2xl shadow-elevated border border-border overflow-hidden">
            <div className="bg-muted px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-background rounded-md px-4 py-1 text-xs text-muted-foreground">
                  clickar.lovable.app/dashboard
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mini calendar preview */}
              <div className="bg-background rounded-xl p-4 border border-border">
                <div className="text-xs font-semibold text-muted-foreground mb-3">CALENDÁRIO</div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 28 }, (_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded text-xs flex items-center justify-center ${
                        [5, 10, 15, 22].includes(i)
                          ? "gradient-primary text-primary-foreground font-medium"
                          : "bg-muted/50"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Content idea preview */}
              <div className="bg-background rounded-xl p-4 border border-border">
                <div className="text-xs font-semibold text-muted-foreground mb-3">PRÓXIMO POST</div>
                <div className="space-y-2">
                  <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded w-fit">
                    Reels
                  </div>
                  <div className="font-medium text-sm text-foreground">
                    3 motivos para ter cabine no casamento
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Objetivo: Autoridade
                  </div>
                </div>
              </div>
              
              {/* Stats preview */}
              <div className="bg-background rounded-xl p-4 border border-border">
                <div className="text-xs font-semibold text-muted-foreground mb-3">ESTE MÊS</div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Posts criados</span>
                    <span className="font-bold text-foreground">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Publicados</span>
                    <span className="font-bold text-success">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prontos</span>
                    <span className="font-bold text-warning">4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
